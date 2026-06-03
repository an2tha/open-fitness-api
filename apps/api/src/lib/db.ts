import { db } from '@repo/db';
import { env } from '@repo/env-manager';
import { sql } from 'drizzle-orm';

export { db } from '@repo/db';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    if (env.NODE_ENV !== 'test') {
      console.error('Database connection failed:', error);
    }
    return false;
  }
}
