import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@repo/db';
import { apiKeysTable } from '@repo/db/src/schema';
import { generateApiKey } from '../src/lib/api-key';

process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.API_KEY_AUTH_ENABLED = 'true';
process.env.SWAGGER_ENABLED = 'true';

const { createApp } = await import('../src/app');
const app = createApp({ enableApiKeyAuth: true });

const prefix = '/api/v1';

async function createTestKey(overrides: Record<string, unknown> = {}) {
  const { plaintextKey, keyPrefix, keyHash } = generateApiKey();
  const [record] = await db
    .insert(apiKeysTable)
    .values({
      keyPrefix,
      keyHash,
      name: `auth-test-${randomUUID()}`,
      owner: `owner-${randomUUID()}`,
      scopes: null,
      rateLimitMax: 100,
      rateLimitWindowSecs: 60,
      expiresAt: null,
      revoked: false,
      ...overrides,
    })
    .returning();

  return {
    plaintextKey,
    id: record.id,
  };
}

describe('API key auth middleware', () => {
  test('GET /foods/search should reject requests without an API key', async () => {
    const res = await app.request(`${prefix}/foods/search?q=a&limit=1`);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /foods/search should accept Authorization and X-API-Key headers', async () => {
    const { plaintextKey, id } = await createTestKey();

    try {
      const authRes = await app.request(`${prefix}/foods/search?q=a&limit=1`, {
        headers: {
          Authorization: `Bearer ${plaintextKey}`,
        },
      });
      expect(authRes.status).toBe(200);
      const authBody = await authRes.json();
      expect(Array.isArray(authBody)).toBe(true);

      const headerRes = await app.request(`${prefix}/foods/search?q=a&limit=1`, {
        headers: {
          'X-API-Key': plaintextKey,
        },
      });
      expect(headerRes.status).toBe(200);
      const headerBody = await headerRes.json();
      expect(Array.isArray(headerBody)).toBe(true);

      const statsRes = await app.request(`${prefix}/health/stats`, {
        headers: {
          Authorization: `Bearer ${plaintextKey}`,
        },
      });
      expect(statsRes.status).toBe(200);
      const statsBody = await statsRes.json();
      expect(statsBody.counts).toHaveProperty('foods');
    } finally {
      await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
    }
  });

  test('GET /foods/search should reject revoked API keys', async () => {
    const { plaintextKey, id } = await createTestKey({ revoked: true });

    try {
      const res = await app.request(`${prefix}/foods/search?q=a&limit=1`, {
        headers: {
          Authorization: `Bearer ${plaintextKey}`,
        },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    } finally {
      await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
    }
  });

  test('GET /foods/search should reject expired API keys', async () => {
    const { plaintextKey, id } = await createTestKey({ expiresAt: new Date(Date.now() - 60_000) });

    try {
      const res = await app.request(`${prefix}/foods/search?q=a&limit=1`, {
        headers: {
          Authorization: `Bearer ${plaintextKey}`,
        },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    } finally {
      await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
    }
  });

  test('GET /swagger-docs should remain public', async () => {
    const res = await app.request('/swagger-docs');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });
});
