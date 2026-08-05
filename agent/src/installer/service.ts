// Windows Service installer using node-windows. Designed so a Linux systemd
// backend can be added later behind the same install()/uninstall() interface.
//
// Usage (after build):
//   node dist/installer/service.js install
//   node dist/installer/service.js uninstall
//
// node-windows is an optional dependency; it is only required on Windows when
// installing as a service. Direct `npm start` / PM2 / Docker do not need it.

import { join } from 'node:path';
import { createLogger } from '../logging/logger.js';

const log = createLogger('installer');

const SERVICE_NAME = 'HotspotBillingAgent';
const SCRIPT = join(process.cwd(), 'dist', 'index.js');

interface WinService {
  on(event: string, cb: () => void): void;
  install(): void;
  uninstall(): void;
  start(): void;
}

async function makeService(): Promise<WinService> {
  // Dynamic import so non-Windows environments don't fail at load time.
  // The module name is held in a variable so TypeScript does not require the
  // optional dependency's types at compile time.
  const moduleName = 'node-windows';
  const nodeWindows = await import(moduleName).catch(() => null);
  if (!nodeWindows) {
    throw new Error('node-windows haijapatikana. Endesha: npm install node-windows');
  }
  const { Service } = nodeWindows as unknown as { Service: new (o: unknown) => WinService };
  return new Service({
    name: SERVICE_NAME,
    description: 'Hotspot Billing Enterprise Agent — huunganisha MikroTik na mfumo.',
    script: SCRIPT,
    nodeOptions: [],
    // Restart policy: node-windows restarts on failure automatically.
    wait: 2,
    grow: 0.5,
    maxRestarts: 40,
  });
}

async function install(): Promise<void> {
  const svc = await makeService();
  svc.on('install', () => {
    log.info('Service imesakinishwa. Naiwasha...');
    svc.start();
  });
  svc.on('alreadyinstalled', () => log.info('Service tayari imesakinishwa.'));
  svc.install();
}

async function uninstall(): Promise<void> {
  const svc = await makeService();
  svc.on('uninstall', () => log.info('Service imeondolewa.'));
  svc.uninstall();
}

async function main(): Promise<void> {
  const action = process.argv[2];
  if (action === 'install') await install();
  else if (action === 'uninstall') await uninstall();
  else {
    log.error('Tumia: node dist/installer/service.js [install|uninstall]');
    process.exit(1);
  }
}

main().catch((e) => {
  log.error('Installer imeshindwa', String(e));
  process.exit(1);
});
