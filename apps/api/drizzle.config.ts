import 'dotenv/config';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { stat } from 'fs/promises';

const ENV_PATH = '../../.env';
stat(ENV_PATH).catch((e) => {
  throw Error(`Error loading .env, ${e}`);
});
config({ path: ENV_PATH });

export default defineConfig({
  out: './drizzle',
  schema: '../../packages/db/src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
