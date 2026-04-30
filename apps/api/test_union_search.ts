
import { db } from './src/lib/db';
import { foodsTable } from '@repo/db/src/schema';
import { sql, or, desc, union } from 'drizzle-orm';

async function testUnionSearch(q: string) {
  const searchQuery = q.trim().split(/\s+/).map(term => `${term}:*`).join(' & ');
  const start = performance.now();
  
  try {
    // Drizzle's union is a bit tricky with complex SQL, so we'll use a raw query for the test
    const results = await db.execute(sql`
      WITH matches AS (
        (
          SELECT id, name, brand, dataSource, category, 
                 ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
          FROM foods 
          WHERE search_vector @@ to_tsquery('english', ${searchQuery})
          LIMIT 100
        )
        UNION ALL
        (
          SELECT id, name, brand, dataSource, category,
                 similarity(name, ${q}) as rank
          FROM foods 
          WHERE name % ${q}
          LIMIT 100
        )
      )
      SELECT DISTINCT ON (id) * FROM matches
      ORDER BY id, rank DESC
      LIMIT 20
    `);
    
    const end = performance.now();
    console.log(`Union Search for "${q}" took ${Math.round(end - start)}ms, found ${results.length} results.`);
  } catch (e) {
    console.error("Search failed:", e);
  }
}

async function main() {
  await testUnionSearch("apple");
  await testUnionSearch("banana");
}

main();
