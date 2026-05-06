import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { auth } from '../lib/auth';
import { setCookie, deleteCookie } from 'hono/cookie';
import { env } from '@repo/env-manager';

const routes = new OpenAPIHono();

// ─── Get Current Session ─────────────────────────────────────────────────
// Uses better-auth's built-in session endpoint

const getSessionRoute = createRoute({
  method: 'get',
  path: '/session',
  tags: ['Authentication'],
  summary: 'Get current session',
  description: 'Get the current authenticated user session.',
  responses: {
    200: {
      description: 'Current session',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            user: z
              .object({
                id: z.string(),
                email: z.string(),
                name: z.string().nullable(),
                image: z.string().nullable(),
                createdAt: z.string(),
              })
              .nullable(),
            session: z
              .object({
                token: z.string(),
                expiresAt: z.string(),
              })
              .nullable(),
          }),
        },
      },
    },
  },
});

routes.openapi(getSessionRoute, async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  return c.json({
    success: true,
    user: session
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          createdAt: session.user.createdAt?.toISOString() ?? new Date().toISOString(),
        }
      : null,
    session: session
      ? {
          token: session.session.token,
          expiresAt: session.session.expiresAt?.toISOString() ?? '',
        }
      : null,
  });
});

// ─── Sign Out ────────────────────────────────────────────────────────────────────

const signOutRoute = createRoute({
  method: 'post',
  path: '/sign-out',
  tags: ['Authentication'],
  summary: 'Sign out',
  description: 'End the current session.',
  responses: {
    200: { description: 'Signed out successfully' },
  },
});

routes.openapi(signOutRoute, async (c) => {
  try {
    await auth.api.signOut({
      headers: c.req.raw.headers,
    });
  } catch {
    // Ignore sign out errors
  }

  // Clear session cookie
  deleteCookie(c, 'better-auth.session_token');

  return c.json({ success: true });
});

export default routes;