import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function testFinalOutput() {
  const q = 'apple';
  const searchQuery = 'apple:*';

  try {
    const results = await db.execute(sql`
      WITH matches AS (
        (SELECT *, ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank FROM foods WHERE search_vector @@ to_tsquery('english', ${searchQuery}) LIMIT 5)
        UNION ALL
        (SELECT *, similarity(name, ${q}) as rank FROM foods WHERE name % ${q} LIMIT 5)
      )
      SELECT DISTINCT ON (id) * FROM matches ORDER BY id, rank DESC LIMIT 1
    `);

    const food = results[0];
    const { search_vector: _sv, searchVector: _sv2, rank: _r, ...rest } = food as any;
    console.log('Cleaned food keys:', Object.keys(rest));
    console.log('Has calories:', 'calories' in rest);
    console.log('Has dataSource:', 'dataSource' in rest);
    console.log('Cleaned food sample:', JSON.stringify(rest, null, 2));
  } catch (e) {
    console.error('Test failed:', e);
  }
}

async function main() {
  await testFinalOutput();
}

main();
