import { type NewFood } from '@repo/db';
import { foodsTable } from '@repo/db/src/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { insertFoodChunk } from '../utils/foods';
import { getLogger } from '../utils/logger';
import { env } from '@repo/env-manager';

const DATABASE_URL = env.DATABASE_URL;
const DATA_SOURCE = 'eambrosia';
const EAMBROSIA_URL = 'https://webgate.ec.europa.eu/eambrosia-api/api/v1/geographical-indications';
const DATA_PATH = '/tmp/eambrosia.json';

type EambrosiaItem = {
  giIdentifier: string;
  protectedNames: string[];
  countries: string[];
  giType: string;
  productType: string;
  status: string;
};

const downloadEambrosia = () => {
  const logger = getLogger();
  return Bun.file(DATA_PATH)
    .exists()
    .then((exists) => {
      if (exists) return;
      logger.setProgress(DATA_SOURCE, 0, 0, 'downloading eAmbrosia');
      return fetch(EAMBROSIA_URL).then((response) => {
        if (!response.ok) throw new Error(`eAmbrosia download failed: ${response.status}`);
        const total = Number(response.headers.get('content-length') ?? 0);
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No body');
        const writer = Bun.file(DATA_PATH).writer();
        let downloaded = 0;
        const pump = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) {
              writer.end();
              return;
            }
            writer.write(value);
            downloaded += value.byteLength;
            logger.setProgress(DATA_SOURCE, downloaded, total, 'downloading eAmbrosia');
            return pump();
          });
        return pump();
      });
    });
};

const parseEambrosia = async () => {
  const logger = getLogger();
  const raw = await Bun.file(DATA_PATH).text();
  const items = JSON.parse(raw) as EambrosiaItem[];
  logger.info(`parsed ${items.length} eAmbrosia records`);
  return items.map((item, _index) => ({
    externalId: item.giIdentifier,
    dataSource: DATA_SOURCE,
    name: item.protectedNames?.[0] || 'Unknown',
    brand: item.countries?.join(', ') || '',
    category: `${item.giType} - ${item.productType}`.slice(0, 255),
    servingSize: '100.00',
    servingUnit: 'g',
    calories: '0.00',
    protein: '0.00',
    fat: '0.00',
    carbohydrates: '0.00',
    fiber: '0.00',
    sugar: '0.00',
    sodium: '0.00',
  })) satisfies NewFood[];
};

export const loadEambrosia = async () => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);
  await downloadEambrosia();
  const foods = await parseEambrosia();
  const db = drizzle(sqlClient);
  await db.delete(foodsTable).where(eq(foodsTable.dataSource, DATA_SOURCE));
  const chunkSize = 1000;
  for (let i = 0; i < foods.length; i += chunkSize) {
    const chunk = foods.slice(i, i + chunkSize);
    await insertFoodChunk(sqlClient, chunk);
    logger.setProgress(DATA_SOURCE, i + chunk.length, foods.length, 'uploading eAmbrosia');
  }
  await sqlClient.close();
  logger.info(`loaded ${foods.length} eAmbrosia records`);
  return foods.length;
};
