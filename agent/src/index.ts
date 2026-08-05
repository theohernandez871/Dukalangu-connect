// Entry point. IMPORTANT: dotenv must load .env before any other module reads
// process.env. We resolve .env relative to this file's location so the agent
// works regardless of the current working directory.
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/index.js -> project root is one level up from dist/.
loadEnv({ path: resolve(__dirname, '..', '.env') });
// Also try the current working directory as a fallback.
loadEnv();

import { loadConfig } from './security/config.js';
import { Orchestrator } from './agent-core/Orchestrator.js';
import { startUpdater } from './updater/updater.js';
import { createLogger, setLogLevel } from './logging/logger.js';

const log = createLogger('main');
const VERSION = '1.0.0';

async function main(): Promise<void> {
  const cfg = await loadConfig();
  setLogLevel(cfg.logLevel);
  log.info('Hotspot Billing — Enterprise Agent', {
    version: VERSION,
    heartbeat: cfg.heartbeat,
    poll: cfg.pollInterval,
  });

  const orchestrator = new Orchestrator(cfg);

  // Optional auto-updater: enabled when UPDATE_MANIFEST_URL is configured.
  let stopUpdater: (() => void) | null = null;
  const manifestUrl = process.env.UPDATE_MANIFEST_URL;
  if (manifestUrl) {
    stopUpdater = startUpdater({
      currentVersion: VERSION,
      manifestUrl,
      intervalMs: Number(process.env.UPDATE_INTERVAL ?? 3600000),
      onUpdateReady: () => {
        log.info('Update tayari — nazima ili service manager iweke toleo jipya');
        void orchestrator.stop().then(() => process.exit(1));
      },
    });
  }

  const shutdown = async (signal: string) => {
    log.info(`Nasitisha (${signal})`);
    stopUpdater?.();
    await orchestrator.stop();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await orchestrator.start();

  if (orchestrator.wantsRestart()) {
    log.info('Natoka kwa restart (service manager itaanzisha upya)');
    process.exit(1);
  }
}

main().catch((e) => {
  log.error('Hitilafu kubwa', String(e));
  process.exit(1);
});
