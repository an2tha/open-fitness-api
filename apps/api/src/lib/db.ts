export { db } from '@repo/db';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { db } = await import('@repo/db');
    await db.query`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}