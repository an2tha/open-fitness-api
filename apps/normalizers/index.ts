import { binary, command, flag, run, subcommands } from 'cmd-ts';
import { getLogger, flushLogger } from './utils/logger';
import { normalizeNutrients } from './modules/nutrients';
import { normalizeWada } from './modules/wada';
import { mergeNutrients, mergeExercises } from './modules/merge';
import { config } from 'dotenv';
import path from 'node:path';

config({ 
  path: path.resolve(import.meta.dirname, '../../.env'),
  // @ts-ignore
  quiet: true 
});

if (!process.env.AI_NORMALIZE) {
  throw Error('Please enable AI_NORMALIZE in .env to continue!');
}

const verboseFlag = flag({
  long: 'verbose',
  short: 'v',
  description: 'Output detailed log information including debug-level messages.',
  onMissing: () => process.env.NODE_ENV === 'development',
});

const nutrientsCmd = command({
  name: 'nutrients',
  description: 'Normalize food and nutrient data using AI.',
  args: { verbose: verboseFlag },
  handler: async ({ verbose }) => {
    const logger = getLogger(verbose);
    logger.info('Starting nutrient normalization...');

    try {
      await normalizeNutrients(verbose);
    } catch (error: any) {
      logger.error(`Nutrient normalization failed: ${error.message}`);
      process.exitCode = 1;
    }
  },
});

const wadaCmd = command({
  name: 'wada',
  description: 'Parse and normalize WADA prohibited list using AI.',
  args: { verbose: verboseFlag },
  handler: async ({ verbose }) => {
    try {
      await normalizeWada(verbose);
    } catch (error: any) {
      getLogger(verbose).error(`WADA normalization failed: ${error.message}`);
      process.exitCode = 1;
    }
  },
});

const exercisesCmd = command({
  name: 'exercises',
  description: 'Normalize exercise and movement data using AI.',
  args: { verbose: verboseFlag },
  handler: async ({ verbose }) => {
    const logger = getLogger(verbose);
    logger.info('Starting exercise normalization...');
    logger.info('Exercise normalization complete.');
  },
});

const mergeNutrientsCmd = command({
  name: 'nutrients',
  description: 'Merge normalized nutrient data back into the main tables.',
  args: { verbose: verboseFlag },
  handler: async ({ verbose }) => {
    try {
      await mergeNutrients(verbose);
    } catch (error: any) {
      getLogger(verbose).error(`Nutrient merge failed: ${error.message}`);
      process.exitCode = 1;
    }
  },
});

const mergeExercisesCmd = command({
  name: 'exercises',
  description: 'Merge normalized exercise data back into the main tables.',
  args: { verbose: verboseFlag },
  handler: async ({ verbose }) => {
    try {
      await mergeExercises(verbose);
    } catch (error: any) {
      getLogger(verbose).error(`Exercise merge failed: ${error.message}`);
      process.exitCode = 1;
    }
  },
});

const mergeCmd = subcommands({
  name: 'merge',
  description: 'Merge normalized data back into the main tables.',
  cmds: { nutrients: mergeNutrientsCmd, exercises: mergeExercisesCmd },
});

const app = subcommands({
  name: 'normalizers',
  description: 'Open Fitness Data Normalizers',
  cmds: { nutrients: nutrientsCmd, exercises: exercisesCmd, merge: mergeCmd, wada: wadaCmd },
});

run(binary(app), process.argv)
  .catch((error) => {
    getLogger().error(`Unexpected fatal error: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(flushLogger);
