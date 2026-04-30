import { binary, command, flag, oneOf, positional, run, subcommands } from 'cmd-ts';
import inquirer from 'inquirer';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { loadBlsFoods } from './modules/bls';
import { loadCiqual } from './modules/ciqual';
import { loadCnfFoods } from './modules/cnf';
import { loadCofid } from './modules/cofid';
import { loadYuhonasExercises, loadWrkoutExercises } from './modules/exercises';
import { loadNevoFoods } from './modules/nevo';
import { loadDsldSupplements } from './modules/supplements';
import { loadUsdaFoods } from './modules/usda';
import { loadSwissFoods } from './modules/swiss';
import { flushLogger, getLogger } from './utils/logger';
import { foodsTable, supplementsTable } from '@repo/db/src/schema';

const purgeFlag = flag({
  long: 'purge',
  description: 'Clear database tables before loading. If a specific source is provided, only that source is purged.',
});

const verboseFlag = flag({
  long: 'verbose',
  short: 'v',
  description: 'Output detailed log information.',
  onMissing: () => process.env.NODE_ENV === 'development',
});

const confirmPurge = async (message: string) => {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `${message}. Are you sure?`,
      default: false,
    },
  ]);
  return confirm;
};

const safeRun = async (id: string, fn: () => Promise<any>) => {
  const logger = getLogger();
  try {
    await fn();
  } catch (error: any) {
    logger.error(`[${id}] Task failed: ${error.message}`);
    process.exit(1);
  }
};

const getDb = () => drizzle(new Bun.SQL(process.env.DATABASE_URL!));

// --- Purge Logic ---

const purgeSource = async (category: 'foods' | 'supplements' | 'exercises', source: string) => {
  const db = getDb();
  const logger = getLogger();
  logger.info(`purging specific source: ${source} from ${category}`);

  if (category === 'foods') {
    await db.delete(foodsTable).where(eq(foodsTable.dataSource, source));
  } else if (category === 'supplements') {
    if (source === 'dsld') {
      await db.delete(supplementsTable).where(eq(supplementsTable.dataSource, 'dsld'));
    }
  } else if (category === 'exercises') {
    // Exercises currently don't have a datasource column on the main table,
    // we'll truncate for now as they are small.
    const sql = new Bun.SQL(process.env.DATABASE_URL!);
    await sql`truncate table exercises, muscles, equipment, exercise_muscles, exercise_equipment, movement_patterns, exercise_movement_patterns restart identity cascade`;
  }
};

const purgeCategory = async (category: 'foods' | 'supplements' | 'exercises' | 'all') => {
  const sql = new Bun.SQL(process.env.DATABASE_URL!);
  const logger = getLogger();
  logger.info(`purging entire category: ${category}`);

  if (category === 'foods' || category === 'all') {
    await sql`truncate table foods, nutrients, food_nutrients restart identity cascade`;
  }
  if (category === 'exercises' || category === 'all') {
    await sql`truncate table exercises, muscles, equipment, exercise_muscles, exercise_equipment, movement_patterns, exercise_movement_patterns restart identity cascade`;
  }
  if (category === 'supplements' || category === 'all') {
    await sql`truncate table supplements, ingredients, supplement_ingredients, prohibited_substances restart identity cascade`;
  }
  await sql.close();
};

// --- Commands ---

const allCmd = command({
  name: 'all',
  description: 'Run every data loader.',
  args: { purge: purgeFlag, verbose: verboseFlag },
  handler: async ({ purge, verbose: _verbose }) => {
    if (purge && (await confirmPurge('Purge ENTIRE database'))) await purgeCategory('all');
    await Promise.all([
      safeRun('cnf', loadCnfFoods),
      safeRun('bls', loadBlsFoods),
      safeRun('nevo', loadNevoFoods),
      safeRun('usda', loadUsdaFoods),
      safeRun('cofid', loadCofid),
      safeRun('ciqual', loadCiqual),
      safeRun('yuhonas', loadYuhonasExercises),
      safeRun('wrkout', loadWrkoutExercises),
      safeRun('dsld', loadDsldSupplements),
      safeRun('swiss', loadSwissFoods),
    ]).catch(() => {
      process.exitCode = 1;
    });
  },
});

const foodsCmd = command({
  name: 'foods',
  args: {
    source: positional({
      type: oneOf(['all', 'usda', 'cnf', 'bls', 'nevo', 'cofid', 'ciqual', 'swiss']),
      displayName: 'source',
    }),
    purge: purgeFlag,
    verbose: verboseFlag,
  },
  handler: async ({ source, purge, verbose: _verbose }) => {
    if (purge) {
      if (source === 'all') {
        if (await confirmPurge('Purge all food data')) await purgeCategory('foods');
      } else {
        if (await confirmPurge(`Purge food source: ${source}`)) await purgeSource('foods', source);
      }
    }
    const tasks: Record<string, () => Promise<any>> = {
      usda: () => safeRun('usda', loadUsdaFoods),
      cnf: () => safeRun('cnf', loadCnfFoods),
      bls: () => safeRun('bls', loadBlsFoods),
      nevo: () => safeRun('nevo', loadNevoFoods),
      cofid: () => safeRun('cofid', loadCofid),
      ciqual: () => safeRun('ciqual', loadCiqual),
      swiss: () => safeRun('swiss', loadSwissFoods),
    };
    if (source === 'all') {
      await Promise.all(Object.values(tasks).map((t) => t())).catch(() => {
        process.exitCode = 1;
      });
    } else {
      await tasks[source]?.();
    }
  },
});

const exercisesCmd = command({
  name: 'exercises',
  args: {
    source: positional({ type: oneOf(['all', 'yuhonas', 'wrkout']), displayName: 'source' }),
    purge: purgeFlag,
    verbose: verboseFlag,
  },
  handler: async ({ source, purge, verbose: _verbose }) => {
    if (purge) {
      if (source === 'all') {
        if (await confirmPurge('Purge all exercise data')) await purgeCategory('exercises');
      } else {
        if (await confirmPurge(`Purge exercise source: ${source}`)) await purgeSource('exercises', source);
      }
    }
    const tasks: Record<string, () => Promise<any>> = {
      yuhonas: () => safeRun('yuhonas', loadYuhonasExercises),
      wrkout: () => safeRun('wrkout', loadWrkoutExercises),
    };
    if (source === 'all') {
      await Promise.all(Object.values(tasks).map((t) => t())).catch(() => {
        process.exitCode = 1;
      });
    } else {
      await tasks[source]?.();
    }
  },
});

const supplementsCmd = command({
  name: 'supplements',
  args: {
    source: positional({ type: oneOf(['all', 'dsld']), displayName: 'source' }),
    purge: purgeFlag,
    verbose: verboseFlag,
  },
  handler: async ({ source, purge, verbose: _verbose }) => {
    if (purge) {
      if (source === 'all') {
        if (await confirmPurge('Purge all supplement data')) await purgeCategory('supplements');
      } else {
        if (await confirmPurge(`Purge supplement source: ${source}`)) await purgeSource('supplements', source);
      }
    }
    const tasks: Record<string, () => Promise<any>> = {
      dsld: () => safeRun('dsld', loadDsldSupplements),
    };
    if (source === 'all') {
      await Promise.all(Object.values(tasks).map((t) => t())).catch(() => {
        process.exitCode = 1;
      });
    } else {
      await tasks[source]?.();
    }
  },
});

const app = subcommands({
  name: 'ofdata-normalizer',
  cmds: { all: allCmd, foods: foodsCmd, exercises: exercisesCmd, supplements: supplementsCmd },
});

run(binary(app), process.argv)
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(flushLogger);
