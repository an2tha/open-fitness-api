import { prohibitedSubstancesTable, db } from '@repo/db';
import { $ } from 'bun';
import { z } from 'zod';
import { generateNormalizedObject, promptModelSelection } from './ai';
import { getLogger } from '../utils/logger';

const PDF_URL = 'https://www.wada-ama.org/sites/default/files/2023-09/2024list_en_final_22_september_2023.pdf';
const PDF_PATH = '/tmp/wada_2024.pdf';
const TXT_PATH = '/tmp/wada_2024.txt';

const WadaSchema = z.object({
  substances: z.array(z.object({
    name: z.string(),
    category: z.string(),
    notes: z.string().optional(),
  })),
});

export const normalizeWada = async (verbose = false) => {
  const logger = getLogger(verbose);
  
  const model = await logger.interactive(() => promptModelSelection());

  logger.setStatus('Fetching WADA Prohibited List PDF...');
  const response = await fetch(PDF_URL);
  await Bun.write(PDF_PATH, await response.arrayBuffer());

  logger.setStatus('Extracting text from PDF...');
  await $`pdftotext -layout ${PDF_PATH} ${TXT_PATH}`.quiet();
  const text = await Bun.file(TXT_PATH).text();

  const sections = text.split(/\f/); 
  const allSubstances: any[] = [];

  const totalSections = sections.length;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (section.length < 100) continue;

    logger.setStatus(`Parsing WADA section ${i + 1}/${totalSections} with AI...`);
    logger.setProgress('wada', i + 1, totalSections, 'AI Extraction');

    const prompt = `Extract all prohibited substances from this page of the WADA Prohibited List. 
For each substance, identify its name and its category (e.g., "S1. Anabolic Agents", "S3. Beta-2 Agonists").
If there are specific notes or examples for the substance, include them.

Page content:
${section}`;

    try {
      const { substances } = await generateNormalizedObject(prompt, WadaSchema, { 
        model, 
        temperature: 0,
        verbose 
      });
      allSubstances.push(...substances);
    } catch (e) {
      logger.error(`Error parsing section ${i + 1}: ${e}`);
    }
  }

  logger.clearStatus();
  logger.setProgress('wada', 0, 0, '');

  if (allSubstances.length > 0) {
    logger.info(`Extracted ${allSubstances.length} substances. Syncing with database...`);
    
    await db.delete(prohibitedSubstancesTable);
    
    const BATCH_SIZE = 100;
    for (let i = 0; i < allSubstances.length; i += BATCH_SIZE) {
      const batch = allSubstances.slice(i, i + BATCH_SIZE).map(s => ({
        name: s.name,
        category: s.category,
        notes: s.notes || null,
      }));
      await db.insert(prohibitedSubstancesTable).values(batch).execute();
    }
    
    logger.info('WADA list successfully updated in database.');
  } else {
    logger.warn('No substances extracted from the WADA list.');
  }
};
