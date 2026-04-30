import { prohibitedSubstancesTable, db } from '@repo/db';
import { $ } from 'bun';
import { z } from 'zod';
import { generateNormalizedObject, promptModelSelection } from './ai';
import { getLogger } from '../utils/logger';

const PDF_URL = 'https://www.wada-ama.org/sites/default/files/2023-09/2024list_en_final_22_september_2023.pdf';
const PDF_PATH = '/tmp/wada_2024.pdf';
const TXT_PATH = '/tmp/wada_2024.txt';

const WadaSchema = z.object({
  substances: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      notes: z.string(),
    }),
  ),
});

export const normalizeWada = async (verbose = false, purge = false) => {
  const logger = getLogger(verbose);

  const model = await promptModelSelection();

  logger.info('Fetching WADA Prohibited List PDF...');
  const response = await fetch(PDF_URL);
  await Bun.write(PDF_PATH, await response.arrayBuffer());

  logger.info('Extracting text from PDF...');
  await $`pdftotext -layout ${PDF_PATH} ${TXT_PATH}`.quiet();
  const text = await Bun.file(TXT_PATH).text();

  const sections = text.split(/\f/);
  const allSubstances: any[] = [];

  const totalSections = sections.length;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();

    if (section.length < 200) continue;
    if (section.toLowerCase().includes('table of contents')) continue;
    if (section.toLowerCase().includes('index of substances')) continue;

    logger.setProgress('wada', i + 1, totalSections, 'AI Extraction');

    const prompt = `Extract all prohibited substances from this page of the WADA Prohibited List. 
For each substance, identify its name and its category (e.g., "S1. Anabolic Agents", "S3. Beta-2 Agonists").
If there are specific notes or examples for the substance, include them in the "notes" field. If there are no notes, return an empty string "".

Page content:
${section}`;

    try {
      const { substances } = await generateNormalizedObject(prompt, WadaSchema, {
        model,
        temperature: 0,
        verbose,
      });

      if (substances && substances.length > 0) {
        allSubstances.push(...substances);
      } else {
        logger.debug(`No substances found on page ${i + 1}, skipping.`);
      }
    } catch (e) {
      logger.error(`Error parsing section ${i + 1}: ${e}`);
    }
  }

  logger.setProgress('wada', 0, 0, '');

  if (allSubstances.length > 0) {
    if (purge) {
      logger.info('Purging existing WADA substances as requested...');
      await db.delete(prohibitedSubstancesTable);
    }

    logger.info(`Extracted ${allSubstances.length} total substances. Syncing with database...`);

    const BATCH_SIZE = 100;
    for (let i = 0; i < allSubstances.length; i += BATCH_SIZE) {
      const batch = allSubstances.slice(i, i + BATCH_SIZE).map((s) => ({
        name: s.name,
        category: s.category,
        notes: s.notes || '',
      }));
      await db.insert(prohibitedSubstancesTable).values(batch).execute();
    }

    logger.info('WADA list successfully updated in database.');
  } else {
    logger.warn('No substances extracted from the WADA list.');
  }
};
