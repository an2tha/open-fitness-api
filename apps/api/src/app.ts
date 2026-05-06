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
