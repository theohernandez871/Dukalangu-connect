// Edge Function: agent-poll
// The on-site agent calls this on an interval. We authenticate by token,
// update the heartbeat, hand back the router's connection details +
// decrypted password (Vault), and any pending commands. Commands are
// marked 'running' so they aren't handed out twice.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight, env } from '../_shared/http.ts';
import { authenticateAgent } from '../_shared/agentAuth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  try {
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const token = req.headers.get('x-agent-token');

    const agent = await authenticateAgent(admin, token);
    if (!agent) return json({ error: 'Agent haijaidhinishwa' }, 401);

    // Heartbeat.
    await admin.from('router_agents').update({ last_ping: new Date().toISOString() }).eq('id', agent.id);

    if (!agent.router_id) return json({ router: null, commands: [] });

    // Router connection details.
    const { data: router } = await admin
      .from('routers')
      .select('id, host, api_port, username, connection_type')
      .eq('id', agent.router_id)
      .single();

    // Decrypt the password via Vault view (service-role only).
    let password: string | null = null;
    const { data: cred } = await admin
      .from('router_credentials')
      .select('secret_id')
      .eq('router_id', agent.router_id)
      .single();

    if (cred?.secret_id) {
      const { data: secret } = await admin
        .schema('vault')
        .from('decrypted_secrets')
        .select('decrypted_secret')
        .eq('id', cred.secret_id)
        .single();
      password = secret?.decrypted_secret ?? null;
    }

    // Claim pending commands (mark running).
    const { data: pending } = await admin
      .from('router_commands')
      .select('id, command, params')
      .eq('router_id', agent.router_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    const ids = (pending ?? []).map((c) => c.id);
    if (ids.length) {
      await admin
        .from('router_commands')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .in('id', ids);
    }

    return json({
      router: router ? { ...router, password } : null,
      commands: pending ?? [],
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
