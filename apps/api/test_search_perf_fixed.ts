import { db } from './src/lib/db';
import { foodsTable } from '@repo/db/src/schema';
import { sql, desc } from 'drizzle-orm';

async function testSearch(q: string) {
  const searchQuery = q
    .split(' ')
    .map((term) => `${term}:*`)
    .join(' & ');
  const start = performance.now();
  const results = await db
    .select({ id: foodsTable.id, name: foodsTable.name })
    .from(foodsTable)
    .where(sql`${foodsTable.searchVector} @@ to_tsquery('english', ${searchQuery})`)
    .orderBy(desc(sql`ts_rank(${foodsTable.searchVector}, to_tsquery('english', ${searchQuery}))`))
    .limit(20);
  const end = performance.now();
  console.log(`Search for "${q}" took ${Math.round(end - start)}ms, found ${results.length} results.`);
}

async function main() {
  await testSearch('chicken breast');
  await testSearch('greek yogurt');
  await testSearch('apple');
  await testSearch('whey protein');
}

main();
