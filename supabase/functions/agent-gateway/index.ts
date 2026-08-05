// Edge Function: agent-gateway
// Single endpoint for the Enterprise Agent. Authenticates via x-agent-token
// (sha256 hash lookup), then dispatches by `action`:
//   poll       -> managed routers (with decrypted creds) + pending commands
//   heartbeat  -> update live metrics + mark online
//   sync       -> cache RouterOS data for real-time dashboard
//   ack        -> record command results
// All comms are HTTPS; credentials never leave the server except the router
// password delivered to its own authenticated agent.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight, env } from '../_shared/http.ts';
import { authenticateAgent } from '../_shared/agentAuth.ts';
import { handlePoll, handleHeartbeat, handleSync, handleAck, handleLog } from '../_shared/agentGateway.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  try {
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

    const agent = await authenticateAgent(admin, req.headers.get('x-agent-token'));
    if (!agent) return json({ error: 'Token si sahihi' }, 401);

    // Touch agent last_seen.
    await admin.from('router_agents').update({ last_seen: new Date().toISOString() }).eq('id', agent.id);

    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body.action ?? '');

    switch (action) {
      case 'poll':
        return json(await handlePoll(admin, agent));
      case 'heartbeat':
        await handleHeartbeat(admin, agent, body);
        return json({ ok: true });
      case 'sync':
        await handleSync(admin, agent, body);
        return json({ ok: true });
      case 'ack':
        await handleAck(admin, body);
        return json({ ok: true });
      case 'log':
        await handleLog(admin, agent, body);
        return json({ ok: true });
      default:
        return json({ error: 'Kitendo si sahihi' }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
