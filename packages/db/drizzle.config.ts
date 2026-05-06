import 'dotenv/config';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'fs';

const ENV_PATH = '../../.env';
if (existsSync(ENV_PATH)) {
  config({ path: ENV_PATH });
}

export default defineConfig({
  out: './drizzle',
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
