
import { db } from './api/src/lib/db';
import { foodsTable } from '@repo/db/src/schema';
import { count } from 'drizzle-orm';

async function main() {
  const [result] = await db.select({ value: count() }).from(foodsTable);
  console.log("Total foods:", result.value);
}

main();
