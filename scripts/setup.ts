import { confirm, select, input } from '@inquirer/prompts';
import { $ } from 'bun';
import { existsSync } from 'node:fs';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

class UI {
  static step(name: string) {
    console.log(`\n${colors.bold}${colors.magenta}● ${name}${colors.reset}`);
  }

  static success(message: string) {
    console.log(`${colors.green}  ✔ ${message}${colors.reset}`);
  }

  static error(message: string) {
    console.log(`${colors.red}  ✘ ${message}${colors.reset}`);
  }

  static info(message: string) {
    console.log(`${colors.dim}  ℹ ${message}${colors.reset}`);
  }

  static progress(label: string, current: number, total: number) {
    const width = 30;
    const ratio = total ? current / total : 0;
    const filled = Math.round(width * ratio);
    const percent = total ? Math.floor(ratio * 100) : 0;
    const bar = `${colors.green}${'█'.repeat(filled)}${colors.reset}${colors.gray}${'░'.repeat(width - filled)}${colors.reset}`;
    process.stdout.write(
      `\r  ${colors.bold}${label.padEnd(20)}${colors.reset} [${bar}] ${colors.cyan}${percent}%${colors.reset}`,
    );
    if (current >= total && total > 0) process.stdout.write('\n');
  }
}

async function run() {
  console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║         OPEN FITNESS DATA SETUP            ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

  UI.step('Environment Configuration');
  if (!existsSync('.env')) {
    if (existsSync('.env.example')) {
      UI.info('Creating .env from example...');
      await $`cp .env.example .env`;
      UI.success('.env created');
    } else {
      UI.error('.env.example missing');
      process.exit(1);
    }
  } else {
    UI.info('.env already exists');
  }

  UI.step('Infrastructure');
  UI.info('Starting Docker containers...');
  try {
    await $`docker compose up -d --build`.quiet();
    UI.success('Containers are online');
  } catch (_e1) {
    try {
      await $`docker-compose up -d --build`.quiet();
      UI.success('Containers are online');
    } catch (e2) {
      UI.error('Docker failure. Details:');
      console.error(e2);
      UI.info('Ensure Docker Desktop is active or PostgreSQL is manually configured.');
      process.exit(1);
    }
  }

  UI.step('Database Synchronization');
  const runMigrate = await confirm({
    message: 'Sync database schema?',
    default: true,
  });

  if (runMigrate) {
    UI.info('Pushing schema via Docker...');
    try {
      await $`docker compose run --rm -e DATABASE_URL=postgres://user:password@db:5432/fitnessdata api bun run --filter api db:push`;
      UI.success('Schema synchronized');
    } catch (err) {
      UI.error('Schema sync failed. See details above.');
      throw err;
    }
  }

  UI.step('Data Acquisition');
  const loadData = await confirm({
    message: 'Load fitness data from external sources?',
    default: false,
  });

  if (loadData) {
    const source = await select({
      message: 'Select data source:',
      choices: [
        { name: 'All Sources (Recommended)', value: 'all' },
        { name: 'USDA (Foods)', value: 'foods usda' },
        { name: 'Swiss (Foods)', value: 'foods swiss' },
        { name: 'Yuhonas (Exercises)', value: 'exercises yuhonas' },
        { name: 'DSLD (Supplements)', value: 'supplements dsld' },
      ],
    });

    UI.info(`Executing ${source} loader via Docker...`);
    await $`docker compose run --rm -e DATABASE_URL=postgres://user:password@db:5432/fitnessdata api bun run apps/loaders/index.ts ${source.split(' ')}`;
    UI.success('Data loading finished');
  }

  UI.step('AI Normalization');
  const normalizeData = await confirm({
    message: 'Run AI normalization?',
    default: false,
  });

  if (normalizeData) {
    const aiApiKey = await $`echo $AI_API_KEY`.text();
    const apiKey =
      aiApiKey.trim() ||
      ((await confirm({ message: 'AI_API_KEY not found in host env. Enter it now?', default: true }))
        ? await input({ message: 'Enter AI_API_KEY:' })
        : '');

    const aiBaseUrl = await $`echo $AI_BASE_URL`.text();
    const baseUrl = aiBaseUrl.trim() || 'https://api.openai.com/v1';

    const type = await select({
      message: 'Select target:',
      choices: [
        { name: 'Nutrient Normalization', value: 'nutrients' },
        { name: 'Merge Nutrients', value: 'merge nutrients' },
        { name: 'Merge Exercises', value: 'merge exercises' },
      ],
    });

    UI.info(`Starting ${type} normalization via Docker...`);
    await $`docker compose run --rm \
      -e DATABASE_URL=postgres://user:password@db:5432/fitnessdata \
      -e AI_API_KEY=${apiKey} \
      -e AI_BASE_URL=${baseUrl} \
      -e AI_NORMALIZE=true \
      api bun run apps/normalizers/index.ts ${type.split(' ')}`;
    UI.success('Normalization complete');
  }

  UI.step('Completion');
  console.log(`\n  ${colors.bold}API Endpoint:${colors.reset}  ${colors.cyan}http://localhost:3000${colors.reset}`);
  console.log(
    `  ${colors.bold}Documentation:${colors.reset} ${colors.cyan}http://localhost:3000/api/v1/docs${colors.reset}`,
  );
  console.log(`\n  Run ${colors.green}bun run dev --filter api${colors.reset} to start the development server.\n`);
}

run().catch((err) => {
  UI.error(`Setup failed: ${err.message}`);
  process.exit(1);
});
