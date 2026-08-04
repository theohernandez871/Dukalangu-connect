import { config } from './config.js';
import { log } from './logger.js';
import { poll } from './api/poll.js';
import { report } from './api/report.js';
import { executeBatch } from './executor.js';

let running = true;

async function tick(): Promise<void> {
  const data = await poll();

  if (!data.router) {
    // Agent not linked to a router yet; nothing to do but heartbeat is
    // already recorded server-side on poll.
    return;
  }

  // Always report status; run commands if any are pending.
  const { results, status } = await executeBatch(data.router, data.commands ?? []);

  await report({
    results: results.length ? results : undefined,
    status,
  });

  if (results.length) {
    log.info(`Executed ${results.length} command(s)`);
  }
}

async function mainLoop(): Promise<void> {
  log.info('Hotspot Billing Agent imeanza');
  log.info(`Server: ${config.supabaseUrl}`);
  log.info(`Poll kila ${config.pollIntervalMs}ms`);

  while (running) {
    try {
      await tick();
    } catch (e) {
      log.error('tick error', String(e));
    }
    await new Promise((r) => setTimeout(r, config.pollIntervalMs));
  }
}

function shutdown(signal: string): void {
  log.info(`Imepokea ${signal}, inasimama...`);
  running = false;
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

mainLoop().catch((e) => {
  log.error('fatal', String(e));
  process.exit(1);
});
