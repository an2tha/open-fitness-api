import { db } from './src/lib/db';
import { foodsTable } from '@repo/db/src/schema';
import { sql, or } from 'drizzle-orm';

async function testSearch(q: string) {
  const searchQuery = q
    .trim()
    .split(/\s+/)
    .map((term) => `${term}:*`)
    .join(' & ');
  console.log(`Testing search for "${q}" (searchQuery: ${searchQuery})`);

  try {
    const results = await db
      .select({ id: foodsTable.id, name: foodsTable.name })
      .from(foodsTable)
      .where(
        or(sql`${foodsTable.searchVector} @@ to_tsquery('english', ${searchQuery})`, sql`${foodsTable.name} % ${q}`),
      )
      .orderBy(
        sql`
        (ts_rank(${foodsTable.searchVector}, to_tsquery('english', ${searchQuery})) * 0.4) + 
        (similarity(${foodsTable.name}, ${q}) * 0.6) DESC
      `,
      )
      .limit(5);

    console.log(`Found ${results.length} results.`);
    results.forEach((r) => console.log(` - ${r.name}`));
  } catch (e) {
    console.error('Search failed:', e);
  }
}

async function main() {
  await testSearch('apple');
  await testSearch('banana');
}

main();
