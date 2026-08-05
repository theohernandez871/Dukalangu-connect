// Append log lines to a daily file with simple size-based rotation.
// Failures here must never crash the agent, so all writes are best-effort.

import { appendFile, mkdir, stat, rename } from 'node:fs/promises';
import { join } from 'node:path';

const LOG_DIR = process.env.LOG_DIR ?? join(process.cwd(), 'logs');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file before rotation.

let ready = false;

async function ensureDir(): Promise<void> {
  if (ready) return;
  try {
    await mkdir(LOG_DIR, { recursive: true });
    ready = true;
  } catch {
    // If we cannot create the dir, logging to file is silently skipped.
  }
}

function currentFile(): string {
  const day = new Date().toISOString().slice(0, 10);
  return join(LOG_DIR, `agent-${day}.log`);
}

async function rotateIfNeeded(file: string): Promise<void> {
  try {
    const info = await stat(file);
    if (info.size >= MAX_BYTES) {
      await rename(file, `${file}.${Date.now()}`);
    }
  } catch {
    // File may not exist yet — nothing to rotate.
  }
}

export async function appendLog(line: string): Promise<void> {
  await ensureDir();
  if (!ready) return;
  const file = currentFile();
  await rotateIfNeeded(file);
  try {
    await appendFile(file, line + '\n', 'utf8');
  } catch {
    // Best-effort; never throw from logging.
  }
}
