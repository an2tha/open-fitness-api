import { Hono, type Context } from 'hono';
import { requestIdMiddleware, corsMiddleware, securityHeaders, rateLimitMiddleware } from './middleware/security';
import { apiKeyAuthMiddleware } from './middleware/api-key-auth';
import { logger } from './middleware/logger';
import routes from './routes';
import { env } from '@repo/env-manager';
import { AppError, fromZodError } from './lib/error';

function handleAppError(error: unknown, c: Context) {
  const requestId = c.get('requestId') || 'unknown';

  if (error instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          requestId,
        },
      } as any,
      error.statusCode as any,
    );
  }

  if (error instanceof Error) {
    const zodError = error as unknown as { constructor: { name: string } };
    if (zodError.constructor.name === 'ZodError' || error.message.includes('Validation')) {
      const validationError = fromZodError(error as unknown as import('zod').ZodError);
      return c.json(
        {
          success: false,
          error: {
            code: validationError.code,
            message: validationError.message,
            requestId,
          },
        },
        validationError.statusCode as any,
      );
    }
  }

  console.error('Unhandled error:', error);

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : String(error),
        requestId,
      },
    },
    500,
  );
}

export function createApp(options: { enableApiKeyAuth?: boolean } = {}) {
  const app = new Hono({
    strict: false,
  });

  app.use('*', requestIdMiddleware);
  app.use('*', corsMiddleware);
  app.use('*', securityHeaders);
  app.use('*', rateLimitMiddleware);
  app.use('*', logger);

  // API key authentication (enable with API_KEY_AUTH_ENABLED=true)
  if (options.enableApiKeyAuth ?? env.API_KEY_AUTH_ENABLED === 'true') {
    app.use('*', apiKeyAuthMiddleware);
  }

  if (env.SWAGGER_ENABLED === 'true') {
    app.get('/swagger-docs', (c) => {
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
        url: '${env.API_PREFIX}/openapi.json',
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

  app.route(env.API_PREFIX, routes);

  app.notFound((c) => {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          requestId: (c as any).get('requestId') || 'unknown',
        },
      },
      404,
    );
  });

  app.onError((error, c) => handleAppError(error, c));

  return app;
}

const app = createApp();
export default app;
