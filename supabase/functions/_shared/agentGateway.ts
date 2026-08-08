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
    // Read the decrypted password via a SECURITY DEFINER RPC. The vault schema
    // is not exposed to the API, so a direct query returns null — the RPC reads
    // it inside the database (where vault is reachable) and returns it.
    const { data: password, error: pwErr } = await admin.rpc('get_router_password', {
      p_router_id: r.id,
    });
    if (pwErr) {
      console.error(`get_router_password failed for ${r.id}:`, pwErr.message);
    }
    out.push({
      id: r.id,
      host: r.host ?? '',
      apiPort: r.api_port,
      username: r.username ?? '',
      password: (password as string | null) ?? '',
    });
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
  const routerId = String(body.routerId ?? '');
  const kind = String(body.kind ?? '');

  await admin.from('router_sync_data').upsert(
    {
      router_id: routerId,
      company_id: agent.company_id,
      kind,
      payload: body.payload ?? [],
      synced_at: new Date().toISOString(),
    },
    { onConflict: 'router_id,kind' },
  );

  // After a hotspot users sync, auto-mark vouchers whose hotspot user has
  // consumed time/data as 'used', so reports reflect real usage even when
  // customers log in directly on the router. Then expire any voucher whose
  // 14-hour validity window has passed: disable the user on the router and flip
  // its status. Best-effort: never fail the sync path.
  if (kind === 'hotspot.users' && routerId) {
    try {
      await admin.rpc('mark_used_from_sync', { p_router_id: routerId });

      // Find vouchers past their validity window and disable them on the router.
      const { data: expired } = await admin.rpc('expired_voucher_codes', { p_router_id: routerId });
      const codes = (expired ?? []) as { code: string }[];
      for (const { code } of codes) {
        await admin.from('router_commands').insert({
          router_id: routerId,
          company_id: agent.company_id,
          requested_by: null,
          command: 'hotspot.disable_by_name',
          params: { code },
        });
      }
      // Flip their status to 'expired' (idempotent).
      if (codes.length > 0) {
        await admin.rpc('expire_vouchers', { p_router_id: routerId });
      }
    } catch (_e) {
      // Ignore — reporting/expiry enrichment must not break the sync path.
    }
  }
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

/** log: write agent lifecycle logs to router_logs for dashboard visibility. */
export async function handleLog(admin: SupabaseClient, agent: AgentRow, body: Record<string, unknown>) {
  const entries = (body.entries ?? []) as { level?: string; scope?: string; message: string; routerId?: string }[];
  if (entries.length === 0) return;
  const rows = entries.map((e) => ({
    company_id: agent.company_id,
    router_id: e.routerId ?? agent.router_id ?? null,
    agent_id: agent.id,
    level: e.level ?? 'info',
    scope: e.scope ?? null,
    message: e.message,
  }));
  await admin.from('router_logs').insert(rows);
}
