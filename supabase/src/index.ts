// Entry point. IMPORTANT: dotenv must load .env before any other module reads
// process.env. We resolve .env relative to this file's location so the agent
// works regardless of the current working directory.
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/index.js -> project root is one level up from dist/.
loadEnv({ path: resolve(__dirname, '..', '.env') });
// Also try the current working directory as a fallback.
loadEnv();

import { loadConfig } from './security/config.js';
import { Orchestrator } from './agent-core/Orchestrator.js';
import { startUpdater } from './updater/updater.js';
import { createLogger, setLogLevel } from './logging/logger.js';
import { applyRouterOsCompatPatch } from './router-api/ros-compat.js';
import { ensureConfigured } from './setup/launcher.js';
import { isConfigured as isConfiguredCheck } from './security/wizardConfig.js';

// Patch node-routeros for RouterOS 7.20+ (!empty reply) before any connection.
applyRouterOsCompatPatch();

const log = createLogger('main');
const VERSION = '1.0.0';

async function main(): Promise<void> {
  // Detect non-interactive (Windows Service) mode: no TTY attached.
  const isService = !process.stdout.isTTY && !process.argv.includes('--setup');

  // Setup Wizard: if this is a fresh install (or --setup passed), open the
  // browser-based wizard and wait. The customer never edits .env by hand.
  const forceSetup = process.argv.includes('--setup');
  const configured = await isConfiguredCheck();

  if (!configured) {
    if (isService) {
      // A service cannot open a browser. Log a clear, actionable error and
      // exit non-zero so the failure is visible instead of hanging silently.
      log.error(
        'Agent haijasanidiwa. Endesha "npm run setup" kama mtumiaji (si service) ' +
          'kuweka token + MikroTik, KISHA anzisha service. Config husomwa kutoka ' +
          '.agent-data karibu na programu.',
      );
      process.exit(1);
    }
    // Interactive: open the wizard and wait.
    const ready = await ensureConfigured(forceSetup);
    if (!ready) {
      log.info('Agent inasubiri usanidi. Fungua browser kukamilisha, kisha anzisha upya agent.');
      return;
    }
  } else if (forceSetup) {
    await ensureConfigured(true);
    return;
  }

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

  // Keep the agent alive when node-routeros (or any async source) emits an
  // error outside our try/catch — e.g. UNKNOWNREPLY from the socket listener.
  // We log it and keep polling instead of letting Node kill the process.
  process.on('unhandledRejection', (reason) => {
    log.error('unhandledRejection (imepuuzwa, agent inaendelea)', String(reason));
  });
  process.on('uncaughtException', (err) => {
    log.error('uncaughtException (imepuuzwa, agent inaendelea)', String(err));
  });

  await orchestrator.start();

  if (orchestrator.wantsRestart()) {
    log.info('Natoka kwa restart (service manager itaanzisha upya)');
    process.exit(1);
  }
}

main().catch((e) => {
  log.error('Hitilafu kubwa', String(e));
  // Also write a crash marker synchronously — under a service, async logs may
  // not flush before exit. This file is the first place to look on failure.
  try {
    const crashDir = resolve(__dirname, '..', 'logs');
    mkdirSync(crashDir, { recursive: true });
    writeFileSync(
      resolve(crashDir, 'startup-error.log'),
      `${new Date().toISOString()}\n${String(e)}\n${e instanceof Error ? e.stack : ''}\n`,
    );
  } catch {
    // best-effort
  }
  process.exit(1);
});
