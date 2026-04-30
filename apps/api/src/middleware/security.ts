import { Context, Next } from 'hono';
import { nanoid } from 'nanoid';
import { env } from '../lib/env';
import { RateLimitError } from '../lib/error';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(c: Context): string {
  const ip =
    c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.header('cf-connecting-ip') || 'unknown';
  return `${ip}:${c.req.path}`;
}

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupRateLimitStore, 60000);

export async function rateLimitMiddleware(c: Context, next: Next) {
  if (!env.RATE_LIMIT_ENABLED || env.NODE_ENV === 'test') {
    await next();
    return;
  }

  const key = getRateLimitKey(c);
  const windowMs = env.RATE_LIMIT_WINDOW === '1m' ? 60000 : env.RATE_LIMIT_WINDOW === '1h' ? 3600000 : 60000;
  const maxRequests = parseInt(env.RATE_LIMIT_MAX);

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    record.count++;
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new RateLimitError(`Rate limit exceeded. Retry after ${retryAfter}s`);
    }
  }

  await next();
}

export async function securityHeaders(c: Context, next: Next) {
  await next();

  c.res.headers.set('X-Request-ID', c.get('requestId'));
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (env.NODE_ENV === 'production') {
    c.res.headers.set('Content-Security-Policy', "default-src 'self'");
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
}

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('origin');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 204, {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN === '*' ? '*' : origin || '',
      'Access-Control-Allow-Methods': env.CORS_METHODS,
      'Access-Control-Allow-Headers': env.CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    });
  }

  await next();

  c.res.headers.set('Access-Control-Allow-Origin', env.CORS_ORIGIN === '*' ? '*' : origin || '');
  c.res.headers.set('Access-Control-Allow-Methods', env.CORS_METHODS);
  c.res.headers.set('Access-Control-Allow-Headers', env.CORS_HEADERS);
}

export async function requestIdMiddleware(c: Context, next: Next) {
  const requestId = c.req.header(env.REQUEST_ID_HEADER) || nanoid();
  c.set('requestId', requestId);
  await next();
}
