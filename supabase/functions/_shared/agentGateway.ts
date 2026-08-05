// Action handlers for the agent-gateway Edge Function. Each takes the
// service-role client, the authenticated agent, and the request body.
// The agent manages ALL company routers when router_id is null, else one.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import type { AgentRow } from './agentAuth.ts';

interface RouterRow {
  id: string;
  host: string | null;
  api_port: number;
  username: string | null;
}

/** Resolve which routers this agent manages, with decrypted passwords. */
async function agentRouters(admin: SupabaseClient, agent: AgentRow) {
  let q = admin
    .from('routers')
    .select('id, host, api_port, username')
    .eq('company_id', agent.company_id)
    .eq('is_active', true);
  if (agent.router_id) q = q.eq('id', agent.router_id);
  const { data: routers } = await q;

  const out = [];
  for (const r of (routers ?? []) as RouterRow[]) {
    const { data: cred } = await admin
      .from('router_credentials')
      .select('secret_id')
      .eq('router_id', r.id)
      .single();

    let password = '';
    if (cred?.secret_id) {
      const { data: secret } = await admin
        .schema('vault')
        .from('decrypted_secrets')
        .select('decrypted_secret')
        .eq('id', cred.secret_id)
        .single();
      password = secret?.decrypted_secret ?? '';
    }
    out.push({ id: r.id, host: r.host ?? '', apiPort: r.api_port, username: r.username ?? '', password });
  }
  return out;
}

/** poll: return managed routers + pending commands grouped by router. */
export async function handlePoll(admin: SupabaseClient, agent: AgentRow) {
  const routers = await agentRouters(admin, agent);
  const routerIds = routers.map((r) => r.id);

  const commands: Record<string, unknown[]> = {};
  if (routerIds.length > 0) {
    const { data: cmds } = await admin
      .from('router_commands')
      .select('id, router_id, command, params')
      .in('router_id', routerIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    for (const c of cmds ?? []) {
      (commands[c.router_id] ??= []).push({ id: c.id, command: c.command, args: c.params });
    }
    // Mark fetched commands as 'running' to avoid double-dispatch.
    const ids = (cmds ?? []).map((c) => c.id);
    if (ids.length) {
      await admin
        .from('router_commands')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .in('id', ids);
    }
  }

  return { routers, commands };
}

/** heartbeat: update a router's live metrics + mark online. */
export async function handleHeartbeat(admin: SupabaseClient, agent: AgentRow, body: Record<string, unknown>) {
  const routerId = String(body.routerId ?? '');
  const m = (body.metrics ?? {}) as Record<string, unknown>;
  await admin
    .from('routers')
    .update({
      status: 'online',
      last_seen: new Date().toISOString(),
      cpu_load: m.cpuLoad ?? null,
      mem_used: m.memUsed ?? null,
      mem_total: m.memTotal ?? null,
      uptime: m.uptime ?? null,
      board_name: m.boardName ?? null,
      os_version: m.version ?? null,
      connected_users: m.connectedUsers ?? null,
      ping_ms: body.pingMs ?? null,
      response_ms: body.responseMs ?? null,
      agent_id: agent.id,
    })
    .eq('id', routerId)
    .eq('company_id', agent.company_id);
}

/** sync: upsert a kind of RouterOS data into the dashboard cache. */
export async function handleSync(admin: SupabaseClient, agent: AgentRow, body: Record<string, unknown>) {
  await admin.from('router_sync_data').upsert(
    {
      router_id: String(body.routerId ?? ''),
      company_id: agent.company_id,
      kind: String(body.kind ?? ''),
      payload: body.payload ?? [],
      synced_at: new Date().toISOString(),
    },
    { onConflict: 'router_id,kind' },
  );
}

/** ack: mark commands done/failed with their results. */
export async function handleAck(admin: SupabaseClient, body: Record<string, unknown>) {
  const results = (body.results ?? []) as { id: string; ok: boolean; data?: unknown; error?: string }[];
  for (const r of results) {
    await admin
      .from('router_commands')
      .update({
        status: r.ok ? 'done' : 'failed',
        result: r.data ?? null,
        error: r.error ?? null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', r.id);
  }
}
