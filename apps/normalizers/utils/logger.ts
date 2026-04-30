type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type ProgressTrack = {
  current: number;
  total: number;
  label: string;
};

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
};

const levelColors: Record<LogLevel, string> = {
  debug: colors.gray,
  info: colors.cyan,
  warn: colors.yellow,
  error: colors.red,
};

const supportsColor = () => process.stdout.isTTY || Boolean(process.env.FORCE_COLOR);

const color = (value: string, ansi: string) => {
  if (!supportsColor()) return value;
  return `${ansi}${value}${colors.reset}`;
};

const stringify = (value: unknown) => {
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

class BufferedLogger {
  private logs: string[] = [];
  private tracks = new Map<string, ProgressTrack>();
  private status: string = '';
  private active = false;
  private flushed = false;

  constructor(private verbose = false) {}

  setVerbose(verbose: boolean) {
    this.verbose = this.verbose || verbose;
  }

  debug(...messages: unknown[]) {
    if (this.verbose) this.log('debug', messages);
  }

  info(...messages: unknown[]) {
    if (this.verbose) this.log('info', messages);
  }

  warn(...messages: unknown[]) {
    this.log('warn', messages);
  }

  error(...messages: unknown[]) {
    this.log('error', messages);
  }

  /**
   * Set a status message that shows the current step in the process.
   * This is displayed like a progress indicator but shows the current operation.
   */
  setStatus(status: string) {
    this.status = status;
    this.render();
  }

  /**
   * Clear the status message
   */
  clearStatus() {
    this.status = '';
    this.render();
  }

  setProgress(id: string, current: number, total: number, label?: string) {
    const existing = this.tracks.get(id);
    this.tracks.set(id, {
      current,
      total,
      label: label ?? existing?.label ?? id,
    });
    this.render();
  }

  /**
   * Temporary disable the alternative screen buffer to allow for interactive prompts.
   */
  async interactive<T>(fn: () => Promise<T>): Promise<T> {
    const wasActive = this.active;
    if (wasActive) {
      // Exit alt screen and show cursor immediately
      process.stdout.write('\x1b[?25h\x1b[?1049l');
      this.active = false;
    }

    try {
      const result = await fn();
      return result;
    } finally {
      if (wasActive) {
        // We don't re-enter alt screen immediately to avoid flickering 
        // if another interactive prompt follows. 
        // The next render() call will re-activate it.
      }
    }
  }

  flush() {
    if (this.flushed) return;
    this.flushed = true;

    if (process.stdout.isTTY && this.active) {
      process.stdout.write('\x1b[?25h\x1b[?1049l');
      this.active = false;
    }

    if (this.logs.length) process.stdout.write(`${this.logs.join('\n')}\n`);
  }

  private log(level: LogLevel, messages: unknown[]) {
    const timestamp = color(new Date().toISOString(), colors.dim);
    const levelText = color(level.toUpperCase().padEnd(5), `${colors.bold}${levelColors[level]}`);
    const message = messages.map(stringify).join(' ');
    const line = `${timestamp} ${levelText} ${message}`;
    this.logs.push(line);
    this.render();
  }

  private render() {
    if (!process.stdout.isTTY || this.flushed) return;

    if (!this.active) {
      process.stdout.write('\x1b[?1049h\x1b[?25l');
      this.active = true;
    }

    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;

    // Build the header section
    let headerLines: string[] = [];

    // Add status line if present
    if (this.status) {
      const statusLabel = color('STATUS', `${colors.bold}${colors.blue}`);
      const statusText = color(this.status, colors.cyan);
      headerLines.push(`${statusLabel} ${statusText}`);
    }

    // Add progress tracks
    const progressLines = Array.from(this.tracks.values())
      .map(t => this.renderTrack(t, columns));
    headerLines = headerLines.concat(progressLines);

    const headerSection = headerLines.join('\n');

    const lines = this.logs.flatMap(line => line.split('\n'));
    const headerRows = headerLines.length;
    const visibleLogs = lines.slice(Math.max(0, lines.length - rows + headerRows + 1));
    const body = visibleLogs.map(line => line.slice(0, columns)).join('\n');

    process.stdout.write(`\x1b[H\x1b[2J${headerSection}\n${body}`);
  }

  private renderTrack(track: ProgressTrack, columns: number) {
    const total = Math.max(track.total, 0);
    const current = Math.min(Math.max(track.current, 0), total || track.current);
    const ratio = total ? current / total : 0;
    const percent = total ? Math.floor(ratio * 100) : 0;
    const suffix = total ? ` ${percent}% ${current}/${total}` : ` ${current}`;
    const label = `${track.label.padEnd(20)} `;
    const width = Math.max(10, columns - label.length - suffix.length - 2);
    const filled = Math.round(width * ratio);
    const bar = `${color('█'.repeat(filled), colors.green)}${color('░'.repeat(width - filled), colors.gray)}`;
    const header = color(label, `${colors.bold}${colors.magenta}`);
    const meta = color(suffix, colors.cyan);

    return `${header}[${bar}]${meta}`;
  }
}

let logger: BufferedLogger;

export const getLogger = (verbose = false) => {
  if (!logger) logger = new BufferedLogger(verbose);
  else logger.setVerbose(verbose);
  return logger;
};

export const flushLogger = () => logger?.flush();

process.once('beforeExit', flushLogger);
process.once('SIGINT', () => {
  flushLogger();
  process.exit(130);
});