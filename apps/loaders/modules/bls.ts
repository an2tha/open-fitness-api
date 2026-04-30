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
const DATA_SOURCE = 'bls';
const BLS_URL = 'https://blsdb.de/assets/uploads/BLS_4_0_2025_DE.zip?token=394I-A488-FGAI-H7IK-LOYK-YFW0-FR0I-M2TB';
const ZIP_PATH = '/tmp/bls-4-0-2025-de.zip';
const EXTRACT_PATH = '/tmp/bls-4-0-2025-de';
const PACKAGE_PATH = `${EXTRACT_PATH}/BLS_4_0_2025_DE`;
const DATA_XLSX = `${PACKAGE_PATH}/BLS_4_0_Daten_2025_DE.xlsx`;
const XLSX_PATH = `${EXTRACT_PATH}/xlsx-data`;

const paths = {
  sharedStrings: `${XLSX_PATH}/xl/sharedStrings.xml`,
  sheet: `${XLSX_PATH}/xl/worksheets/sheet1.xml`,
};

const primaryCodes = {
  calories: 'ENERCC',
  kilojoules: 'ENERCJ',
  protein: 'PROT625',
  fat: 'FAT',
  carbohydrates: 'CHO',
  fiber: 'FIBT',
  sugar: 'SUGAR',
  sodium: 'NA',
};

const primaryCodeSet = new Set(Object.values(primaryCodes));

type BlsOptions = {
  insertConcurrency?: number;
  chunkSize?: number;
};

type NutrientColumn = {
  column: string;
  code: string;
  name: string;
  unit: string;
};

const xmlDecode = (value: string) => {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-fA-F]+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
};

const attr = (attrs: string, name: string) => {
  return attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
};

const columnName = (cellRef: string) => cellRef.match(/^[A-Z]+/)?.[0] ?? '';

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

const downloadZip = () => {
  const logger = getLogger();

  return Bun.file(ZIP_PATH)
    .exists()
    .then((exists) => {
      if (exists) {
        logger.setProgress(DATA_SOURCE, 1, 1, 'BLS zip ready');
        return;
      }

      logger.setProgress(DATA_SOURCE, 0, 0, 'downloading BLS');

      return fetch(BLS_URL).then((response) => {
        if (!response.ok) {
          return response.text().then((body) => {
            throw new Error(`BLS download failed with ${response.status}: ${body}`);
          });
        }

        const total = Number(response.headers.get('content-length') ?? 0);
        const reader = response.body?.getReader();
        if (!reader) throw new Error('BLS download response has no body');

        const writer = Bun.file(ZIP_PATH).writer();
        let downloaded = 0;

        const pump = (): Promise<void> => {
          return reader.read().then(({ done, value }) => {
            if (done) {
              writer.end();
              logger.setProgress(DATA_SOURCE, total || downloaded, total || downloaded, 'downloading BLS');
              return;
            }

            writer.write(value);
            downloaded += value.byteLength;
            logger.setProgress(DATA_SOURCE, downloaded, total, 'downloading BLS');
            return pump();
          });
        };

        return pump();
      });
    });
};

const unzip = () => {
  const logger = getLogger();

  return Bun.file(paths.sheet)
    .exists()
    .then((exists) => {
      if (exists) {
        logger.setProgress(DATA_SOURCE, 1, 1, 'BLS extracted');
        return;
      }

      logger.setProgress(DATA_SOURCE, 0, 2, 'extracting BLS');
      return $`mkdir -p ${EXTRACT_PATH} ${XLSX_PATH}`
        .quiet()
        .then(() => $`unzip -oq ${ZIP_PATH} -d ${EXTRACT_PATH}`.quiet())
        .then(() => {
          logger.setProgress(DATA_SOURCE, 1, 2, 'extracting BLS');
          return $`unzip -oq ${DATA_XLSX} -d ${XLSX_PATH}`.quiet();
        })
        .then(() => {
          logger.setProgress(DATA_SOURCE, 2, 2, 'BLS extracted');
        });
    });
};

const parseSharedStrings = (xml: string) => {
  const strings: string[] = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let siMatch: RegExpExecArray | null;

  while ((siMatch = siRegex.exec(xml))) {
    const body = siMatch[1] ?? '';
    const parts: string[] = [];
    const textRegex = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
    let textMatch: RegExpExecArray | null;

    while ((textMatch = textRegex.exec(body))) parts.push(xmlDecode(textMatch[1] ?? ''));
    strings.push(parts.join(''));
  }

  return strings;
};

const parseRow = (rowXml: string, sharedStrings: string[]) => {
  const row = new Map<string, string>();
  const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g;
  let cellMatch: RegExpExecArray | null;

  while ((cellMatch = cellRegex.exec(rowXml))) {
    const attrs = cellMatch[1] ?? cellMatch[3] ?? '';
    const body = cellMatch[2] ?? '';
    const column = columnName(attr(attrs, 'r') ?? '');
    if (!column) continue;

    const type = attr(attrs, 't');
    const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
    let value = '';

    if (type === 's') value = sharedStrings[Number(rawValue)] ?? '';
    else if (type === 'inlineStr') value = xmlDecode(body.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/)?.[1] ?? '');
    else value = xmlDecode(rawValue);

    if (value !== '') row.set(column, value);
  }

  return row;
};

const parseNutrientColumns = (header: Map<string, string>) => {
  const columns: NutrientColumn[] = [];

  for (const [column, value] of header) {
    if (['A', 'B', 'C', 'PB'].includes(column)) continue;
    if (value.includes('Datenherkunft') || value.includes('Referenz')) continue;

    const match = value.match(/^([^\s]+)\s+(.+?)\s+\[([^\]]+)\/100g\]$/);
    if (!match) continue;

    columns.push({ column, code: match[1] ?? '', name: match[2] ?? '', unit: match[3] ?? '' });
  }

  return columns;
};

const parseBlsFoods = async () => {
  const logger = getLogger();
  const sharedStrings = parseSharedStrings(await Bun.file(paths.sharedStrings).text());
  const sheet = await Bun.file(paths.sheet).text();
  const total = sheet.length;
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  let nutrientColumns: NutrientColumn[] = [];
  const foods: (NewFood & { micronutrients: Array<{ code: string; value: string }> })[] = [];
  let rowIndex = 0;
  let lastProgress = 0;

  logger.setProgress(DATA_SOURCE, 0, total, 'parsing BLS');

  while ((rowMatch = rowRegex.exec(sheet))) {
    const row = parseRow(rowMatch[1] ?? '', sharedStrings);

    if (rowIndex === 0) {
      nutrientColumns = parseNutrientColumns(row);
    } else {
      const externalId = text(row.get('A'));
      const name = text(row.get('C')) ?? text(row.get('B'));

      if (externalId && name) {
        const micronutrients = nutrientColumns
          .filter((nutrient) => !primaryCodeSet.has(nutrient.code))
          .flatMap((nutrient) => {
            const value = numberValue(row.get(nutrient.column));
            if (value === undefined || value === 0) return [];
            return [{ code: nutrient.code, value: decimal(value) }];
          });

        foods.push({
          externalId,
          dataSource: DATA_SOURCE,
          name,
          servingSize: '100.00',
          servingUnit: 'g',
          calories: decimal(row.get('G')),
          protein: decimal(row.get('M')),
          fat: decimal(row.get('P')),
          carbohydrates: decimal(row.get('S')),
          fiber: decimal(row.get('V')),
          sugar: decimal(row.get('HL')),
          sodium: decimal(row.get('DT')),
          micronutrients,
        });
      }
    }

    rowIndex += 1;

    if (rowRegex.lastIndex - lastProgress >= 524288) {
      lastProgress = rowRegex.lastIndex;
      logger.setProgress(DATA_SOURCE, rowRegex.lastIndex, total, 'parsing BLS');
    }
  }

  logger.setProgress(DATA_SOURCE, total, total, 'parsing BLS');
  logger.info(`parsed ${foods.length} BLS foods`);

  return { foods, nutrientColumns };
};

const insertFoods = async (
  data: {
    foods: (NewFood & { micronutrients: Array<{ code: string; value: string }> })[];
    nutrientColumns: NutrientColumn[];
  },
  options: Required<BlsOptions>,
) => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);
  const { foods, nutrientColumns } = data;

  // 1. Sync Nutrient Metadata
  logger.info('syncing nutrient metadata...');
  const nutrientIdMap = await syncNutrientMeta(
    sqlClient,
    nutrientColumns.map((c) => ({ name: c.name, unit: c.unit })),
  );

  // 2. Clear existing
  const db = drizzle(sqlClient);
  logger.setProgress(DATA_SOURCE, 0, 100, 'clearing BLS');
  await db.delete(foodsTable).where(eq(foodsTable.dataSource, DATA_SOURCE));

  // 3. Insert Foods and link Nutrients
  let inserted = 0;
  const chunkSize = options.chunkSize;

  for (let i = 0; i < foods.length; i += chunkSize) {
    const chunk = foods.slice(i, i + chunkSize);

    // Insert foods and get IDs
    const dbFoods = await insertFoodChunk(sqlClient, chunk);
    const idMap = new Map(dbFoods.map((f) => [f.externalId, f.id]));

    // Prepare link rows
    const links: FoodNutrientLink[] = [];
    chunk.forEach((food) => {
      const foodId = idMap.get(food.externalId!);
      if (!foodId) return;

      food.micronutrients.forEach((m) => {
        const meta = nutrientColumns.find((c) => c.code === m.code);
        const nutrientId = nutrientIdMap.get(`${meta?.name}|${meta?.unit}`);
        if (nutrientId) {
          links.push({ foodId, nutrientId, value: m.value });
        }
      });
    });

    if (links.length) {
      await insertFoodNutrientLinks(sqlClient, links);
    }

    inserted += chunk.length;
    logger.setProgress(DATA_SOURCE, inserted, foods.length, 'loading BLS');
  }

  await sqlClient.close();
  logger.info(`loaded ${inserted} BLS foods and nutrients`);
  return inserted;
};

export const loadBlsFoods = async (options: BlsOptions = {}) => {
  const resolved = {
    insertConcurrency: Math.max(options.insertConcurrency ?? 4, 1),
    chunkSize: Math.max(options.chunkSize ?? 500, 1),
  };

  await downloadZip();
  await unzip();

  const data = await parseBlsFoods();
  return insertFoods(data, resolved);
};
