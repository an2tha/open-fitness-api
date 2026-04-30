import { Hono } from 'hono';
import { requestIdMiddleware, corsMiddleware, securityHeaders, rateLimitMiddleware } from './middleware/security';
import { apiKeyAuthMiddleware } from './middleware/api-key-auth';
import { logger } from './middleware/logger';
import { errorMiddleware } from './middleware/error';
import routes from './routes';
import { env } from './lib/env';

const app = new Hono({
  strict: false,
});

app.use('*', requestIdMiddleware);
app.use('*', corsMiddleware);
app.use('*', securityHeaders);
app.use('*', rateLimitMiddleware);
app.use('*', logger);
app.use('*', errorMiddleware);

// API key authentication (enable with API_KEY_AUTH_ENABLED=true)
if (env.API_KEY_AUTH_ENABLED === 'true') {
  app.use('*', apiKeyAuthMiddleware);
}

app.route(env.API_PREFIX, routes);

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    },
    404,
  );
});

export default app;
