import { type NewFood } from '@repo/db';
import { foodsTable } from '@repo/db/src/schema';
import { $ } from 'bun';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { insertFoodChunk } from '../utils/foods';
import { getLogger } from '../utils/logger';
import {
  insertFoodNutrientLinks,
  syncNutrientMeta,
  type FoodNutrientLink,
  type NutrientMeta,
} from '../utils/nutrients';
import { env } from '@repo/env-manager';

const DATABASE_URL = env.DATABASE_URL;
const DATA_SOURCE = 'cofid';
const COFID_URL =
  'https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx';
const ZIP_PATH = '/tmp/cofid.xlsx';
const EXTRACT_PATH = '/tmp/cofid-xlsx';

const paths = {
  sharedStrings: `${EXTRACT_PATH}/xl/sharedStrings.xml`,
  proximates: `${EXTRACT_PATH}/xl/worksheets/sheet4.xml`,
  inorganics: `${EXTRACT_PATH}/xl/worksheets/sheet5.xml`,
};

type NutrientColumn = {
  column: string;
  name: string;
  unit: string;
};

type FoodData = NewFood & {
  rawNutrients: Record<string, string>;
};

const attr = (attrs: string, name: string) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const columnName = (cellRef: string) => cellRef.match(/^[A-Z]+/)?.[0] ?? '';

const xmlDecode = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-fA-F]+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));

const numberValue = (value: string | undefined) => {
  if (!value || value === '' || value === '-' || value === 'N' || value.toLowerCase() === 'tr') return 0;
  const num = Number(value.replace(/[^0-9.]/g, ''));
  return isFinite(num) ? num : 0;
};

const decimal = (value: string | number | undefined) => {
  const num = typeof value === 'number' ? value : numberValue(value);
  return num.toFixed(2);
};

const downloadExcel = () => {
  const logger = getLogger();
  return Bun.file(ZIP_PATH)
    .exists()
    .then((exists) => {
      if (exists) return;
      logger.setProgress(DATA_SOURCE, 0, 0, 'downloading CoFID');
      return fetch(COFID_URL).then((response) => {
        if (!response.ok) throw new Error(`CoFID download failed: ${response.status}`);
        const total = Number(response.headers.get('content-length') ?? 0);
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No body');
        const writer = Bun.file(ZIP_PATH).writer();
        let downloaded = 0;
        const pump = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) {
              writer.end();
              return;
            }
            writer.write(value);
            downloaded += value.byteLength;
            logger.setProgress(DATA_SOURCE, downloaded, total, 'downloading CoFID');
            return pump();
          });
        return pump();
      });
    });
};

const unzip = () => {
  const logger = getLogger();
  return Bun.file(paths.proximates)
    .exists()
    .then(async (exists) => {
      if (exists) return;
      logger.setProgress(DATA_SOURCE, 0, 1, 'extracting CoFID');
      await $`mkdir -p ${EXTRACT_PATH}`.quiet();
      await $`unzip -oq ${ZIP_PATH} -d ${EXTRACT_PATH}`.quiet();
      logger.setProgress(DATA_SOURCE, 1, 1, 'extracting CoFID');
    });
};

const parseSharedStrings = (xml: string) => {
  const strings: string[] = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let match: RegExpExecArray | null;
  while ((match = siRegex.exec(xml))) {
    const parts: string[] = [];
    const textRegex = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = textRegex.exec(match[1] ?? ''))) parts.push(xmlDecode(tMatch[1] ?? ''));
    strings.push(parts.join(''));
  }
  return strings;
};

const parseRows = (xml: string, sharedStrings: string[], onRow: (row: Map<string, string>, index: number) => void) => {
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let match: RegExpExecArray | null;
  let rowIndex = 0;
  while ((match = rowRegex.exec(xml))) {
    const rowXml = match[1] ?? '';
    const cellRegex = /<c\b([^>]*)>(?:<v>([\s\S]*?)<\/v>)?<\/c>/g;
    const row = new Map<string, string>();
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowXml))) {
      const attrs = cellMatch[1] ?? '';
      const val = cellMatch[2] ?? '';
      const col = columnName(attr(attrs, 'r') ?? '');
      const type = attr(attrs, 't');
      const finalVal = type === 's' ? (sharedStrings[Number(val)] ?? '') : xmlDecode(val);
      if (finalVal !== '') row.set(col, finalVal);
    }
    onRow(row, rowIndex++);
  }
};

export const loadCofid = async () => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);
  await downloadExcel();
  await unzip();

  const sharedStrings = parseSharedStrings(await Bun.file(paths.sharedStrings).text());
  const foods = new Map<string, FoodData>();
  const nutrientCols: NutrientColumn[] = [];

  logger.setProgress(DATA_SOURCE, 0, 100, 'parsing CoFID');
  parseRows(await Bun.file(paths.proximates).text(), sharedStrings, (row, i) => {
    if (i === 0) {
      row.forEach((val, col) => {
        const match = val.match(/(.+?)\s*\((.+?)\)/);
        if (match) nutrientCols.push({ column: col, name: match[1]!.trim(), unit: match[2]!.trim() });
      });
    }
    if (i < 3) return;
    const code = row.get('A');
    if (code) {
      const rawNutrients: Record<string, string> = {};
      nutrientCols.forEach((c) => {
        const val = row.get(c.column);
        if (val) rawNutrients[`${c.name}|${c.unit}`] = val;
      });

      foods.set(code, {
        externalId: code,
        dataSource: DATA_SOURCE,
        name: row.get('B') ?? '',
        category: row.get('D') ?? '',
        servingSize: '100.00',
        servingUnit: 'g',
        calories: decimal(row.get('M')),
        protein: decimal(row.get('J')),
        fat: decimal(row.get('K')),
        carbohydrates: decimal(row.get('L')),
        fiber: decimal(row.get('Z')),
        sugar: decimal(row.get('Q')),
        sodium: '0.00',
        rawNutrients,
      });
    }
  });

  parseRows(await Bun.file(paths.inorganics).text(), sharedStrings, (row, i) => {
    if (i < 3) return;
    const code = row.get('A');
    const food = foods.get(code ?? '');
    if (food) {
      food.sodium = decimal(row.get('H'));
      // Adding inorganics to rawNutrients (hardcoded for brevity)
      if (row.get('H')) food.rawNutrients['Sodium|mg'] = row.get('H')!;
      if (row.get('I')) food.rawNutrients['Potassium|mg'] = row.get('I')!;
      if (row.get('J')) food.rawNutrients['Calcium|mg'] = row.get('J')!;
    }
  });

  const uniqueNutrients = Array.from(new Set(Array.from(foods.values()).flatMap((f) => Object.keys(f.rawNutrients))));
  const meta: NutrientMeta[] = uniqueNutrients.map((n) => {
    const [name, unit] = n.split('|');
    return { name: name!, unit: unit! };
  });

  logger.info('syncing nutrient metadata...');
  const nutrientIdMap = await syncNutrientMeta(sqlClient, meta);

  const db = drizzle(sqlClient);
  await db.delete(foodsTable).where(eq(foodsTable.dataSource, DATA_SOURCE));

  const allFoods = Array.from(foods.values());
  const chunkSize = 500;
  for (let i = 0; i < allFoods.length; i += chunkSize) {
    const chunk = allFoods.slice(i, i + chunkSize);
    const dbFoods = await insertFoodChunk(sqlClient, chunk);
    const idMap = new Map(dbFoods.map((f) => [f.externalId, f.id]));

    const links: FoodNutrientLink[] = [];
    chunk.forEach((food) => {
      const foodId = idMap.get(food.externalId!);
      if (!foodId) return;

      Object.entries(food.rawNutrients).forEach(([n, v]) => {
        const nutrientId = nutrientIdMap.get(n);
        if (nutrientId && v && v !== 'N' && v.toLowerCase() !== 'tr') {
          links.push({ foodId, nutrientId, value: v });
        }
      });
    });

    if (links.length) await insertFoodNutrientLinks(sqlClient, links);
    logger.setProgress(DATA_SOURCE, i + chunk.length, allFoods.length, 'loading CoFID');
  }

  await sqlClient.close();
  logger.info(`loaded ${allFoods.length} CoFID records`);
  return allFoods.length;
};
