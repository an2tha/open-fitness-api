import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: new URL('../../.env', import.meta.url).pathname, quiet: true });

export default defineConfig({
  out: './drizzle',
  schema: '../../packages/db/src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});