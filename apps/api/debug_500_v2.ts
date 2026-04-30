
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const searchQuery = "milk:*";
  const q = "milk";
  const limit = 5;
  const offset = 0;
  const nutrientName = "Calcium";
  const minNutrientValue = 100;
  
  const robustCast = (col: any) => sql`CAST(NULLIF(regexp_replace(replace(${col}, ',', '.'), '[^0-9.]', '', 'g'), '') AS NUMERIC)`;

  const conditions: any[] = [];
  conditions.push(sql`EXISTS (
    SELECT 1 FROM food_nutrients fn 
    JOIN nutrients n ON fn."nutrientId" = n.id 
    WHERE fn."foodId" = f.id 
    AND n.name ILIKE ${'%' + nutrientName + '%'}
    AND ${robustCast(sql`fn.value`)} >= ${minNutrientValue}
  )`);
  
  const whereClause = sql`AND ${sql.join(conditions, sql` AND `)}`;

  try {
    const foodsResult = await db.execute(sql`
      WITH matches AS (
        (
          SELECT *, ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
          FROM foods as f
          WHERE f.search_vector @@ to_tsquery('english', ${searchQuery}) ${whereClause}
          LIMIT ${limit + offset + 100}
        )
        UNION ALL
        (
          SELECT *, similarity(name, ${q}) as rank
          FROM foods as f
          WHERE f.name % ${q} ${whereClause}
          LIMIT ${limit + offset + 100}
        )
      )
      SELECT DISTINCT ON (id) * FROM matches
      ORDER BY id, rank DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    console.log("Success!");
  } catch (e) {
    console.error("FAIL:", e);
  }
}

main();
