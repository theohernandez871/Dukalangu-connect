// Structured logging with levels, timestamps, and a router/context tag.
// Production-ready: JSON-friendly, file rotation (file.js), and an optional
// remote sink that ships logs to the server (router_logs) for dashboard view.

import { appendLog } from './file.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RemoteLogEntry {
  level: LogLevel;
  scope: string;
  message: string;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let minLevel: LogLevel = 'info';

// Optional remote sink (set by the orchestrator once the server client exists).
let remoteSink: ((entry: RemoteLogEntry) => void) | null = null;

export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

export function setRemoteSink(sink: (entry: RemoteLogEntry) => void): void {
  remoteSink = sink;
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

  // Ship info+ to the server (skip debug noise) if a sink is configured.
  if (remoteSink && LEVEL_ORDER[level] >= LEVEL_ORDER.info) {
    const msg = meta !== undefined ? `${message} ${safeJson(meta)}` : message;
    try {
      remoteSink({ level, scope, message: msg });
    } catch {
      // never let logging break the app
    }
  }
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
