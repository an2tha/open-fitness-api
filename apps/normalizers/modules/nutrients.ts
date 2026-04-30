import { db } from '@repo/db';
import {
  nutrientsTable,
  nutrientsNormalizedTable,
  nutrientsNormalizedMappingTable,
} from '@repo/db';
import { generateNormalizedObject, promptModelSelection } from './ai';
import { getLogger } from '../utils/logger';
import { z } from 'zod';

interface Nutrient {
  id: number;
  name: string;
  unit: string;
}

const NutrientMappingSchema = z.object({
  results: z.array(z.object({
    originalName: z.string(),
    normalizedName: z.string(),
    normalizedUnit: z.string(),
  })),
});

interface NutrientNormalizationResult {
  originalIds: number[];
  originalName: string;
  normalizedName: string;
  normalizedUnit: string;
}

const CHUNK_SIZE = 75;

const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '');

export const normalizeNutrients = async (verbose = false) => {
  const logger = getLogger(verbose);
  logger.info('Starting nutrient normalization...');

  const model = await logger.interactive(() => promptModelSelection());
  logger.info(`Using model: ${model}`);

  logger.setStatus('Fetching nutrients from database...');
  const nutrients = await db
    .select({
      id: nutrientsTable.id,
      name: nutrientsTable.name,
      unit: nutrientsTable.unit,
    })
    .from(nutrientsTable)
    .execute();
  logger.clearStatus();

  if (nutrients.length === 0) {
    logger.warn('No nutrients found to normalize.');
    return;
  }

  logger.info(`Found ${nutrients.length} total nutrient records.`);

  logger.setStatus('Applying first-pass normalization (grouping duplicates)...');
  
  const firstPassGroups = new Map<string, { 
    representativeName: string; 
    representativeUnit: string; 
    members: { originalName: string, originalUnit: string, ids: number[] }[] 
  }>();

  for (const n of nutrients) {
    const key = `${slugify(n.name)}:${slugify(n.unit)}`;
    const group = firstPassGroups.get(key);
    
    if (group) {
      const existingMember = group.members.find(m => m.originalName === n.name && m.originalUnit === n.unit);
      if (existingMember) {
        existingMember.ids.push(n.id);
      } else {
        group.members.push({ originalName: n.name, originalUnit: n.unit, ids: [n.id] });
      }
    } else {
      firstPassGroups.set(key, {
        representativeName: n.name,
        representativeUnit: n.unit,
        members: [{ originalName: n.name, originalUnit: n.unit, ids: [n.id] }]
      });
    }
  }

  const uniqueGroups = Array.from(firstPassGroups.values());
  logger.info(`Reduced ${nutrients.length} records to ${uniqueGroups.length} unique groups for AI.`);
  logger.clearStatus();

  const normalizedResults: NutrientNormalizationResult[] = [];
  const totalChunks = Math.ceil(uniqueGroups.length / CHUNK_SIZE);
  let currentChunk = 0;

  for (let i = 0; i < uniqueGroups.length; i += CHUNK_SIZE) {
    currentChunk++;
    const chunk = uniqueGroups.slice(i, i + CHUNK_SIZE);
    const progress = Math.min(i + CHUNK_SIZE, uniqueGroups.length);

    logger.setStatus(`Normalizing nutrients with AI (${progress}/${uniqueGroups.length})...`);
    logger.setProgress('normalize', currentChunk, totalChunks, 'AI Normalization');

    const nutrientList = chunk
      .map((g) => `- Name: "${g.representativeName}", Unit: "${g.representativeUnit}"`)
      .join('\n');

    const prompt = `You are a world-class nutrition data expert and data normalizer. Your task is to take a list of nutrient names and units and normalize them into a standardized, canonical format.

STRICT NORMALIZATION RULES:
1. LANGUAGE: All normalized names MUST be in English.
2. NAMES: Use official, scientific, or standard industry names (e.g., "Vitamin C" instead of "Ascorbic Acid", "Energy" instead of "Calories" or "Énergie").
3. CASING: Use Title Case for nutrient names (e.g., "Vitamin D", "Calcium").
4. UNITS: Normalize units to their standard abbreviations:
   - "g" for grams
   - "mg" for milligrams
   - "mcg" for micrograms
   - "kcal" for kilocalories (for energy)
   - "kJ" for kilojoules (for energy)
   - "IU" for International Units
5. CONSISTENCY: If the input name implies a specific form (e.g., "Vitamin D3"), preserve the specific form in the normalized name.
6. DATA INTEGRITY: You MUST return the exact "originalName" provided in the input for each entry so it can be mapped back to the database.

Input nutrients:
${nutrientList}`;

    try {
      const { results } = await generateNormalizedObject(prompt, NutrientMappingSchema, { 
        model, 
        temperature: 0.1,
        verbose
      });

      for (const normalized of results) {
        const matchedGroup = chunk.find(
          (g) => g.representativeName === normalized.originalName || 
                 slugify(g.representativeName) === slugify(normalized.originalName)
        );

        if (matchedGroup) {
          for (const member of matchedGroup.members) {
            normalizedResults.push({
              originalIds: member.ids,
              originalName: member.originalName,
              normalizedName: normalized.normalizedName,
              normalizedUnit: normalized.normalizedUnit,
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Error processing chunk: ${error}`);
    }
  }

  logger.clearStatus();
  logger.setProgress('normalize', 0, 0, '');

  logger.info(`Received ${normalizedResults.length} normalization entries from AI.`);

  if (normalizedResults.length === 0) {
    logger.warn('No normalization entries were returned by AI. Skipping database update.');
    return;
  }

  const uniqueNormalizedToInsert = Array.from(
    new Map(normalizedResults.map((n) => [`${n.normalizedName}:${n.normalizedUnit}`, { name: n.normalizedName, unit: n.normalizedUnit }])).values()
  );

  if (uniqueNormalizedToInsert.length > 0) {
    logger.setStatus(`Upserting ${uniqueNormalizedToInsert.length} normalized nutrients...`);
    await db
      .insert(nutrientsNormalizedTable)
      .values(uniqueNormalizedToInsert)
      .onConflictDoNothing()
      .execute();
    logger.clearStatus();
  }

  logger.setStatus('Fetching all normalized nutrients...');
  const allNormalized = await db
    .select({
      id: nutrientsNormalizedTable.id,
      name: nutrientsNormalizedTable.name,
      unit: nutrientsNormalizedTable.unit,
    })
    .from(nutrientsNormalizedTable)
    .execute();
  logger.clearStatus();

  const normalizedMap = new Map(
    allNormalized.map((n) => [`${n.name}:${n.unit}`, n.id])
  );

  logger.setStatus('Creating nutrient mappings...');
  const mappings = normalizedResults
    .flatMap((n) => {
      const normalizedId = normalizedMap.get(`${n.normalizedName}:${n.normalizedUnit}`);
      if (normalizedId) {
        return n.originalIds.map(originalId => ({
          originalNutrientId: originalId,
          normalizedNutrientId: normalizedId,
          originalName: n.originalName,
          normalizedName: n.normalizedName,
        }));
      }
      return [];
    });

  if (mappings.length > 0) {
    const MAPPING_BATCH_SIZE = 1000;
    for (let i = 0; i < mappings.length; i += MAPPING_BATCH_SIZE) {
      const batch = mappings.slice(i, i + MAPPING_BATCH_SIZE);
      await db.insert(nutrientsNormalizedMappingTable).values(batch).onConflictDoNothing().execute();
    }
  }
  logger.clearStatus();

  logger.info('Nutrient normalization complete.');
};
