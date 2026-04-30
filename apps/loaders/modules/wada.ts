import { prohibitedSubstancesTable } from '@repo/db/src/schema';
import { $ } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { getLogger } from '../utils/logger';

const PDF_URL = 'https://www.wada-ama.org/sites/default/files/2023-09/2024list_en_final_22_september_2023.pdf';
const PDF_PATH = '/tmp/wada_2024.pdf';
const TXT_PATH = '/tmp/wada_2024.txt';
const DATA_SOURCE = 'wada';

export const loadWadaList = async () => {
  const logger = getLogger();
  const sqlClient = new Bun.SQL(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  logger.setProgress(DATA_SOURCE, 0, 100, 'fetching PDF');
  const response = await fetch(PDF_URL);
  await Bun.write(PDF_PATH, await response.arrayBuffer());
  logger.setProgress(DATA_SOURCE, 25, 100, 'extracting text');

  await $`pdftotext -layout ${PDF_PATH} ${TXT_PATH}`.quiet();
  logger.setProgress(DATA_SOURCE, 50, 100, 'parsing substances');

  const text = await Bun.file(TXT_PATH).text();
  const lines = text.split('\n');

  const substances: Array<{ name: string; category: string; notes?: string }> = [];
  let currentCategory = 'General';
  let startParsing = false;

  for (const line of lines) {
    const trimmed = line.trim().replace(/\s+/g, ' ');
    if (!trimmed) continue;

    if (trimmed.toLowerCase().includes('s0 non-approved substances')) {
      startParsing = true;
    }

    if (!startParsing) continue;
    if (trimmed.includes('.....')) continue; // Skip TOC dots

    // Detect Category
    const catMatch = trimmed.match(/^([S|M|P]\d\.?\s+[A-Z\-\s]+)$/);
    if (catMatch) {
      currentCategory = trimmed;
      continue;
    }

    if (trimmed.length > 5 && trimmed.length < 120) {
      const parts = trimmed.split(/ {3,}| • | \u0007 /); // Split by spaces, bullets, or bell chars
      for (const part of parts) {
        let name = part
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
          .replace(/^[•\-\d\w]\.\s+/, '')
          .replace(/^•\s+/, '')
          .replace(/^•/, '')
          .trim();

        if (name.length > 5 && name.length < 100) {
          // Skip noise
          if (name.match(/^[a-z].*[0-9]$/i)) continue; // page numbers
          if (name.match(/^(the|and|for|not|see|under|including|examples|include|but|list|are|all|table|contents|page|prohibited|when|administered|exogenously|limited|all|substances|class|specified)/i)) continue;
          if (name.split(' ').length > 7) continue;
          
          substances.push({ name, category: currentCategory });
        }
      }
    }
  }

  logger.setProgress(DATA_SOURCE, 75, 100, `syncing ${substances.length} items`);

  if (substances.length > 0) {
    await db.delete(prohibitedSubstancesTable);
    for (let i = 0; i < substances.length; i += 100) {
      await db.insert(prohibitedSubstancesTable).values(substances.slice(i, i + 100));
    }
  }

  logger.setProgress(DATA_SOURCE, 100, 100, 'done');
  await sqlClient.close();
};
