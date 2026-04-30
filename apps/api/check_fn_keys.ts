
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const results = await db.execute(sql`SELECT * FROM food_nutrients LIMIT 1`);
  console.log("Keys in food_nutrients:", Object.keys(results[0]));
}

main();
