// Edge Function: agent-report
// The agent posts command results and router status/heartbeat here.
// Authenticated by agent token. Updates command rows + router status.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight, env } from '../_shared/http.ts';
import { authenticateAgent } from '../_shared/agentAuth.ts';

interface CommandResult {
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

interface RouterStatus {
  status?: 'online' | 'offline' | 'error';
  os_version?: string;
  model?: string;
  cpu_load?: number;
  mem_used?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  try {
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const agent = await authenticateAgent(admin, req.headers.get('x-agent-token'));
    if (!agent) return json({ error: 'Agent haijaidhinishwa' }, 401);

    const body = await req.json();
    const results: CommandResult[] = body.results ?? [];
    const status: RouterStatus | undefined = body.status;
    const now = new Date().toISOString();

    // Persist each command result.
    for (const r of results) {
      await admin
        .from('router_commands')
        .update({
          status: r.ok ? 'done' : 'failed',
          result: r.result ?? null,
          error: r.error ?? null,
          finished_at: now,
        })
        .eq('id', r.id)
        .eq('router_id', agent.router_id);
    }

    // Update router status + heartbeat history.
    if (status && agent.router_id) {
      await admin
        .from('routers')
        .update({
          status: status.status ?? 'online',
          os_version: status.os_version ?? null,
          model: status.model ?? null,
          last_seen: now,
        })
        .eq('id', agent.router_id);

      await admin.from('router_status_history').insert({
        router_id: agent.router_id,
        status: status.status ?? 'online',
        cpu_load: status.cpu_load ?? null,
        mem_used: status.mem_used ?? null,
      });
    }

    await admin.from('router_agents').update({ last_ping: now }).eq('id', agent.id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
