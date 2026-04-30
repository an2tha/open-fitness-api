
import { db } from './src/lib/db';
import { foodsTable } from '@repo/db/src/schema';
import { sql, or, desc } from 'drizzle-orm';

async function explainSearch(q: string) {
  const searchQuery = q.trim().split(/\s+/).map(term => `${term}:*`).join(' & ');
  
  try {
    const plan = await db.execute(sql`
      EXPLAIN ANALYZE
      select "id", "name" from "foods" 
      where ("foods"."search_vector" @@ to_tsquery('english', ${searchQuery}) or "foods"."name" % ${q}) 
      order by (ts_rank("foods"."search_vector", to_tsquery('english', ${searchQuery})) * 0.4) + (similarity("foods"."name", ${q}) * 0.6) DESC 
      limit 20
    `);
    console.log(plan);
  } catch (e) {
    console.error("Explain failed:", e);
  }
}

async function main() {
  await explainSearch("apple");
}

main();
