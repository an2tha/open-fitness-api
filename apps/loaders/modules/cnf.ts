import { type NewFood } from '@repo/db';
import { foodsTable } from '@repo/db/src/schema';
import { $ } from 'bun';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { insertFoodChunk } from '../utils/foods';
import { getLogger } from '../utils/logger';
import { insertFoodNutrientLinks, syncNutrientMeta, type FoodNutrientLink, type NutrientMeta } from '../utils/nutrients';

config({ path: new URL('../../../.env', import.meta.url).pathname, quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_SOURCE = 'cnf';
const CNF_URL = 'https://www.canada.ca/content/dam/hc-sc/migration/hc-sc/fn-an/alt_formats/zip/nutrition/fiche-nutri-data/cnf-fcen-csv.zip';
const ZIP_PATH = '/tmp/cnf-fcen-csv.zip';
const EXTRACT_PATH = '/tmp/cnf-fcen-csv';

const paths = {
  foodGroup: `${EXTRACT_PATH}/FOOD GROUP.csv`,
  foodName: `${EXTRACT_PATH}/FOOD NAME.csv`,
  nutrientAmount: `${EXTRACT_PATH}/NUTRIENT AMOUNT.csv`,
  nutrientName: `${EXTRACT_PATH}/NUTRIENT NAME.csv`,
};

const nutrientIds = {
  calories: '208',
  kilojoules: '268',
  protein: '203',
  fat: '204',
  carbohydrates: '205',
  fiber: '291',
  sugar: '269',
  sodium: '307',
};

type NutrientMetaMap = {
  name: string;
  unit: string;
};

type FoodAccumulator = {
  externalId: string;
  dataSource: string;
  name: string;
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
  rawNutrients: Array<{ id: string; value: string }>;
};

const decimal = (value: string | number | undefined, fallback = '0.00') => {
  if (value === undefined || value === '') return fallback;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toFixed(2);
};

const text = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const downloadZip = () => {
  const logger = getLogger();
  return Bun.file(ZIP_PATH).exists().then(exists => {
    if (exists) return;
    logger.setProgress(DATA_SOURCE, 0, 0, 'downloading CNF');
    return fetch(CNF_URL).then(response => {
      if (!response.ok) throw new Error(`CNF download failed: ${response.status}`);
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
          logger.setProgress(DATA_SOURCE, downloaded, total, 'downloading CNF');
          return pump();
        });
      return pump();
    });
  });
};

const unzip = () => {
  const logger = getLogger();
  return Bun.file(paths.foodName).exists().then(exists => {
    if (exists) return;
    logger.setProgress(DATA_SOURCE, 0, 1, 'extracting CNF');
    return $`mkdir -p ${EXTRACT_PATH}`.quiet()
      .then(() => $`unzip -oq ${ZIP_PATH} -d ${EXTRACT_PATH}`.quiet())
      .then(() => logger.setProgress(DATA_SOURCE, 1, 1, 'extracting CNF'));
  });
};

const forEachCsvRow = async (path: string, onRow: (row: string[], index: number) => void, onProgress?: (current: number, total: number) => void) => {
  const file = Bun.file(path);
  const total = file.size;
  const buffer = await file.arrayBuffer();
  const content = Buffer.from(buffer).toString('latin1');
  let row: string[] = [], field = '', quoted = false, rowIndex = 0, lastProgress = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (quoted) {
      if (char === '"') { if (content[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); onRow(row, rowIndex++); row = []; field = ''; }
    else if (char !== '\r') field += char;
    if (onProgress && i - lastProgress >= 262144) { lastProgress = i; onProgress(i, total); }
  }
  if (field || row.length) { row.push(field); onRow(row, rowIndex); }
  onProgress?.(total, total);
};

export const loadCnfFoods = async () => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);
  await downloadZip();
  await unzip();

  const groups = new Map<string, string>(), nutrients = new Map<string, NutrientMetaMap>(), foods = new Map<string, FoodAccumulator>();
  const total = Object.values(paths).reduce((t, p) => t + Bun.file(p).size, 0);
  let parsed = 0, previous = 0;
  const progress = (current: number, fileTotal: number) => {
    parsed += current - previous; previous = current;
    logger.setProgress(DATA_SOURCE, Math.min(parsed, total), total, 'parsing CNF');
    if (current === fileTotal) previous = 0;
  };

  await forEachCsvRow(paths.foodGroup, (row, i) => { if (i) { const id = text(row[0]), name = text(row[2]); if (id && name) groups.set(id, name); } }, progress);
  await forEachCsvRow(paths.nutrientName, (row, i) => { if (i) { const id = text(row[0]), unit = text(row[3]), name = text(row[4]); if (id && name) nutrients.set(id, { name, unit: unit ?? '' }); } }, progress);
  await forEachCsvRow(paths.foodName, (row, i) => { if (i) { const id = text(row[0]), name = text(row[4]); if (id && name) foods.set(id, { externalId: id, dataSource: DATA_SOURCE, name, category: groups.get(row[2] ?? ''), servingSize: '100.00', servingUnit: 'g', calories: '0.00', protein: '0.00', fat: '0.00', carbohydrates: '0.00', fiber: '0.00', sugar: '0.00', sodium: '0.00', rawNutrients: [] }); } }, progress);
  await forEachCsvRow(paths.nutrientAmount, (row, i) => {
    if (!i) return;
    const food = foods.get(row[0] ?? ''), nId = row[1], val = row[2];
    if (!food || !nId || val === undefined) return;
    switch (nId) {
      case nutrientIds.calories: food.calories = decimal(val); break;
      case nutrientIds.kilojoules: if (food.calories === '0.00') food.calories = decimal(Number(val) * 0.239); break;
      case nutrientIds.protein: food.protein = decimal(val); break;
      case nutrientIds.fat: food.fat = decimal(val); break;
      case nutrientIds.carbohydrates: food.carbohydrates = decimal(val); break;
      case nutrientIds.fiber: food.fiber = decimal(val); break;
      case nutrientIds.sugar: food.sugar = decimal(val); break;
      case nutrientIds.sodium: food.sodium = decimal(val); break;
      default: food.rawNutrients.push({ id: nId, value: decimal(val) });
    }
  }, progress);

  logger.info('syncing nutrient metadata...');
  const nutrientIdMap = await syncNutrientMeta(sqlClient, Array.from(nutrients.values()));
  const db = drizzle(sqlClient);
  await db.delete(foodsTable).where(eq(foodsTable.dataSource, DATA_SOURCE));

  const allFoods = Array.from(foods.values()), chunkSize = 500;
  for (let i = 0; i < allFoods.length; i += chunkSize) {
    const chunk = allFoods.slice(i, i + chunkSize);
    const dbFoods = await insertFoodChunk(sqlClient, chunk);
    const idMap = new Map(dbFoods.map(f => [f.externalId, f.id]));
    const links: FoodNutrientLink[] = [];
    chunk.forEach(food => {
      const foodId = idMap.get(food.externalId);
      if (!foodId) return;
      food.rawNutrients.forEach(rn => {
        const meta = nutrients.get(rn.id);
        const nId = nutrientIdMap.get(`${meta?.name}|${meta?.unit}`);
        if (nId) links.push({ foodId, nutrientId: nId, value: rn.value });
      });
    });
    if (links.length) await insertFoodNutrientLinks(sqlClient, links);
    logger.setProgress(DATA_SOURCE, i + chunk.length, allFoods.length, 'loading CNF');
  }
  await sqlClient.close();
  logger.info(`loaded ${allFoods.length} CNF records`);
  return allFoods.length;
};
