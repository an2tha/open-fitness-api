import { drizzle } from 'drizzle-orm/bun-sql';
import { config } from 'dotenv';
import path from 'node:path';

// Find workspace root .env
config({ 
  path: path.resolve(import.meta.dirname, '../../../.env'),
  // @ts-ignore
  quiet: true 
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

export const db = drizzle(process.env.DATABASE_URL);
