import { db } from '@repo/db';
import { 
  nutrientsTable, 
  nutrientsNormalizedTable, 
  nutrientsNormalizedMappingTable, 
  foodNutrientsTable, 
  foodNutrientsNormalizedTable,
  exercisesTable,
  exercisesNormalizedTable,
  exercisesNormalizedMappingTable,
  exerciseRelationsTable,
  exerciseRelationsNormalizedTable
} from '@repo/db';
import { sql, count } from 'drizzle-orm';
import { getLogger } from '../utils/logger';
import { confirm } from '@inquirer/prompts';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

export const mergeNutrients = async (verbose = false) => {
  const logger = getLogger(verbose);
  
  // PRE-MIGRATION VISUALIZATION
  logger.setStatus('Preparing migration summary...');
  
  const [mappingCountResult] = await db.select({ value: count() }).from(nutrientsNormalizedMappingTable);
  const [foodNutrientCountResult] = await db.select({ value: count() }).from(foodNutrientsTable);
  const [normalizedCountResult] = await db.select({ value: count() }).from(nutrientsNormalizedTable);
  
  const sampleMappings = await db
    .select({
      original: nutrientsNormalizedMappingTable.originalName,
      normalized: nutrientsNormalizedMappingTable.normalizedName,
    })
    .from(nutrientsNormalizedMappingTable)
    .limit(5)
    .execute();

  const summary = `
${colors.bold}${colors.cyan}┌──────────────────────────────────────────────────────────────────┐${colors.reset}
${colors.bold}${colors.cyan}│                   NUTRIENT MIGRATION PLAN                        │${colors.reset}
${colors.bold}${colors.cyan}└──────────────────────────────────────────────────────────────────┘${colors.reset}
  ${colors.bold}SUMMARY:${colors.reset}
  • ${colors.green}${mappingCountResult.value}${colors.reset} unique mappings identified
  • ${colors.green}${normalizedCountResult.value}${colors.reset} normalized nutrients to be merged into main table
  • ${colors.yellow}${foodNutrientCountResult.value}${colors.reset} food_nutrient records to be updated

  ${colors.bold}SAMPLE MAPPINGS:${colors.reset}
${sampleMappings.map(m => `  ${colors.dim}•${colors.reset} ${m.original.padEnd(25)} ${colors.cyan}→${colors.reset} ${colors.bold}${m.normalized}${colors.reset}`).join('\n')}
  ${colors.dim}... and ${Math.max(0, mappingCountResult.value - 5)} more mappings.${colors.reset}

  ${colors.bold}OPERATIONS:${colors.reset}
  1. Populate intermediate ${colors.cyan}food_nutrients_normalized${colors.reset}
  2. Sync ${colors.cyan}nutrients_normalized${colors.reset} → ${colors.cyan}nutrients${colors.reset} (Main Table)
  3. Re-point ${colors.cyan}food_nutrients${colors.reset} to new normalized IDs
`;

  await logger.interactive(async () => {
    console.log(summary);
    const shouldProceed = await confirm({
      message: 'Do you want to proceed with this migration?',
      default: false,
    });
    
    if (!shouldProceed) {
      console.log(`${colors.yellow}Migration cancelled.${colors.reset}`);
      process.exit(0);
    }
  });

  logger.info('Starting nutrient merge process...');

  // Step 1: Populate food_nutrients_normalized
  logger.setStatus('Populating food_nutrients_normalized...');
  try {
    await db.execute(sql`
      INSERT INTO "food_nutrients_normalized" ("foodId", "nutrientId", "value")
      SELECT fn."foodId", nm."normalizedNutrientId", fn."value"
      FROM "food_nutrients" fn
      JOIN "nutrients_normalized_mapping" nm ON fn."nutrientId" = nm."originalNutrientId"
      ON CONFLICT ("foodId", "nutrientId") DO NOTHING
    `);
  } catch (error: any) {
    logger.error(`Failed to populate intermediate table: ${error.message}`);
    throw error;
  }

  // Step 2: Migrate nutrients_normalized to nutrients
  logger.setStatus('Migrating metadata to main nutrients table...');
  try {
    await db.execute(sql`
      INSERT INTO "nutrients" ("name", "unit")
      SELECT "name", "unit" FROM "nutrients_normalized"
      ON CONFLICT DO NOTHING
    `);
  } catch (error: any) {
    logger.error(`Failed to migrate nutrients: ${error.message}`);
    throw error;
  }

  // Step 3: Migrate mappings to food_nutrients
  logger.setStatus('Updating final food_nutrients associations...');
  try {
    await db.execute(sql`
      INSERT INTO "food_nutrients" ("foodId", "nutrientId", "value")
      SELECT fnn."foodId", n."id", fnn."value"
      FROM "food_nutrients_normalized" fnn
      JOIN "nutrients_normalized" nn ON fnn."nutrientId" = nn."id"
      JOIN "nutrients" n ON nn."name" = n."name" AND nn."unit" = n."unit"
      ON CONFLICT ("foodId", "nutrientId") DO UPDATE SET "value" = EXCLUDED."value"
    `);
  } catch (error: any) {
    logger.error(`Failed to update food_nutrients: ${error.message}`);
    throw error;
  }
  logger.clearStatus();

  logger.info('Nutrient merge complete.');
};

export const mergeExercises = async (verbose = false) => {
  const logger = getLogger(verbose);
  
  logger.setStatus('Preparing exercise migration summary...');
  const [mappingCount] = await db.select({ value: count() }).from(exercisesNormalizedMappingTable);
  const [exerciseCount] = await db.select({ value: count() }).from(exercisesTable);

  const summary = `
${colors.bold}${colors.magenta}┌──────────────────────────────────────────────────────────────────┐${colors.reset}
${colors.bold}${colors.magenta}│                   EXERCISE MIGRATION PLAN                        │${colors.reset}
${colors.bold}${colors.magenta}└──────────────────────────────────────────────────────────────────┘${colors.reset}
  ${colors.bold}SUMMARY:${colors.reset}
  • ${colors.green}${mappingCount.value}${colors.reset} unique exercise mappings identified
  • ${colors.yellow}${exerciseCount.value}${colors.reset} total exercise records in main table

  ${colors.bold}OPERATIONS:${colors.reset}
  1. Populate intermediate ${colors.cyan}exercise_relations_normalized${colors.reset}
  2. Sync ${colors.cyan}exercises_normalized${colors.reset} → ${colors.cyan}exercises${colors.reset} (Main Table)
  3. Re-point ${colors.cyan}exercise_relations${colors.reset} to new normalized IDs
`;

  await logger.interactive(async () => {
    console.log(summary);
    const shouldProceed = await confirm({
      message: 'Do you want to proceed with this exercise migration?',
      default: false,
    });
    
    if (!shouldProceed) {
      console.log(`${colors.yellow}Migration cancelled.${colors.reset}`);
      process.exit(0);
    }
  });

  logger.info('Starting exercise merge process...');
  
  // Steps implementation (keeping existing SQL)
  logger.setStatus('Populating relations...');
  await db.execute(sql`
    INSERT INTO "exercise_relations_normalized" ("fromExerciseId", "toExerciseId", "relationType")
    SELECT nm1."normalizedExerciseId", nm2."normalizedExerciseId", er."relationType"
    FROM "exercise_relations" er
    JOIN "exercises_normalized_mapping" nm1 ON er."fromExerciseId" = nm1."originalExerciseId"
    JOIN "exercises_normalized_mapping" nm2 ON er."toExerciseId" = nm2."originalExerciseId"
    ON CONFLICT DO NOTHING
  `);

  logger.setStatus('Migrating exercises...');
  await db.execute(sql`
    INSERT INTO "exercises" ("name", "description")
    SELECT "name", "description" FROM "exercises_normalized"
    ON CONFLICT DO NOTHING
  `);

  logger.setStatus('Updating final relations...');
  await db.execute(sql`
    INSERT INTO "exercise_relations" ("fromExerciseId", "toExerciseId", "relationType")
    SELECT e1."id", e2."id", ern."relationType"
    FROM "exercise_relations_normalized" ern
    JOIN "exercises_normalized" en1 ON ern."fromExerciseId" = en1."id"
    JOIN "exercises_normalized" en2 ON ern."toExerciseId" = en2."id"
    JOIN "exercises" e1 ON en1."name" = e1."name"
    JOIN "exercises" e2 ON en2."name" = e2."name"
    ON CONFLICT DO NOTHING
  `);

  logger.clearStatus();
  logger.info('Exercise merge complete.');
};
