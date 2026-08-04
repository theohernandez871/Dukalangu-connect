// Supabase Edge Function: invite-employee
// Invites a user by email and attaches company/branch/role metadata so the
// signup trigger links them to the caller's company instead of creating a new one.
//
// Security: verifies the CALLER is an admin/owner of the company before inviting.
// Uses the service-role key ONLY inside this trusted server context.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ASSIGNABLE = ['branch_manager', 'cashier', 'technician', 'sales_agent'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';

    // Client bound to the caller's JWT — used to identify who is calling.
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: 'Haujaidhinishwa' }, 401);
    }

    // Load caller profile to check role + company.
    const { data: profile } = await caller
      .from('profiles')
      .select('company_id, role')
      .eq('id', userData.user.id)
      .single();

    const adminRoles = ['super_admin', 'company_owner', 'branch_manager'];
    if (!profile || !adminRoles.includes(profile.role)) {
      return json({ error: 'Hauna ruhusa ya kualika' }, 403);
    }

    const body = await req.json();
    const { email, fullName, role, branchId } = body ?? {};

    if (!email || !fullName || !branchId || !ASSIGNABLE.includes(role)) {
      return json({ error: 'Taarifa si sahihi' }, 400);
    }

    // Admin client (service role) — trusted operations only.
    const admin = createClient(url, serviceKey);

    // Ensure the branch belongs to the caller's company (no cross-tenant invites).
    const { data: branch } = await admin
      .from('branches')
      .select('id, company_id')
      .eq('id', branchId)
      .single();

    if (!branch || branch.company_id !== profile.company_id) {
      return json({ error: 'Tawi si la kampuni yako' }, 400);
    }

    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        invited_company_id: profile.company_id,
        invited_branch_id: branchId,
        invited_role: role,
      },
      redirectTo: `${new URL(req.url).origin}/reset-password`,
    });

    if (inviteErr) return json({ error: inviteErr.message }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
