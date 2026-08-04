// Edge Function: router-set-credential
// Stores a RouterOS password securely in Supabase Vault via the
// set_router_password() RPC. The RPC (SECURITY DEFINER) verifies the
// caller manages the router. The raw password never touches any table.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cors, json, preflight, env } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Haujaidhinishwa' }, 401);

    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authHeader } },
    });

    const { routerId, password } = await req.json();
    if (!routerId || !password) return json({ error: 'Taarifa si sahihi' }, 400);
    if (String(password).length < 1) return json({ error: 'Nywila tupu' }, 400);

    // RPC runs SECURITY DEFINER + checks company ownership + admin role.
    const { error } = await supabase.rpc('set_router_password', {
      p_router_id: routerId,
      p_password: password,
    });

    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
