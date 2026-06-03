import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { auth } from '../routes/auth';
import { UnauthorizedError } from '../lib/error';

/**
 * Extracts session token from cookie or Authorization header.
 */
function extractSessionToken(c: Context): string | null {
  // Try cookie first
  const cookie = getCookie(c, 'better-auth.session_token');
  if (cookie) return cookie;

  // Fall back to Authorization header
  const authHeader = c.req.header('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Middleware that requires a valid session on protected routes.
 */
export async function requireSession(c: Context, next: Next) {
  const token = extractSessionToken(c);
  if (!token) {
    throw new UnauthorizedError('Authentication required. Please sign in.');
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw new UnauthorizedError('Session expired or invalid. Please sign in again.');
  }

  // Attach user to context for downstream use
  c.set('user', session.user);
  c.set('session', session);

  await next();
}

/**
 * Optional session middleware - attaches user if session exists but doesn't require it.
 */
export async function optionalSession(c: Context, next: Next) {
  const token = extractSessionToken(c);
  if (token) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (session) {
      c.set('user', session.user);
      c.set('session', session);
    }
  }

  await next();
}
