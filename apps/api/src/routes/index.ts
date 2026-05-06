import { OpenAPIHono } from '@hono/zod-openapi';
import { env } from '../lib/env';
import foods from './foods';
import exercises from './exercises';
import supplements from './supplements';
import nutrients from './nutrients';
import adminApiKeys from './admin/api-keys';

const routes = new OpenAPIHono();

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
  (c) => {
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
routes.route('/admin/api-keys', adminApiKeys);

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
