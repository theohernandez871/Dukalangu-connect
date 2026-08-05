// Edge Function: omada-proxy
// For 'cloud'/public controllers. Verifies the caller owns the controller,
// decrypts its password from Vault, runs a whitelisted read command against
// the Omada Controller API, and returns the result. Credentials stay
// server-side; the browser never sees them.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, preflight, env } from '../_shared/http.ts';
import { runOmadaCommand, type OmadaConfig } from '../_shared/omadaClient.ts';

const ALLOWED = ['omada.devices', 'omada.aps', 'omada.clients', 'omada.status'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Haujaidhinishwa' }, 401);

    const caller = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Haujaidhinishwa' }, 401);

    const { controllerId, command } = await req.json();
    if (!controllerId || !ALLOWED.includes(command)) {
      return json({ error: 'Ombi si sahihi' }, 400);
    }

    // Load controller (RLS ensures it belongs to the caller's company).
    const { data: ctrl, error: ctrlErr } = await caller
      .from('omada_controllers')
      .select('base_url, omadac_id, site_id, username, connection_type')
      .eq('id', controllerId)
      .single();

    if (ctrlErr || !ctrl) return json({ error: 'Controller haipatikani' }, 404);
    if (ctrl.connection_type !== 'cloud') {
      return json({ error: 'Controller hii inatumia agent (local)' }, 400);
    }

    // Read decrypted password via SECURITY DEFINER RPC (vault isn't API-exposed).
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: password } = await admin.rpc('get_omada_password', {
      p_controller_id: controllerId,
    });

    const cfg: OmadaConfig = {
      baseUrl: (ctrl.base_url ?? '').replace(/\/$/, ''),
      omadacId: ctrl.omadac_id ?? '',
      site: ctrl.site_id ?? 'Default',
      username: ctrl.username ?? '',
      password: (password as string | null) ?? '',
    };

    const result = await runOmadaCommand(cfg, command);

    // Best-effort status update.
    await admin
      .from('omada_controllers')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('id', controllerId);

    return json({ data: result });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
