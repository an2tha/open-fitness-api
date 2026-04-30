import { Context, Next } from 'hono';
import { env } from '../lib/env';

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  requestId: string;
  ip: string;
  userAgent?: string;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatLog(entry: LogEntry): string {
  const statusColor =
    entry.status >= 500 ? '\x1b[31m' : entry.status >= 400 ? '\x1b[33m' : entry.status >= 300 ? '\x1b[36m' : '\x1b[32m';
  const reset = '\x1b[0m';

  return `${entry.timestamp} ${entry.method} ${entry.path} ${statusColor}${entry.status}${reset} ${formatDuration(entry.duration)} ${entry.requestId}`;
}

export async function logger(c: Context, next: Next) {
  const start = Date.now();
  const requestId = c.get('requestId') || 'unknown';

  await next();

  const duration = Date.now() - start;
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
    requestId,
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    userAgent: c.req.header('user-agent'),
  };

  logs.push(logEntry);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  if (env.NODE_ENV !== 'test') {
    console.log(formatLog(logEntry));
  }
}

export function getLogs(): LogEntry[] {
  return [...logs];
}
