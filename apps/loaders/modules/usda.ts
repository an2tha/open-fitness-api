import { type NewFood } from '@repo/db';
import { foodsTable } from '@repo/db/src/schema';
import { $ } from 'bun';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { insertFoodChunk } from '../utils/foods';
import { getLogger } from '../utils/logger';
import { insertFoodNutrientLinks, syncNutrientMeta, type FoodNutrientLink } from '../utils/nutrients';

config({ path: new URL('../../../.env', import.meta.url).pathname, quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_SOURCE = 'usda';
const USDA_ZIP_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_csv_2026-04-30.zip';
const ZIP_PATH = '/tmp/usda-fdc.zip';
const EXTRACT_PATH = '/tmp/usda-fdc';

const paths = {
  food: `${EXTRACT_PATH}/food.csv`,
  branded: `${EXTRACT_PATH}/branded_food.csv`,
  nutrient: `${EXTRACT_PATH}/nutrient.csv`,
  foodNutrient: `${EXTRACT_PATH}/food_nutrient.csv`,
};

const nutrientIds = {
  calories: '1008',
  protein: '1003',
  fat: '1004',
  carbohydrates: '1005',
  fiber: '1079',
  sugar: '2000',
  sodium: '1093',
};

type UsdaOptions = {
  insertConcurrency?: number;
  chunkSize?: number;
};

type UsdaAccumulator = {
  fdcId: string;
  externalId: string;
  dataSource: string;
  name: string;
  brand?: string;
  category?: string;
  servingSize: string;
  servingUnit: string;
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
  fiber: string;
  sugar: string;
  sodium: string;
};

const text = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed && trimmed !== '' ? trimmed : undefined;
};

const decimal = (value: string | number | undefined, fallback = '0.00') => {
  if (value === undefined || value === '') return fallback;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toFixed(2);
};

const downloadZip = () => {
  const logger = getLogger();
  return Bun.file(ZIP_PATH).exists().then(exists => {
    if (exists) return;
    logger.setProgress(DATA_SOURCE, 0, 0, 'downloading USDA');
    return fetch(USDA_ZIP_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(response => {
      if (!response.ok) throw new Error(`USDA download failed: ${response.status}`);
      const total = Number(response.headers.get('content-length') ?? 0);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No body');
      const writer = Bun.file(ZIP_PATH).writer();
      let downloaded = 0;
      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) { writer.end(); return; }
          writer.write(value);
          downloaded += value.byteLength;
          logger.setProgress(DATA_SOURCE, downloaded, total, 'downloading USDA');
          return pump();
        });
      return pump();
    });
  });
};

const unzip = () => {
  const logger = getLogger();
  return Bun.file(paths.food).exists().then(async exists => {
    if (exists) return;
    logger.setProgress(DATA_SOURCE, 0, 1, 'extracting USDA');
    await $`mkdir -p ${EXTRACT_PATH}`.quiet();
    return $`unzip -oqj ${ZIP_PATH} -d ${EXTRACT_PATH}`.quiet().catch(async err => {
      await $`rm -f ${ZIP_PATH}`.quiet();
      throw new Error(`Unzip failed. Corrupted file deleted. Please retry.`);
    });
  });
};

const forEachCsvRow = async (path: string, onRow: (row: string[], index: number) => void | Promise<void>, label: string) => {
  const logger = getLogger();
  const file = Bun.file(path);
  const total = file.size;
  const stream = file.stream();
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '', rowIndex = 0, processed = 0, lastProgress = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    processed += value.byteLength;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const row: string[] = [];
      let field = '', quoted = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (quoted) { if (char === '"') { if (line[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += char; }
        else if (char === '"') quoted = true;
        else if (char === ',') { row.push(field); field = ''; }
        else if (char !== '\r') field += char;
      }
      row.push(field);
      const res = onRow(row, rowIndex++);
      if (res instanceof Promise) await res;
    }
    if (processed - lastProgress >= 10485760) {
      lastProgress = processed;
      logger.setProgress(DATA_SOURCE, processed, total, label);
    }
  }
  logger.setProgress(DATA_SOURCE, total, total, label);
};

export const loadUsdaFoods = async (options: UsdaOptions = {}) => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);
  const foods = new Map<string, UsdaAccumulator>();
  const nutrients = new Map<string, { name: string; unit: string }>();

  await downloadZip();
  await unzip();

  await forEachCsvRow(paths.nutrient, (row, i) => {
    if (i && row[0]) nutrients.set(row[0], { name: row[1] ?? '', unit: row[2] ?? '' });
  }, 'parsing USDA nutrient meta');

  logger.info('syncing nutrient metadata...');
  const nutrientIdMap = await syncNutrientMeta(sqlClient, Array.from(nutrients.values()));

  await Promise.all([
    forEachCsvRow(paths.food, (row, i) => {
      if (i && row[0]) foods.set(row[0], { fdcId: row[0], externalId: row[0], dataSource: DATA_SOURCE, name: text(row[2]) ?? `USDA ${row[0]}`, category: text(row[1]), servingSize: '100.00', servingUnit: 'g', calories: '0.00', protein: '0.00', fat: '0.00', carbohydrates: '0.00', fiber: '0.00', sugar: '0.00', sodium: '0.00' });
    }, 'parsing USDA identity'),
    forEachCsvRow(paths.branded, (row, i) => {
      const f = foods.get(row[0] ?? '');
      if (f) { f.brand = text(row[1]) ?? text(row[2]); f.externalId = text(row[4]) ?? f.externalId; f.servingSize = decimal(row[6], '100.00'); f.servingUnit = text(row[7]) ?? 'g'; }
    }, 'parsing USDA brands'),
  ]);

  await forEachCsvRow(paths.foodNutrient, (row, i) => {
    const f = foods.get(row[1] ?? ''), id = row[2], val = row[3];
    if (!f) return;
    switch (id) {
      case nutrientIds.calories: f.calories = decimal(val); break;
      case nutrientIds.protein: f.protein = decimal(val); break;
      case nutrientIds.fat: f.fat = decimal(val); break;
      case nutrientIds.carbohydrates: f.carbohydrates = decimal(val); break;
      case nutrientIds.fiber: f.fiber = decimal(val); break;
      case nutrientIds.sugar: f.sugar = decimal(val); break;
      case nutrientIds.sodium: f.sodium = decimal(val); break;
    }
  }, 'parsing USDA macros');

  const db = drizzle(sqlClient);
  logger.info('clearing existing USDA foods');
  await db.delete(foodsTable).where(eq(foodsTable.dataSource, DATA_SOURCE));

  const allFoods = Array.from(foods.values()), dbIdMap = new Map<string, number>();
  const chunkSize = options.chunkSize ?? 2000;
  for (let i = 0; i < allFoods.length; i += chunkSize) {
    const chunk = allFoods.slice(i, i + chunkSize);
    const dbFoods = await insertFoodChunk(sqlClient, chunk);
    dbFoods.forEach(f => dbIdMap.set(f.externalId, f.id));
    logger.setProgress(DATA_SOURCE, i + chunk.length, allFoods.length, 'loading USDA foods');
  }

  const fdcToDbId = new Map<string, number>();
  allFoods.forEach(f => { const dbId = dbIdMap.get(f.externalId); if (dbId) fdcToDbId.set(f.fdcId, dbId); });

  let links: FoodNutrientLink[] = [];
  await forEachCsvRow(paths.foodNutrient, async (row, i) => {
    if (!i) return;
    const foodId = fdcToDbId.get(row[1] ?? ''), nMeta = nutrients.get(row[2] ?? '');
    if (!foodId || !nMeta) return;
    const nutrientId = nutrientIdMap.get(`${nMeta.name}|${nMeta.unit}`);
    if (nutrientId) {
      links.push({ foodId, nutrientId, value: decimal(row[3]) });
      if (links.length >= 5000) { await insertFoodNutrientLinks(sqlClient, links); links = []; }
    }
  }, 'linking USDA nutrients');

  if (links.length) await insertFoodNutrientLinks(sqlClient, links);
  await sqlClient.close();
  logger.info(`loaded ${allFoods.length} USDA records`);
  return allFoods.length;
};
