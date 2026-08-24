// Loads and validates agent configuration from environment (.env is loaded by
// `import 'dotenv/config'` in index.ts). Resolves the agent token from env on
// first run (then persists it encrypted) or from the encrypted store after.

import { existsSync } from 'node:fs';
import { loadSecure, saveSecure } from './secureStore.js';
import { loadWizardConfig } from './wizardConfig.js';
import { normalizeSupabaseUrl } from './urlNormalize.js';

export interface AgentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  agentToken: string;
  pollInterval: number; // ms between command polls
  heartbeat: number;    // ms between heartbeats (default 30s)
  apiTimeout: number;   // RouterOS API timeout ms
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/** Validate all required env vars at once and produce one clear error. */
function requireEnv(names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const n of names) {
    const v = process.env[n];
    if (!v || !v.trim()) missing.push(n);
    else out[n] = v.trim();
  }
  if (missing.length > 0) {
    const hint = existsSync('.env')
      ? 'Faili .env ipo lakini haina thamani hizi (au zina nafasi/mistari isiyo sahihi).'
      : 'Faili .env HAIPO kwenye folda hii. Nakili .env.example -> .env kisha weka thamani.';
    throw new Error(
      `Env variables hazipo: ${missing.join(', ')}. ${hint}`,
    );
  }
  return out;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function loadConfig(): Promise<AgentConfig> {
  // Prefer the Setup Wizard config (encrypted store). Fall back to env for
  // developer setups / backwards compatibility.
  const wiz = await loadWizardConfig();
  if (wiz.configured && wiz.agentToken && wiz.supabaseUrl) {
    const supabaseUrl = normalizeSupabaseUrl(wiz.supabaseUrl).url;
    return {
      supabaseUrl,
      supabaseAnonKey: wiz.supabaseAnonKey ?? '',
      agentToken: wiz.agentToken,
      pollInterval: parseIntEnv('POLL_INTERVAL', 3000),
      heartbeat: parseIntEnv('HEARTBEAT_INTERVAL', 30000),
      apiTimeout: parseIntEnv('API_TIMEOUT', 8000),
      logLevel: (process.env.LOG_LEVEL as AgentConfig['logLevel']) ?? 'info',
    };
  }

  // AGENT_TOKEN may come from env (first run) or the encrypted store (later).
  const vault = await loadSecure();
  const envToken = process.env.AGENT_TOKEN?.trim();
  const token = envToken || vault.token || '';

  // Require URL + anon key from env always; token from env OR store.
  const env = requireEnv(['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
  if (!token) {
    throw new Error(
      'AGENT_TOKEN haipo. Weka AGENT_TOKEN kwenye .env (mara ya kwanza) — unaipata dashboardi (Routers -> Agents -> Tengeneza agent).',
    );
  }

  const supabaseUrl = normalizeSupabaseUrl(env.SUPABASE_URL).url;
  if (!/^https:\/\/.+/.test(supabaseUrl)) {
    throw new Error(`SUPABASE_URL si sahihi: "${env.SUPABASE_URL}". Inapaswa kuwa kama https://PROJECT.supabase.co`);
  }

  // Persist the token encrypted so future runs do not need it in env.
  if (envToken && vault.token !== envToken) {
    await saveSecure({ ...vault, token: envToken });
  }

  return {
    supabaseUrl,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    agentToken: token,
    pollInterval: parseIntEnv('POLL_INTERVAL', 3000),
    heartbeat: parseIntEnv('HEARTBEAT_INTERVAL', 30000),
    apiTimeout: parseIntEnv('API_TIMEOUT', 8000),
    logLevel: (process.env.LOG_LEVEL as AgentConfig['logLevel']) ?? 'info',
  };
}
