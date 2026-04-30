import { $ } from 'bun';
import { foodsTable, foodNutrientsTable, nutrientsTable } from '@repo/db/src/schema';
import { drizzle } from 'drizzle-orm/bun-sql';
import { sql } from 'drizzle-orm';
import { getLogger } from '../utils/logger';
import * as XLSX from 'xlsx';

const DATA_SOURCE = 'swiss';
const DOWNLOAD_URL =
  'https://webapp.prod.blv.foodcase-services.com/wp-content/uploads/2025/07/Swiss_food_composition_database.xlsx';
const FILE_PATH = '/tmp/swiss_food_data.xlsx';

export const loadSwissFoods = async () => {
  const logger = getLogger();
  const sqlClient = new Bun.SQL(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  // Clear cache before downloading
  await $`rm -f ${FILE_PATH}`.quiet();
  logger.setProgress(DATA_SOURCE, 0, 100, 'downloading Swiss database');
  const response = await fetch(DOWNLOAD_URL);
  if (!response.ok) throw new Error(`Failed to download Swiss data: ${response.statusText}`);
  await Bun.write(FILE_PATH, await response.arrayBuffer());

  logger.setProgress(DATA_SOURCE, 10, 100, 'parsing Excel');
  const workbook = XLSX.readFile(FILE_PATH);

  const sheetsToProcess = ['Generic Foods', 'Branded foods'];
  const nutrientIdMap = new Map<string, number>();

  for (const sheetName of sheetsToProcess) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    logger.info(`processing sheet: ${sheetName}`);
    const rows = XLSX.utils.sheet_to_json(sheet, { range: 2 }) as any[];

    // Identify nutrient columns: columns that contain a unit in parentheses
    if (rows.length === 0) continue;
    const allKeys = Object.keys(rows[0]);
    const nutrientKeys = allKeys.filter((k) => k.match(/\((g|mg|µg|kJ|kcal|RE|RAE)\)$/));

    logger.setProgress(DATA_SOURCE, 30, 100, `syncing nutrients from ${sheetName}`);
    for (const key of nutrientKeys) {
      if (nutrientIdMap.has(key)) continue;

      const match = key.match(/^(.*?)\s*\((.*?)\)$/);
      const name = match && match[1] ? match[1].trim() : key;
      const unit = match && match[2] ? match[2].trim() : 'unit';

      // Try insert first, if conflict use onConflictDoNothing
      await db.insert(nutrientsTable).values({ name, unit }).onConflictDoNothing();

      // Get the id (either from insert or from existing record)
      const [existing] = await db
        .select({
          id: nutrientsTable.id,
        })
        .from(nutrientsTable)
        .where(sql`${nutrientsTable.name} = ${name} AND ${nutrientsTable.unit} = ${unit}`)
        .limit(1);

      if (existing) nutrientIdMap.set(key, existing.id);
    }

    logger.setProgress(DATA_SOURCE, 50, 100, `inserting foods from ${sheetName}`);
    const foodLinks: Array<{ foodId: number; nutrientId: number; value: string }> = [];

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const foodsToInsert = chunk.map((r) => ({
        externalId: String(r['ID'] || r['ID SwissFIR']),
        dataSource: DATA_SOURCE,
        name: String(r['Name']).slice(0, 2056),
        brand: sheetName === 'Branded foods' ? String(r['Brand'] || 'Generic') : 'Generic',
        category: String(r['Category'] || 'General').slice(0, 2056),
      }));

      const insertedFoods = await db
        .insert(foodsTable)
        .values(foodsToInsert)
        .onConflictDoNothing()
        .returning({ id: foodsTable.id, externalId: foodsTable.externalId });
      const supIdMap = new Map(insertedFoods.map((s) => [s.externalId, s.id]));

      // Prepare nutrient links for this chunk
      for (const r of chunk) {
        const foodId = supIdMap.get(String(r['ID'] || r['ID SwissFIR']));
        if (!foodId) continue;

        for (const key of nutrientKeys) {
          const val = r[key];
          const nutrientId = nutrientIdMap.get(key);
          if (nutrientId && val !== undefined && val !== null && val !== '') {
            foodLinks.push({
              foodId,
              nutrientId,
              value: String(val),
            });
          }

          if (foodLinks.length >= 1000) {
            await db.insert(foodNutrientsTable).values(foodLinks).onConflictDoNothing();
            foodLinks.length = 0;
          }
        }
      }

      logger.setProgress(DATA_SOURCE, 50 + Math.floor((i / rows.length) * 40), 100, `loading ${sheetName}`);
    }

    if (foodLinks.length > 0) {
      await db.insert(foodNutrientsTable).values(foodLinks).onConflictDoNothing();
    }
  }

  logger.setProgress(DATA_SOURCE, 100, 100, 'done');
  await sqlClient.close();
};
