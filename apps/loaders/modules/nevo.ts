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
const DATA_SOURCE = 'nevo';
const HOME_URL = 'https://nevo-online.rivm.nl/';
const DATA_URL = 'https://nevo-online.rivm.nl/Home/GetJsonData?langSetting=nl';
const HOME_PATH = '/tmp/nevo-online.html';
const DATA_PATH = '/tmp/nevo-online.json';

const requestHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-GPC': '1',
  Referer: HOME_URL,
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
};

const primaryCodes = {
  calories: 'ENERCC',
  kilojoules: 'ENERCJ',
  protein: 'PROT',
  fat: 'FAT',
  carbohydrates: 'CHO',
  fiber: 'FIBT',
  sugar: 'SUGAR',
  sodium: 'NA',
};

type NutrientColumn = {
  index: number;
  code: string;
  name: string;
  unit: string;
};

const htmlDecode = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-fA-F]+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));

const stripTags = (value: string) => htmlDecode(value.replace(/<[^>]*>/g, '').trim());

const text = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const numberValue = (value: string | undefined) => {
  const normalized = text(value);
  if (!normalized || normalized === '-' || normalized.startsWith('<')) return undefined;
  const number = Number(normalized.replace(',', '.'));
  return Number.isFinite(number) ? number : undefined;
};

const decimal = (value: string | number | undefined, fallback = '0') => {
  const number = typeof value === 'number' ? value : numberValue(value);
  if (number === undefined) return fallback;
  return number.toFixed(2);
};

const splitCodeUnit = (id: string) => {
  const index = id.lastIndexOf('_');
  if (index === -1) return { code: id, unit: '' };
  return { code: id.slice(0, index), unit: id.slice(index + 1) };
};

const downloadFile = (url: string, path: string, label: string, headers: Record<string, string> = {}) => {
  const logger = getLogger();
  return Bun.file(path)
    .exists()
    .then((exists) => {
      if (exists) return;
      logger.setProgress(DATA_SOURCE, 0, 0, label);
      return fetch(url, { headers }).then((response) => {
        if (!response.ok) throw new Error(`${label} failed: ${response.status}`);
        const total = Number(response.headers.get('content-length') ?? 0);
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No body');
        const writer = Bun.file(path).writer();
        let downloaded = 0;
        const pump = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) {
              writer.end();
              return;
            }
            writer.write(value);
            downloaded += value.byteLength;
            logger.setProgress(DATA_SOURCE, downloaded, total, label);
            return pump();
          });
        return pump();
      });
    });
};

const parseHeaders = async () => {
  const html = await Bun.file(HOME_PATH).text();
  const thead = html.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? '';
  const headers = Array.from(thead.matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/g));
  const nutrients: NutrientColumn[] = [];
  const indexes: Record<string, number | undefined> = {};
  const seen = new Set<string>();

  headers.forEach((match, index) => {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    const id = attrs.match(/\bid=['"]([^'"]+)['"]/)?.[1];
    const name = stripTags(body).replace(/\s*\([^)]*\)\s*$/, '');
    if (!id || index < 12) return;
    const { code, unit } = splitCodeUnit(id);
    if (indexes[code] === undefined) indexes[code] = index;
    if (seen.has(code)) return;
    seen.add(code);
    nutrients.push({ index, code, name, unit });
  });

  return { nutrients, indexes };
};

const parseNevoFoods = async () => {
  const logger = getLogger();
  const headers = await parseHeaders();
  const raw = await Bun.file(DATA_PATH).text();
  const html = JSON.parse(raw) as string;
  const total = html.length;
  const foods: (NewFood & { rawNutrients: Record<string, string> })[] = [];
  const rowRegex = /<tr\b[^>]*>[\s\S]*?<\/tr>/g;
  let match: RegExpExecArray | null;
  let lastProgress = 0;

  logger.setProgress(DATA_SOURCE, 0, total, 'parsing NEVO');

  while ((match = rowRegex.exec(html))) {
    const cells = Array.from(match[0].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)).map((m) => stripTags(m[1] ?? ''));
    const externalId = text(cells[1]);
    const name = text(cells[3]) ?? text(cells[2]);
    if (externalId && name) {
      const rawNutrients: Record<string, string> = {};
      headers.nutrients.forEach((n) => {
        const val = cells[n.index];
        if (val && val !== '-' && val !== '0') rawNutrients[`${n.name}|${n.unit}`] = val;
      });

      foods.push({
        externalId,
        dataSource: DATA_SOURCE,
        name,
        brand: text(cells[2]) !== name ? text(cells[2]) : undefined,
        category: text(cells[5]),
        servingSize: '100.00',
        servingUnit: 'g',
        calories: decimal(cells[headers.indexes[primaryCodes.calories] ?? -1]),
        protein: decimal(cells[headers.indexes[primaryCodes.protein] ?? -1]),
        fat: decimal(cells[headers.indexes[primaryCodes.fat] ?? -1]),
        carbohydrates: decimal(cells[headers.indexes[primaryCodes.carbohydrates] ?? -1]),
        fiber: decimal(cells[headers.indexes[primaryCodes.fiber] ?? -1]),
        sugar: decimal(cells[headers.indexes[primaryCodes.sugar] ?? -1]),
        sodium: decimal(cells[headers.indexes[primaryCodes.sodium] ?? -1]),
        rawNutrients,
      });
    }

    if (rowRegex.lastIndex - lastProgress >= 262144) {
      lastProgress = rowRegex.lastIndex;
      logger.setProgress(DATA_SOURCE, lastProgress, total, 'parsing NEVO');
    }
  }

  return { foods, nutrients: headers.nutrients };
};

export const loadNevoFoods = async () => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);

  await downloadFile(HOME_URL, HOME_PATH, 'downloading NEVO headers', { 'User-Agent': requestHeaders['User-Agent'] });
  await downloadFile(DATA_URL, DATA_PATH, 'downloading NEVO data', requestHeaders);

  const { foods, nutrients } = await parseNevoFoods();

  logger.info('syncing nutrient metadata...');
  const nutrientIdMap = await syncNutrientMeta(
    sqlClient,
    nutrients.map((n) => ({ name: n.name, unit: n.unit })),
  );

  const db = drizzle(sqlClient);
  await db.delete(foodsTable).where(eq(foodsTable.dataSource, DATA_SOURCE));

  const chunkSize = 500;
  for (let i = 0; i < foods.length; i += chunkSize) {
    const chunk = foods.slice(i, i + chunkSize);
    const dbFoods = await insertFoodChunk(sqlClient, chunk);
    const idMap = new Map(dbFoods.map((f) => [f.externalId, f.id]));

    const links: FoodNutrientLink[] = [];
    chunk.forEach((food) => {
      const foodId = idMap.get(food.externalId!);
      if (!foodId) return;

      Object.entries(food.rawNutrients).forEach(([n, v]) => {
        const nutrientId = nutrientIdMap.get(n);
        if (nutrientId) links.push({ foodId, nutrientId, value: v });
      });
    });

    if (links.length) await insertFoodNutrientLinks(sqlClient, links);
    logger.setProgress(DATA_SOURCE, i + chunk.length, foods.length, 'loading NEVO');
  }

  await sqlClient.close();
  logger.info(`loaded ${foods.length} NEVO records`);
  return foods.length;
};
