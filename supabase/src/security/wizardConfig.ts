// Setup Wizard configuration store.
// Persists ALL agent settings (not just the token) in the encrypted secure
// store, so a customer never edits .env by hand. loadConfig() reads from here
// first, falling back to env only for backwards compatibility.

import { loadSecure, saveSecure } from './secureStore.js';

export interface WizardConfig {
  agentName: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  agentToken: string;
  routerHost: string;   // MikroTik IP
  routerPort: number;   // API port (default 8728)
  routerUser: string;   // MikroTik API username
  routerPassword: string;
  configured: boolean;  // true once the wizard has been completed
}

const DEFAULTS: Partial<WizardConfig> = {
  routerPort: 8728,
  configured: false,
};

/** Read the wizard config from the encrypted store (merged with any existing
 *  token already saved there). Returns partial config if not yet configured. */
export async function loadWizardConfig(): Promise<Partial<WizardConfig>> {
  const vault = await loadSecure();
  const raw = vault.wizard ? safeParse(vault.wizard) : {};
  return { ...DEFAULTS, ...raw, agentToken: raw.agentToken || vault.token || '' };
}

/** Persist the wizard config securely (encrypted at rest). The token is also
 *  mirrored to the top-level `token` field for loadConfig() compatibility. */
export async function saveWizardConfig(cfg: WizardConfig): Promise<void> {
  const vault = await loadSecure();
  await saveSecure({
    ...vault,
    token: cfg.agentToken,
    wizard: JSON.stringify(cfg),
  });
}

/** True if the wizard has been completed at least once. */
export async function isConfigured(): Promise<boolean> {
  const cfg = await loadWizardConfig();
  return Boolean(cfg.configured && cfg.agentToken && cfg.supabaseUrl && cfg.routerHost);
}

function safeParse(s: string): Partial<WizardConfig> {
  try {
    return JSON.parse(s) as Partial<WizardConfig>;
  } catch {
    return {};
  }
}
