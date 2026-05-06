import { defineConfig } from 'drizzle-kit';
import { env } from '@repo/env-manager';

export default defineConfig({
  out: './drizzle',
  schema: '../../packages/db/src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
