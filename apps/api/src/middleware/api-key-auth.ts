import { Context, Next } from 'hono';
import { db } from '@repo/db';
import { apiKeysTable } from '@repo/db/src/schema';
import { eq, sql } from 'drizzle-orm';
import { hashApiKey } from '../lib/api-key';
import { UnauthorizedError, ForbiddenError, RateLimitError } from '../lib/error';
import { env } from '../lib/env';

/**
 * Extracts the API key from the request.
 * Supports:
 *   - Authorization: Bearer ofd_xxx
 *   - X-API-Key: ofd_xxx
 */
function extractApiKey(c: Context): string | null {
  // Try Authorization header first
  const authHeader = c.req.header('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1]!;
  }

  // Fall back to X-API-Key header
  const xApiKey = c.req.header('x-api-key');
  if (xApiKey) return xApiKey;

  return null;
}

/** In-memory per-key rate limit tracking */
const keyRateLimits = new Map<number, { count: number; resetTime: number }>();

/** Clean up expired entries every 60s */
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(keyRateLimits.entries());
  for (const [key, value] of entries) {
    if (value.resetTime < now) keyRateLimits.delete(key);
  }
}, 60_000);

/**
 * Middleware that requires a valid API key on every request.
 *
 * Skip paths can be configured below (health checks, docs, OpenAPI spec).
 */
export async function apiKeyAuthMiddleware(c: Context, next: Next) {
  const path = c.req.path;

  // Allow health checks, docs, OpenAPI spec, and admin routes without an API key
  // (admin routes enforce their own MASTER_KEY auth)
  const publicPaths = ['/health', '/health/db', '/swagger-docs', '/docs', '/openapi.json'];
  const prefix = env.API_PREFIX;
  const isPublic = publicPaths.some(
    (p) => path === `${prefix}${p}` || path === p,
  );
  const isAdmin = path.startsWith(`${prefix}/admin`);
  if (isPublic || isAdmin) {
    await next();
    return;
  }

  const plaintextKey = extractApiKey(c);
  if (!plaintextKey) {
    throw new UnauthorizedError(
      'Missing API key. Provide it via "Authorization: Bearer <key>" or "X-API-Key: <key>" header.',
    );
  }

  // Hash the provided key and look it up
  const keyHash = hashApiKey(plaintextKey);

  const [keyRecord] = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.keyHash, keyHash))
    .limit(1);

  if (!keyRecord) {
    throw new UnauthorizedError('Invalid API key.');
  }

  // Check revocation
  if (keyRecord.revoked) {
    throw new ForbiddenError('This API key has been revoked.');
  }

  // Check expiration
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    throw new ForbiddenError('This API key has expired.');
  }

  // Per-key rate limiting
  const windowSecs = keyRecord.rateLimitWindowSecs ?? 60;
  const maxReqs = keyRecord.rateLimitMax ?? parseInt(env.RATE_LIMIT_MAX);
  const windowMs = windowSecs * 1000;
  const now = Date.now();
  const record = keyRateLimits.get(keyRecord.id);

  if (!record || record.resetTime < now) {
    keyRateLimits.set(keyRecord.id, { count: 1, resetTime: now + windowMs });
  } else {
    record.count++;
    if (record.count > maxReqs) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new RateLimitError(
        `API key rate limit exceeded. Retry after ${retryAfter}s`,
      );
    }
  }

  // Update usage stats asynchronously (fire-and-forget, don't block the request)
  db.update(apiKeysTable)
    .set({
      requestCount: sql`${apiKeysTable.requestCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(eq(apiKeysTable.id, keyRecord.id))
    .execute()
    .catch((err) => console.error('Failed to update API key usage:', err));

  // Attach key metadata to the context for downstream use
  c.set('apiKey', {
    id: keyRecord.id,
    name: keyRecord.name,
    owner: keyRecord.owner,
    scopes: keyRecord.scopes,
  });

  await next();
}
