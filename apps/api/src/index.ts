import { serve } from 'bun';
import app from './app';
import { env, isProduction } from '@repo/env-manager';

const port = parseInt(env.API_PORT);

async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  console.log('Closing server...');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});

if (isProduction) {
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
} else {
  console.log(`🚀 Server running on http://localhost:${port}`);
}

if (env.SWAGGER_ENABLED === 'true') {
  const docsUrl = isProduction ? `http://0.0.0.0:${port}/swagger-docs` : `http://localhost:${port}/swagger-docs`;
  console.log(`📚 API docs available at ${docsUrl}`);
}

export default app;
