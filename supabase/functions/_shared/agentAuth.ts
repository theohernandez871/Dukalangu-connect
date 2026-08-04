// Authenticate an agent by its token (x-agent-token header).
// Returns the agent row (with company_id, router_id) or null.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface AgentRow {
  id: string;
  company_id: string;
  router_id: string | null;
  is_active: boolean;
}

export async function authenticateAgent(
  admin: SupabaseClient,
  token: string | null,
): Promise<AgentRow | null> {
  if (!token) return null;
  const hash = await sha256Hex(token);
  const { data } = await admin
    .from('router_agents')
    .select('id, company_id, router_id, is_active')
    .eq('token_hash', hash)
    .eq('is_active', true)
    .single();
  return (data as AgentRow) ?? null;
}
