// Loads agent configuration from environment, resolving the agent token
// from (1) env AGENT_TOKEN on first run, then persisting it encrypted, or
// (2) the encrypted secure store on subsequent runs.

import { loadSecure, saveSecure } from './secureStore.js';

export interface AgentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  agentToken: string;
  pollInterval: number;   // ms between command polls
  heartbeat: number;      // ms between heartbeats (default 30s)
  apiTimeout: number;     // RouterOS API timeout ms
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export async function loadConfig(): Promise<AgentConfig> {
  const vault = await loadSecure();

  // Token: prefer env on first-run registration, else the secure store.
  let token = process.env.AGENT_TOKEN ?? vault.token ?? '';
  if (!token) {
    throw new Error('AGENT_TOKEN haijawekwa (mara ya kwanza weka kwenye env).');
  }
  // Persist token encrypted so future runs do not need it in env.
  if (process.env.AGENT_TOKEN && vault.token !== process.env.AGENT_TOKEN) {
    await saveSecure({ ...vault, token });
    token = process.env.AGENT_TOKEN;
  }

  return {
    supabaseUrl: req('SUPABASE_URL').replace(/\/$/, ''),
    supabaseAnonKey: req('SUPABASE_ANON_KEY'),
    agentToken: token,
    pollInterval: Number(process.env.POLL_INTERVAL ?? 3000),
    heartbeat: Number(process.env.HEARTBEAT_INTERVAL ?? 30000),
    apiTimeout: Number(process.env.API_TIMEOUT ?? 8000),
    logLevel: (process.env.LOG_LEVEL as AgentConfig['logLevel']) ?? 'info',
  };
}
