import { $ } from 'bun';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { foodsTable } from '@repo/db/src/schema';
import { env } from '@repo/env-manager';
import * as XLSX from 'xlsx';
import { getLogger } from '../utils/logger';
import { insertFoodNutrientLinks, syncNutrientMeta, type NutrientMeta } from '../utils/nutrients';

const DATA_SOURCE = 'swiss';
const DOWNLOAD_URL =
  'https://webapp.prod.blv.foodcase-services.com/wp-content/uploads/2025/07/Swiss_food_composition_database.xlsx';
const FILE_PATH = '/tmp/swiss_food_data.xlsx';
const NUTRIENT_HEADER_RE = /\((g|mg|µg|kJ|kcal|RE|RAE)\)$/;

type ParsedSheet = {
  sheetName: string;
  rows: any[];
  nutrientKeys: string[];
};

const parseNutrientMeta = (key: string): NutrientMeta => {
  const match = key.match(/^(.*?)\s*\((.*?)\)$/);
  return {
    name: match?.[1]?.trim() || key,
    unit: match?.[2]?.trim() || 'unit',
  };
};

export const loadSwissFoods = async () => {
  const logger = getLogger();
  const sqlClient = new Bun.SQL(env.DATABASE_URL);
  const db = drizzle(sqlClient);

  await $`rm -f ${FILE_PATH}`.quiet();
  logger.setProgress(DATA_SOURCE, 0, 100, 'downloading Swiss database');
  const response = await fetch(DOWNLOAD_URL);
  if (!response.ok) throw new Error(`Failed to download Swiss data: ${response.statusText}`);
  await Bun.write(FILE_PATH, await response.arrayBuffer());

  logger.setProgress(DATA_SOURCE, 10, 100, 'parsing Excel');
  const workbook = XLSX.readFile(FILE_PATH);
  const sheetsToProcess = ['Generic Foods', 'Branded foods'];
  const parsedSheets: ParsedSheet[] = [];
  const nutrientMetaByHeader = new Map<string, NutrientMeta>();

  for (const sheetName of sheetsToProcess) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    logger.info(`processing sheet: ${sheetName}`);
    const rows = XLSX.utils.sheet_to_json(sheet, { range: 2 }) as any[];
    if (!rows.length) continue;

    const nutrientKeys = Object.keys(rows[0]).filter((key) => NUTRIENT_HEADER_RE.test(key));
    for (const key of nutrientKeys) nutrientMetaByHeader.set(key, parseNutrientMeta(key));

    parsedSheets.push({ sheetName, rows, nutrientKeys });
  }

  logger.info('syncing nutrient metadata...');
  const uniqueNutrients = Array.from(
    new Map(Array.from(nutrientMetaByHeader.values()).map((meta) => [`${meta.name}|${meta.unit}`, meta])).values(),
  );
  const nutrientIdMap = await syncNutrientMeta(sqlClient, uniqueNutrients);

  const nutrientIdByHeader = new Map<string, number>();
  for (const [header, meta] of nutrientMetaByHeader) {
    const nutrientId = nutrientIdMap.get(`${meta.name}|${meta.unit}`);
    if (nutrientId) nutrientIdByHeader.set(header, nutrientId);
  }

  await db.delete(foodsTable).where(eq(foodsTable.dataSource, DATA_SOURCE));

  for (const { sheetName, rows, nutrientKeys } of parsedSheets) {
    logger.info(`inserting foods from ${sheetName}`);
    const foodLinks: Array<{ foodId: number; nutrientId: number; value: string }> = [];

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const foodsToInsert = chunk.map((r) => ({
        externalId: String(r['ID'] ?? r['ID SwissFIR'] ?? ''),
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

      for (const r of chunk) {
        const foodId = supIdMap.get(String(r['ID'] ?? r['ID SwissFIR'] ?? ''));
        if (!foodId) continue;

        for (const key of nutrientKeys) {
          const val = r[key];
          const nutrientId = nutrientIdByHeader.get(key);
          if (nutrientId && val !== undefined && val !== null && val !== '') {
            foodLinks.push({
              foodId,
              nutrientId,
              value: String(val),
            });
          }
        }
      }

      if (foodLinks.length >= 1000) {
        await insertFoodNutrientLinks(sqlClient, foodLinks);
        foodLinks.length = 0;
      }

      logger.setProgress(DATA_SOURCE, 50 + Math.floor((i / rows.length) * 40), 100, `loading ${sheetName}`);
    }

    if (foodLinks.length) {
      await insertFoodNutrientLinks(sqlClient, foodLinks);
    }
  }

  logger.setProgress(DATA_SOURCE, 100, 100, 'done');
  await sqlClient.close();
};
