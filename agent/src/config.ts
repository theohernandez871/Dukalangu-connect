/**
 * Agent configuration, read from environment variables.
 * No secrets are hard-coded; the token is supplied by the operator.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[config] Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

export const config = {
  /** Base URL of the Supabase project, e.g. https://xxxx.supabase.co */
  supabaseUrl: required('SUPABASE_URL').replace(/\/$/, ''),

  /** The agent token created in the dashboard (shown once). */
  agentToken: required('AGENT_TOKEN'),

  /** Supabase anon key (needed to invoke Edge Functions). */
  anonKey: required('SUPABASE_ANON_KEY'),

  /** How often to poll for commands (ms). Default 3s. */
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 3000),

  /** RouterOS API connection timeout (ms). */
  routerTimeoutMs: Number(process.env.ROUTER_TIMEOUT_MS ?? 8000),

  /** Optional: override RouterOS host (else taken from server per poll). */
  routerHostOverride: process.env.ROUTER_HOST ?? null,
};

export function functionUrl(name: string): string {
  return `${config.supabaseUrl}/functions/v1/${name}`;
}
