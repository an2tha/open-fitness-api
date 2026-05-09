import { OpenAPIHono } from '@hono/zod-openapi';
import { env } from '@repo/env-manager';
import { z } from 'zod';
import foods from './foods';
import exercises from './exercises';
import supplements from './supplements';
import nutrients from './nutrients';
import { auth } from './auth';
import { requireSession } from '../middleware/session-auth';
import { readAllAppSettings, readPublicAppSettings, setAppSetting } from '../lib/app-settings';

const routes = new OpenAPIHono();

const updateSettingsSchema = z
  .object({
    allowNewLogins: z.boolean().optional(),
    settings: z.record(z.unknown()).optional(),
  })
  .strict();

routes.openapi(
  {
    method: 'get',
    path: '/health',
    tags: ['Health'],
    summary: 'Health check',
    description: 'Check if the API is running and healthy',
    responses: {
      200: {
        description: 'API is healthy',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' },
                uptime: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
  (c: any) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    });
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/health/db',
    tags: ['Health'],
    summary: 'Database health check',
    description: 'Check if the database connection is healthy',
    responses: {
      200: {
        description: 'Database is healthy',
      },
      503: {
        description: 'Database is not available',
      },
    },
  },
  async (c) => {
    const { checkDatabaseConnection } = await import('../lib/db');
    const isHealthy = await checkDatabaseConnection();
    if (!isHealthy) {
      return c.json({ status: 'error', message: 'Database connection failed' }, 503);
    }
    return c.json({ status: 'ok', message: 'Database connection healthy' });
  },
);

routes.openapi(
  {
    method: 'get',
    path: '/health/stats',
    tags: ['Health'],
    summary: 'Detailed system statistics',
    responses: {
      200: {
        description: 'Detailed system statistics',
      },
    },
  },
  async (c) => {
    const { db } = await import('../lib/db');
    const { foodsTable, exercisesTable, supplementsTable } = await import('@repo/db/src/schema');
    const { count } = await import('drizzle-orm');

    try {
      const [foodCount] = await db.select({ value: count() }).from(foodsTable);
      const [exerciseCount] = await db.select({ value: count() }).from(exercisesTable);
      const [supplementCount] = await db.select({ value: count() }).from(supplementsTable);

      return c.json({
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        counts: {
          foods: foodCount?.value ?? 0,
          exercises: exerciseCount?.value ?? 0,
          supplements: supplementCount?.value ?? 0,
        },
        node_version: process.version,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      return c.json({ error: 'Failed to fetch stats', details: String(e) }, 500);
    }
  },
);

routes.route('/foods', foods);

routes.route('/exercises', exercises);
routes.route('/supplements', supplements);
routes.route('/nutrients', nutrients);

routes.get('/auth/settings', async (c) => {
  const settings = await readPublicAppSettings();
  return c.json({ success: true, ...settings });
});

routes.get('/admin/settings', async (c) => {
  await requireSession(c, async () => {});
  const settings = await readAllAppSettings();
  return c.json({ success: true, settings, allowNewLogins: settings.allowNewLogins !== false });
});

routes.put('/admin/settings', async (c) => {
  await requireSession(c, async () => {});

  const body = updateSettingsSchema.parse(await c.req.json());
  const updates = {
    ...(body.settings ?? {}),
    ...(body.allowNewLogins === undefined ? {} : { allowNewLogins: body.allowNewLogins }),
  };

  for (const [key, value] of Object.entries(updates)) {
    await setAppSetting(key, value);
  }

  const settings = await readAllAppSettings();
  return c.json({ success: true, settings, allowNewLogins: settings.allowNewLogins !== false });
});

routes.all('/auth/*', async (c) => {
  if (env.NODE_ENV !== 'production') {
    console.log('[Hono → BetterAuth]', {
      path: c.req.path,
      method: c.req.method,
      url: c.req.url,
    });
  }

  if (c.req.path.includes('/auth/sign-up')) {
    const { allowNewLogins } = await readPublicAppSettings();
    if (!allowNewLogins) {
      return c.json(
        {
          success: false,
          error: {
            code: 'SIGN_UP_DISABLED',
            message: 'New logins are currently disabled',
          },
        },
        403,
      );
    }
  }

  const res = await auth.handler(c.req.raw);

  if (env.NODE_ENV !== 'production') {
    console.log('[BetterAuth response]', {
      status: res.status,
    });
  }

  return res;
});

routes.get('/openapi.json', (c) => {
  try {
    const doc = routes.getOpenAPIDocument({
      openapi: '3.0.0',
      info: {
        title: 'Open Fitness Data API',
        version: '1.0.0',
      },
      servers: [
        {
          url: env.API_PREFIX,
          description: 'API Server',
        },
      ],
    });
    return c.json(doc);
  } catch (e) {
    console.error('Error generating document:', e);
    return c.json({ error: 'Failed to generate document', message: String(e) }, 500);
  }
});

export default routes;
export type AppRoutes = typeof routes;
