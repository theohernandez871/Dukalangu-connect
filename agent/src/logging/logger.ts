// Structured logging with levels, timestamps, and a router/context tag.
// Production-ready: JSON-friendly, ready for file rotation (see logging/file.ts).

import { appendLog } from './file.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let minLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

function emit(level: LogLevel, scope: string, message: string, meta?: unknown): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
  const time = new Date().toISOString();
  const line = `${time} [${level.toUpperCase()}] (${scope}) ${message}`;
  const full = meta !== undefined ? `${line} ${safeJson(meta)}` : line;

  if (level === 'error') console.error(full);
  else if (level === 'warn') console.warn(full);
  else console.log(full);

  void appendLog(full);
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Create a logger bound to a scope (e.g. a module or router name). */
export function createLogger(scope: string) {
  return {
    debug: (m: string, meta?: unknown) => emit('debug', scope, m, meta),
    info: (m: string, meta?: unknown) => emit('info', scope, m, meta),
    warn: (m: string, meta?: unknown) => emit('warn', scope, m, meta),
    error: (m: string, meta?: unknown) => emit('error', scope, m, meta),
  };
}

export type Logger = ReturnType<typeof createLogger>;
