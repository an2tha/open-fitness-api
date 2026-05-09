import { confirm, select, input } from '@inquirer/prompts';
import { $ } from 'bun';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';

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
  static currentStep = 0;
  static steps = [
    { id: 'env', label: 'Env' },
    { id: 'infra', label: 'Infra' },
    { id: 'db', label: 'DB' },
    { id: 'data', label: 'Data' },
    { id: 'ai', label: 'AI' },
    { id: 'done', label: 'Done' },
  ];

  static step(name: string) {
    const n = name.toLowerCase();
    if (n.includes('environment')) this.currentStep = 0;
    else if (n.includes('infrastructure')) this.currentStep = 1;
    else if (n.includes('database')) this.currentStep = 2;
    else if (n.includes('data')) this.currentStep = 3;
    else if (n.includes('normalization')) this.currentStep = 4;
    else if (n.includes('completion')) this.currentStep = 5;

    const roadmap = this.steps
      .map((s, i) => {
        if (i < this.currentStep) return `${colors.green}${s.label}${colors.reset}`;
        if (i === this.currentStep) return `${colors.magenta}${colors.bold}${s.label}${colors.reset}`;
        return `${colors.gray}${s.label}${colors.reset}`;
      })
      .join(`${colors.gray} → ${colors.reset}`);

    const title = `${colors.bold}${colors.magenta}● ${name}${colors.reset}`;
    const padding = Math.max(2, 40 - name.length);
    console.log(`\n${title}${' '.repeat(padding)}${colors.gray}(${roadmap})${colors.reset}`);
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
}

class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private timer: any = null;
  private message = '';
  private lastLines: string[] = [];

  start(message: string) {
    this.message = message;
    this.timer = setInterval(() => {
      this.render();
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  private render() {
    // Clear previous lines (lastLines + 1 for spinner)
    const numLines = this.lastLines.length;
    if (numLines > 0) {
      process.stdout.write(`\x1b[${numLines}A`);
    }

    // Render log lines
    for (const line of this.lastLines) {
      const termWidth = process.stdout.columns || 80;
      const truncated = line.slice(0, termWidth - 10);
      process.stdout.write(`\r  ${colors.gray}│ ${truncated}${colors.reset}\x1b[K\n`);
    }

    // Render spinner
    process.stdout.write(`\r  ${colors.cyan}${this.frames[this.currentFrame]}${colors.reset} ${this.message}\x1b[K`);
  }

  update(subtext: string) {
    const cleanSubtext = subtext.replace(/\r?\n|\r/g, ' ').trim();
    if (cleanSubtext) {
      this.lastLines.push(cleanSubtext);
      if (this.lastLines.length > 5) this.lastLines.shift();
    }
  }

  stop(success = true, finalMsg?: string) {
    if (this.timer) clearInterval(this.timer);
    this.render(); // One last render to make sure we're sync
    process.stdout.write('\n'); // Move past the spinner
    process.stdout.write(
      `\r  ${success ? colors.green + '✔' : colors.red + '✘'}${colors.reset} ${finalMsg || this.message}\x1b[K\n`,
    );
  }
}

async function runShellWithSpinner(cmd: string, message: string) {
  const spinner = new Spinner();
  spinner.start(message);
  try {
    const shell = $`${{ raw: cmd }}`.quiet();
    for await (const line of shell.lines()) {
      if (line.trim()) {
        // Strip ANSI escape codes from the subtext to prevent UI glitches
        const cleanLine = line.replace(/\u001b\[[0-9;]*m/g, '').trim();
        if (cleanLine) spinner.update(cleanLine);
      }
    }
    await shell;
    spinner.stop(true);
  } catch (err) {
    spinner.stop(false);
    throw err;
  }
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

async function run() {
  console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║         OPEN FITNESS DATA SETUP            ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

  // Port checks
  const requiredPorts = [3000, 3001, 5432];
  const inUse = [];
  for (const port of requiredPorts) {
    if (!(await isPortAvailable(port))) {
      inUse.push(port);
    }
  }

  if (inUse.length > 0) {
    const proceed = await confirm({
      message: `Ports ${inUse.join(', ')} are already in use. If the containers are already running, you can continue. Proceed?`,
      default: true,
    });
    if (!proceed) process.exit(0);
  }

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

  // Ensure MASTER_KEY is present in .env
  {
    const envContents = readFileSync('.env', 'utf-8');
    const hasMasterKey = /^MASTER_KEY=.+$/m.test(envContents);
    if (!hasMasterKey) {
      const masterKey = randomBytes(48).toString('base64url'); // 64-char, 384-bit entropy
      const separator = envContents.endsWith('\n') ? '' : '\n';
      writeFileSync(
        '.env',
        `${envContents}${separator}\n# Auto-generated master key for API key management\nMASTER_KEY=${masterKey}\n`,
      );
      UI.success(`MASTER_KEY generated and written to .env`);
      console.log(
        `\n  ${colors.bold}${colors.yellow}⚠  Save this master key — it controls API key creation:${colors.reset}`,
      );
      console.log(`  ${colors.cyan}${masterKey}${colors.reset}\n`);
    } else {
      UI.info('MASTER_KEY already present in .env');
    }
  }

  UI.step('Infrastructure');
  try {
    await runShellWithSpinner('bun run build', 'Building workspace and Next.js artifacts');
    await runShellWithSpinner('docker compose up -d --build', 'Building and starting Docker containers');
  } catch (_e1) {
    try {
      await runShellWithSpinner('bun run build', 'Building workspace and Next.js artifacts');
      await runShellWithSpinner('docker-compose up -d --build', 'Building and starting Docker containers (fallback)');
    } catch (e2) {
      UI.error('Docker failure. Details:');
      console.error(e2);
      UI.info('Ensure Docker Desktop is active or PostgreSQL is manually configured.');
      process.exit(1);
    }
  }

  UI.step('Data Acquisition');
  const loadNow = await confirm({
    message: 'Would you like to load fitness data now? (This can take a few minutes)',
    default: true,
  });

  if (loadNow) {
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

    try {
      // Point local loaders to the exposed Docker port (localhost:5432)
      await runShellWithSpinner(`bun run load ${source}`, `Loading ${source} data`);
      UI.success('Data loading finished');
    } catch (err) {
      UI.error('Local data loading failed. You can try running it via Docker instead:');
      console.log(
        `  ${colors.gray}docker compose run --rm -e DATABASE_URL=postgres://user:password@db:5432/fitnessdata api bun run load ${source}${colors.reset}`,
      );
    }
  } else {
    UI.info('Skipping data load. You can run it later with:');
    console.log(`  ${colors.cyan}bun run load all${colors.reset}\n`);
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

    await runShellWithSpinner(`bun run normalize all`);
  }

  UI.step('Completion');
  console.log(`\n  ${colors.bold}App Endpoint:${colors.reset}  ${colors.cyan}http://localhost:3000${colors.reset}`);
  console.log(`  ${colors.bold}API Docs:${colors.reset}      ${colors.cyan}http://localhost:3000/docs${colors.reset}`);
  console.log(`\n  Run ${colors.green}bun run dev${colors.reset} to start the development environment.\n`);
}

run().catch((err) => {
  UI.error(`Setup failed: ${err.message}`);
  process.exit(1);
});
