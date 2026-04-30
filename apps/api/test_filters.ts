
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function testFilters() {
  try {
    console.log("Testing filters: minProtein=20");
    const result = await db.execute(sql`
      SELECT name, protein 
      FROM foods 
      WHERE CAST(NULLIF(protein, '') AS NUMERIC) >= 20 
      LIMIT 5
    `);
    console.log("Results with >20g protein:");
    result.forEach(r => console.log(` - ${r.name}: ${r.protein}g`));

    console.log("\nTesting filters: nutrientName=Calcium");
    const result2 = await db.execute(sql`
      SELECT f.name, fn.value as calcium
      FROM foods f
      JOIN food_nutrients fn ON fn.food_id = f.id
      JOIN nutrients n ON fn.nutrient_id = n.id
      WHERE n.name ILIKE '%Calcium%'
      AND CAST(NULLIF(fn.value, '') AS NUMERIC) > 500
      LIMIT 5
    `);
    console.log("Results with >500mg Calcium:");
    result2.forEach(r => console.log(` - ${r.name}: ${r.calcium}`));
  } catch (e) {
    console.error("Filter test failed:", e);
  }
}

async function main() {
  await testFilters();
}

main();
