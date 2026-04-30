import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Attempting to enable pg_trgm...');
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    console.log('Success!');
  } catch (e) {
    console.error('Failed to enable extension:', e);
  }
}

main();
