import type { Context, Next } from 'hono';
import { UnauthorizedError, ForbiddenError } from '../lib/error';
import { env } from '@repo/env-manager';
import { auth } from '../routes/auth';
import { isMasterApiKey } from '../lib/master-access';

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

/**
 * Middleware that requires a valid API key on every request.
 *
 * Uses better-auth/api-key plugin for validation.
 */
export async function apiKeyAuthMiddleware(c: Context, next: Next) {
  const path = c.req.path;

  // Allow health checks, docs, OpenAPI spec, and auth settings without an API key.
  // Admin and Better Auth routes are public only outside API_ONLY; admin routes enforce their own session auth.
  const publicPaths = ['/health', '/health/db', '/swagger-docs', '/docs', '/openapi.json', '/auth/settings'];
  const prefix = env.API_PREFIX;
  const isPublic = publicPaths.some((p) => path === `${prefix}${p}` || path === p);
  const isAuth = !env.API_ONLY && (path.startsWith(`${prefix}/auth`) || path.startsWith(`${prefix}/api-key`));
  const isAdmin = !env.API_ONLY && path.startsWith(`${prefix}/admin`);
  if (isPublic || isAuth || isAdmin) {
    await next();
    return;
  }

  const plaintextKey = extractApiKey(c);
  if (!plaintextKey) {
    throw new UnauthorizedError(
      'Missing API key. Provide it via "Authorization: Bearer <key>" or "X-API-Key: <key>" header.',
    );
  }

  if (isMasterApiKey(plaintextKey)) {
    const masterApiKey = {
      id: 'master',
      name: 'Master API Key',
      enabled: true,
      referenceId: 'master',
    };

    c.set('apiKey', masterApiKey);
    c.set('apiKeyId', masterApiKey.id);
    c.set('apiKeyName', masterApiKey.name);

    await next();
    return;
  }

  if (env.API_ONLY) {
    throw new UnauthorizedError('Invalid API key. API_ONLY mode accepts only the startup master API key.');
  }

  try {
    // Verify the key via better-auth API key plugin
    const result = (await auth.api.verifyApiKey({
      body: {
        key: plaintextKey,
      },
    })) as { key?: { id: string; name?: string; enabled?: boolean; expiresAt?: Date } };

    if (!result) {
      throw new UnauthorizedError('Invalid API key.');
    }

    const apiKey = (result as any).key;

    if (!apiKey) {
      throw new UnauthorizedError('Invalid API key.');
    }

    if (apiKey.enabled === false) {
      throw new ForbiddenError('This API key has been disabled.');
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      throw new ForbiddenError('This API key has expired.');
    }

    // Log the request with the API key details
    c.set('apiKey', apiKey);
    c.set('apiKeyId', apiKey.id);
    c.set('apiKeyName', apiKey.name);

    await next();
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    // Wrap any other errors
    throw new UnauthorizedError('Invalid API key.');
  }
}
