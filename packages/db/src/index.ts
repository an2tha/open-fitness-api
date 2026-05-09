import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '@repo/env-manager';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

export const db = drizzle(env.DATABASE_URL);
