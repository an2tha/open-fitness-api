import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'supplements' AND column_name = 'search_vector'
    `);
    console.log('Supplements search_vector exists:', result.length > 0);
  } catch (e) {
    console.error('Error checking column:', e);
  }
}

main();
