import { $ } from 'bun';
import { foodsTable } from '@repo/db/src/schema';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import * as XLSX from 'xlsx';
import { insertFoodChunk } from '../utils/foods';
import { getLogger } from '../utils/logger';
import { insertFoodNutrientLinks, syncNutrientMeta, type FoodNutrientLink } from '../utils/nutrients';

config({ path: new URL('../../../.env', import.meta.url).pathname, quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_SOURCE = 'ciqual';
// CIQUAL 2020 English Excel file from official ANSES source
const CIQUAL_URL =
  'https://ciqual.anses.fr/cms/sites/default/files/inline-files/Table%20Ciqual%202020_ENG_2020%2007%2007.xls';
const DATA_PATH = '/tmp/ciqual.xls';

type CiqualRow = {
  [key: string]: string | number | null;
};

const downloadCiqual = async () => {
  const logger = getLogger();
  // Clear cache before downloading
  await $`rm -f ${DATA_PATH}`.quiet();
  logger.setProgress(DATA_SOURCE, 0, 0, 'downloading CIQUAL');
  const response = await fetch(CIQUAL_URL);
  if (!response.ok) throw new Error(`CIQUAL download failed: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  await Bun.write(DATA_PATH, arrayBuffer);
};

const parseCiqual = async () => {
  const logger = getLogger();
  const workbook = XLSX.readFile(DATA_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet) as CiqualRow[];

  if (rows.length === 0) throw new Error('No data in CIQUAL spreadsheet');

  // Get column headers from first row
  const headers = Object.keys(rows[0]);

  // Identify nutrient columns (those with units in parentheses like "(g/100g)", "(mg/100g)", etc.)
  const nutrientColumns = headers.filter((h) => h.match(/\([^)]+\)$/));

  // Build nutrient metadata from column names
  const nutrientMetaSet = new Set<string>();
  nutrientColumns.forEach((col) => {
    const match = col.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
      const name = match[1].trim();
      const unit = match[2].trim();
      nutrientMetaSet.add(JSON.stringify({ name, unit }));
    }
  });

  const nutrientMeta = Array.from(nutrientMetaSet).map((s) => JSON.parse(s));

  logger.info(`parsed ${rows.length} CIQUAL records, ${nutrientMeta.length} nutrient types`);

  const foods = rows.map((row, idx) => {
    const rawNutrients: Record<string, string> = {};
    for (const col of nutrientColumns) {
      const val = row[col];
      if (val !== null && val !== undefined && val !== '' && val !== '-') {
        rawNutrients[col] = String(val);
      }
    }

    const name = String(row['alim_nom_eng'] || '');
    const category = String(row['alim_grp_nom_eng'] || '');

    // Get main nutrients for the food record
    const getNutrient = (colName: string): string => {
      const val = row[colName];
      if (val === null || val === undefined || val === '' || val === '-') return '0.00';
      return String(val).replace(',', '.');
    };

    return {
      externalId: String(row['alim_code'] || idx),
      dataSource: DATA_SOURCE,
      name: name || 'Unknown',
      brand: 'CIQUAL',
      category: category || 'General',
      servingSize: '100.00',
      servingUnit: 'g',
      calories: getNutrient('Energy, Regulation EU No 1169/2011 (kcal/100g)') || '0.00',
      protein: getNutrient('Protein (g/100g)') || '0.00',
      fat: getNutrient('Fat (g/100g)') || '0.00',
      carbohydrates: getNutrient('Carbohydrate (g/100g)') || '0.00',
      fiber: getNutrient('Fibres (g/100g)') || '0.00',
      sugar: getNutrient('Sugars (g/100g)') || '0.00',
      sodium: getNutrient('Sodium (mg/100g)') || '0.00',
      rawNutrients,
    };
  });

  return { foods, nutrientMeta };
};

export const loadCiqual = async () => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);

  await downloadCiqual();
  const { foods, nutrientMeta } = await parseCiqual();

  logger.info('syncing nutrient metadata...');
  const nutrientIdMap = await syncNutrientMeta(sqlClient, nutrientMeta);

  const db = drizzle(sqlClient);
  await db.delete(foodsTable).where(eq(foodsTable.dataSource, DATA_SOURCE));

  const chunkSize = 500;
  for (let i = 0; i < foods.length; i += chunkSize) {
    const chunk = foods.slice(i, i + chunkSize);
    const dbFoods = await insertFoodChunk(sqlClient, chunk);
    const idMap = new Map(dbFoods.map((f) => [f.externalId, f.id]));

    const links: FoodNutrientLink[] = [];
    chunk.forEach((food) => {
      const foodId = idMap.get(food.externalId);
      if (!foodId) return;

      Object.entries(food.rawNutrients).forEach(([n, v]) => {
        const match = n.match(/^(.+?)\s*\((.+?)\)$/);
        const name = match?.[1]?.trim() || n;
        const unit = match?.[2]?.trim() || 'g';
        const nutrientId = nutrientIdMap.get(`${name}|${unit}`);
        if (nutrientId && v && v !== '-' && v !== '0') {
          links.push({ foodId, nutrientId, value: v });
        }
      });
    });

    if (links.length) {
      await insertFoodNutrientLinks(sqlClient, links);
    }
    logger.setProgress(DATA_SOURCE, i + chunk.length, foods.length, 'loading CIQUAL');
  }

  await sqlClient.close();
  logger.info(`loaded ${foods.length} CIQUAL records`);
  return foods.length;
};
