import { OpenAPIHono } from '@hono/zod-openapi';
import { env } from '../lib/env';
import foods from './foods';
import exercises from './exercises';
import supplements from './supplements';
import nutrients from './nutrients';

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
  }
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
  }
);

if (env.SWAGGER_ENABLED === 'true') {
  routes.get('/docs', (c) => {
    return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = () => {
      window.SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          window.SwaggerUIBundle.presets.apis,
          window.SwaggerUIStandalonePreset
        ],
        layout: 'StandaloneLayout'
      });
    };
  </script>
</body>
</html>`);
  });
}

routes.route('/foods', foods);

routes.route('/exercises', exercises);
routes.route('/supplements', supplements);
routes.route('/nutrients', nutrients);

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