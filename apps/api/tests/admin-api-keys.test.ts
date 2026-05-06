import { env } from '@repo/env-manager';
import { db } from '@repo/db';
import { apiKeysTable } from '@repo/db/src/schema';

import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.API_KEY_AUTH_ENABLED = 'false';
process.env.SWAGGER_ENABLED = 'true';

const { default: app } = await import('../src/app');
const prefix = '/api/v1';
const masterAuthHeader = `Bearer ${env.MASTER_KEY}`;

function adminRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', masterAuthHeader);

  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return app.request(`${prefix}/admin/api-keys${path}`, {
    ...init,
    headers,
  });
}

describe('Admin API key routes', () => {
  test('GET /admin/api-keys/overview/stats should return dashboard metrics', async () => {
    const res = await adminRequest('/overview/stats');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.server).toHaveProperty('uptime');
    expect(body.dataset).toHaveProperty('foods');
    expect(body.apiKeys).toHaveProperty('total');
    expect(body.apiKeys).toHaveProperty('totalRequests');
  });

  test('POST /admin/api-keys should reject missing master key', async () => {
    const res = await app.request(`${prefix}/admin/api-keys`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: `unauthorized-${randomUUID()}`,
        owner: `owner-${randomUUID()}`,
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('POST /admin/api-keys, GET, revoke, delete should work end-to-end', async () => {
    const owner = `owner-${randomUUID()}`;
    const name = `integration-${randomUUID()}`;

    const createRes = await adminRequest('', {
      method: 'POST',
      body: JSON.stringify({
        name,
        owner,
        scopes: ['read', 'write'],
        rateLimitMax: 7,
        rateLimitWindowSecs: 120,
        expiresInDays: 1,
      }),
    });

    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    const id = createBody.apiKey.id as number;

    try {
      expect(createBody.success).toBe(true);
      expect(createBody.key.startsWith('ofd_')).toBe(true);
      expect(createBody.apiKey.name).toBe(name);
      expect(createBody.apiKey.owner).toBe(owner);
      expect(createBody.apiKey.scopes).toEqual(['read', 'write']);
      expect(createBody.apiKey.rateLimitMax).toBe(7);
      expect(createBody.apiKey.rateLimitWindowSecs).toBe(120);
      expect(createBody.apiKey.requestCount).toBe(0);
      expect(createBody.apiKey.revoked).toBe(false);
      expect(createBody.apiKey.expiresAt).not.toBeNull();

      const listRes = await adminRequest(`?limit=50&offset=0&owner=${encodeURIComponent(owner)}`);
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.success).toBe(true);
      expect(listBody.keys).toHaveLength(1);
      expect(listBody.keys[0].id).toBe(id);

      const getRes = await adminRequest(`/${id}`);
      expect(getRes.status).toBe(200);
      const getBody = await getRes.json();
      expect(getBody.success).toBe(true);
      expect(getBody.apiKey.id).toBe(id);
      expect(getBody.apiKey.name).toBe(name);

      const revokeRes = await adminRequest(`/${id}/revoke`, { method: 'POST' });
      expect(revokeRes.status).toBe(200);
      const revokeBody = await revokeRes.json();
      expect(revokeBody.success).toBe(true);
      expect(revokeBody.apiKey.revoked).toBe(true);
      expect(revokeBody.apiKey.revokedAt).not.toBeNull();

      const deleteRes = await adminRequest(`/${id}`, { method: 'DELETE' });
      expect(deleteRes.status).toBe(200);
      const deleteBody = await deleteRes.json();
      expect(deleteBody.success).toBe(true);
      expect(deleteBody.message).toContain(String(id));

      const missingRes = await adminRequest(`/${id}`);
      expect(missingRes.status).toBe(404);
      const missingBody = await missingRes.json();
      expect(missingBody.success).toBe(false);
      expect(missingBody.error.code).toBe('NOT_FOUND');
    } finally {
      await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
    }
  });
});
