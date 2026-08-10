// Setup launcher. On startup the agent checks whether it has been configured.
// If not (fresh install), it starts the Setup Wizard server and opens the
// customer's browser to it, then waits — the agent does not try to run until
// configuration is saved. A CLI flag (--setup) forces the wizard open even when
// already configured (for re-configuration / token replacement).

import { spawn } from 'node:child_process';
import { isConfigured } from '../security/wizardConfig.js';
import { startWizardServer } from './wizardServer.js';

const WIZARD_PORT = Number(process.env.WIZARD_PORT ?? 3500);

/** Open a URL in the default browser (Windows/macOS/Linux). */
function openBrowser(url: string) {
  const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
  } catch {
    // If we can't open a browser, the URL is still printed for the user.
  }
}

/**
 * Ensure the agent is configured. Returns true if ready to run, false if the
 * wizard was opened and the process should wait for the user to finish.
 */
export async function ensureConfigured(force = false): Promise<boolean> {
  const configured = await isConfigured();
  if (configured && !force) return true;

  const port = await startWizardServer(WIZARD_PORT);
  const url = `http://127.0.0.1:${port}`;
  // eslint-disable-next-line no-console
  console.log(`\n============================================\n` +
    `  USANIDI WA AGENT\n` +
    `  Fungua kwenye browser: ${url}\n` +
    `  (Tunajaribu kuifungua yenyewe...)\n` +
    `============================================\n`);
  openBrowser(url);
  return false;
}
