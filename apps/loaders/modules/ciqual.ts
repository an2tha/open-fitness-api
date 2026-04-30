import { type NewFood } from '@repo/db';
import { foodsTable } from '@repo/db/src/schema';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { insertFoodChunk } from '../utils/foods';
import { getLogger } from '../utils/logger';
import { insertFoodNutrientLinks, syncNutrientMeta, type FoodNutrientLink } from '../utils/nutrients';

config({ path: new URL('../../../.env', import.meta.url).pathname, quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_SOURCE = 'ciqual';
const CIQUAL_URL = 'https://raw.githubusercontent.com/df-lib/ciqual-json/main/ciqual.json';
const DATA_PATH = '/tmp/ciqual.json';

type CiqualItem = {
  alim_code: string;
  alim_nom_en: string;
  alim_nom_fr: string;
  alim_grp_nom_en: string;
  nutrients: Record<string, string>;
};

const downloadCiqual = () => {
  const logger = getLogger();
  return Bun.file(DATA_PATH).exists().then(exists => {
    if (exists) return;
    logger.setProgress(DATA_SOURCE, 0, 0, 'downloading CIQUAL');
    return fetch(CIQUAL_URL).then(response => {
      if (!response.ok) throw new Error(`CIQUAL download failed: ${response.status}`);
      return response.text().then(text => Bun.write(DATA_PATH, text));
    });
  });
};

const parseCiqual = async () => {
  const logger = getLogger();
  const raw = await Bun.file(DATA_PATH).text();
  const items = JSON.parse(raw) as CiqualItem[];
  
  const allNutrientNames = new Set<string>();
  items.forEach(item => {
    Object.keys(item.nutrients).forEach(n => allNutrientNames.add(n));
  });

  const nutrientMeta = Array.from(allNutrientNames).map(n => {
    const match = n.match(/(.+?)\s*\((.+?)\)/);
    return { name: match?.[1]?.trim() || n, unit: match?.[2]?.trim() || 'g' };
  });

  logger.info(`parsed ${items.length} CIQUAL records`);
  
  const foods = items.map(item => ({
    externalId: String(item.alim_code),
    dataSource: DATA_SOURCE,
    name: item.alim_nom_en || item.alim_nom_fr,
    brand: 'CIQUAL',
    category: item.alim_grp_nom_en,
    servingSize: '100.00',
    servingUnit: 'g',
    calories: item.nutrients['Energy, kcal (kcal/100 g)'] || '0.00',
    protein: item.nutrients['Protein (g/100 g)'] || '0.00',
    fat: item.nutrients['Fat (g/100 g)'] || '0.00',
    carbohydrates: item.nutrients['Carbohydrate (g/100 g)'] || '0.00',
    fiber: item.nutrients['Fiber, total dietary (g/100 g)'] || '0.00',
    sugar: item.nutrients['Sugars (g/100 g)'] || '0.00',
    sodium: item.nutrients['Sodium (mg/100 g)'] || '0.00',
    rawNutrients: item.nutrients,
  }));

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
    const idMap = new Map(dbFoods.map(f => [f.externalId, f.id]));

    const links: FoodNutrientLink[] = [];
    chunk.forEach(food => {
      const foodId = idMap.get(food.externalId);
      if (!foodId) return;

      Object.entries(food.rawNutrients).forEach(([n, v]) => {
        const match = n.match(/(.+?)\s*\((.+?)\)/);
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
