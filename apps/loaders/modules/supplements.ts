import {
  ingredientsTable,
  supplementIngredientsTable,
  supplementsTable,
  type NewSupplement,
} from '@repo/db/src/schema';
import { $ } from 'bun';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { getLogger } from '../utils/logger';

config({ path: new URL('../../../.env', import.meta.url).pathname, quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_SOURCE = 'dsld';
const ZIP_PATH = '/tmp/supplements-dsld.zip';
const EXTRACT_PATH = '/tmp/supplements-dsld';
const DSLD_URL = 'https://api.ods.od.nih.gov/dsld/s3/data/DSLD-full-database-JSON.zip';

type DsldIngredient = {
  name: string;
  quantity?: Array<{
    quantity: number;
    unit: string;
  }>;
};

type DsldProduct = {
  id: number;
  fullName: string;
  brandName?: string;
  upcSku?: string;
  productType?: { langualCodeDescription: string };
  servingSizes?: Array<{ minQuantity: number; unit: string }>;
  ingredientRows?: DsldIngredient[];
  otheringredients?: { ingredients: DsldIngredient[] };
};

const downloadZip = () => {
  const logger = getLogger();
  const downloadsPath = '/Users/ananth/Downloads/DSLD-full-database-JSON.zip';

  return Bun.file(ZIP_PATH)
    .exists()
    .then(async exists => {
      if (exists) {
        const zipFile = Bun.file(ZIP_PATH);
        if (zipFile.size > 500000000) return;
        logger.warn(`Local /tmp ZIP is too small (${zipFile.size} bytes). Deleting...`);
        await $`rm -f ${ZIP_PATH}`.quiet();
      }

      const dlFile = Bun.file(downloadsPath);
      if (await dlFile.exists()) {
        if (dlFile.size > 500000000) {
          logger.info(`Using existing download from ${downloadsPath}...`);
          await $`cp ${downloadsPath} ${ZIP_PATH}`.quiet();
          return;
        } else {
          logger.warn(`File in ${downloadsPath} is also too small (${dlFile.size} bytes).`);
        }
      }

      logger.info(`Starting download from ${DSLD_URL} (this may be very slow)...`);
      logger.setProgress(DATA_SOURCE, 0, 0, 'downloading DSLD');
      return fetch(DSLD_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(response => {
        if (!response.ok) throw new Error(`DSLD download failed: ${response.status}`);
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
            logger.setProgress(DATA_SOURCE, downloaded, total, 'downloading DSLD');
            return pump();
          });
        return pump();
      });
    });
};

const unzip = () => {
  const logger = getLogger();
  return Bun.file(`${EXTRACT_PATH}/DSLD-full-database-JSON/1000.json`)
    .exists()
    .then(async exists => {
      if (exists) return;
      
      const zipFile = Bun.file(ZIP_PATH);
      if (!(await zipFile.exists()) || zipFile.size < 500000000) {
        await $`rm -f ${ZIP_PATH}`.quiet();
        throw new Error('DSLD ZIP file corrupted or incomplete. Please run again to retry download.');
      }

      logger.setProgress(DATA_SOURCE, 0, 1, 'extracting DSLD');
      await $`mkdir -p ${EXTRACT_PATH}`.quiet();
      
      return $`unzip -oq ${ZIP_PATH} -d ${EXTRACT_PATH}`.quiet().catch(async err => {
        logger.error(`Unzip failed (code ${err.exitCode}). Deleting corrupted ZIP...`);
        await $`rm -f ${ZIP_PATH}`.quiet();
        throw new Error('Unzip failed. Corrupted ZIP deleted. Please try again.');
      });
    });
};

export const loadDsldSupplements = async () => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);
  const db = drizzle(sqlClient);

  await downloadZip();
  await unzip();

  const glob = new Bun.Glob(`${EXTRACT_PATH}/DSLD-full-database-JSON/*.json`);
  const files = Array.from(glob.scanSync());
  logger.info(`found ${files.length} DSLD records`);

  // 1. Clear existing
  logger.info('clearing existing supplements...');
  await db.delete(supplementsTable).where(eq(supplementsTable.dataSource, DATA_SOURCE));

  const ingredientCache = new Map<string, number>();
  const dbIngredients = await db.select().from(ingredientsTable);
  dbIngredients.forEach(i => ingredientCache.set(i.name, i.id));

  let processed = 0;
  const chunkSize = 1000;
  const linkBatch: Array<{ supplementId: number; ingredientId: number; amount: string }> = [];

  logger.setProgress(DATA_SOURCE, 0, files.length, 'loading DSLD');

  for (let i = 0; i < files.length; i += chunkSize) {
    const chunkFiles = files.slice(i, i + chunkSize);
    const supplements: NewSupplement[] = [];
    const products: DsldProduct[] = [];

    for (const f of chunkFiles) {
      try {
        const p = (await Bun.file(f).json()) as DsldProduct;
        products.push(p);
        supplements.push({
          externalId: p.upcSku || String(p.id),
          dataSource: DATA_SOURCE,
          name: p.fullName.slice(0, 2056),
          brand: p.brandName?.slice(0, 2056),
          category: p.productType?.langualCodeDescription?.slice(0, 2056),
          servingSize: String(p.servingSizes?.[0]?.minQuantity ?? '1'),
          servingUnit: p.servingSizes?.[0]?.unit?.slice(0, 2056) ?? 'serving',
        });
      } catch (err) {
        // Skip corrupted JSON
      }
    }

    if (!supplements.length) continue;

    // Insert supplements
    const inserted = await db.insert(supplementsTable).values(supplements).returning({ id: supplementsTable.id, externalId: supplementsTable.externalId });
    const supIdMap = new Map(inserted.map(s => [s.externalId, s.id]));

    // Track new ingredients
    const newIngredients = new Set<string>();
    products.forEach(p => {
      const allIngs = [...(p.ingredientRows ?? []), ...(p.otheringredients?.ingredients ?? [])];
      allIngs.forEach(ing => {
        if (!ingredientCache.has(ing.name)) newIngredients.add(ing.name);
      });
    });

    if (newIngredients.size > 0) {
      await db.insert(ingredientsTable).values(Array.from(newIngredients).map(name => ({ name }))).onConflictDoNothing();
      const refreshed = await db.select().from(ingredientsTable);
      refreshed.forEach(ing => ingredientCache.set(ing.name, ing.id));
    }

    // Prepare links
    products.forEach(p => {
      const supId = supIdMap.get(p.upcSku || String(p.id));
      if (!supId) return;

      const allIngs = [...(p.ingredientRows ?? []), ...(p.otheringredients?.ingredients ?? [])];
      allIngs.forEach(ing => {
        const ingId = ingredientCache.get(ing.name);
        if (ingId) {
          const qty = ing.quantity?.[0];
          linkBatch.push({
            supplementId: supId,
            ingredientId: ingId,
            amount: qty ? `${qty.quantity} ${qty.unit}` : 'present',
          });
        }
      });
    });

    if (linkBatch.length >= 5000) {
      await db.insert(supplementIngredientsTable).values(linkBatch).onConflictDoNothing();
      linkBatch.length = 0;
    }

    processed += chunkFiles.length;
    logger.setProgress(DATA_SOURCE, processed, files.length, 'loading DSLD');
  }

  if (linkBatch.length > 0) {
    await db.insert(supplementIngredientsTable).values(linkBatch).onConflictDoNothing();
  }

  await sqlClient.close();
  logger.info(`loaded ${processed} supplements from DSLD`);
  return processed;
};
