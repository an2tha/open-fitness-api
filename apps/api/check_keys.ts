import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const results = await db.execute(sql`SELECT * FROM foods LIMIT 1`);
  console.log('Keys in DB result:', Object.keys(results[0]));
}

main();
