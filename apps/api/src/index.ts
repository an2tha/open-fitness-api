import { serve } from 'bun';
import app from './app';
import { env, isProduction } from './lib/env';

const port = parseInt(env.PORT);

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
  console.log(`📚 API docs available at http://0.0.0.0:${port}/api/v1/docs`);
} else {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API docs available at http://localhost:${port}/api/v1/docs`);
}

export default app;
