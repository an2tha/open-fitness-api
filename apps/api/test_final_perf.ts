
import { db } from './src/lib/db';
import { foodsTable } from '@repo/db/src/schema';
import { sql } from 'drizzle-orm';

async function testFinalPerformance(q: string) {
  const searchQuery = q.trim().split(/\s+/).map(term => `${term}:*`).join(' & ');
  const start = performance.now();
  
  try {
    const results = await db.execute(sql`
      WITH matches AS (
        (
          SELECT id, name, brand, "dataSource", category, 
                 ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
          FROM foods 
          WHERE search_vector @@ to_tsquery('english', ${searchQuery})
          LIMIT 100
        )
        UNION ALL
        (
          SELECT id, name, brand, "dataSource", category,
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
    console.log(`Final Performance for "${q}": ${Math.round(end - start)}ms (${results.length} results)`);
  } catch (e) {
    console.error("Search failed:", e);
  }
}

async function main() {
  await testFinalPerformance("apple");
  await testFinalPerformance("banana");
  await testFinalPerformance("whey prot"); // Partial search
}

main();
