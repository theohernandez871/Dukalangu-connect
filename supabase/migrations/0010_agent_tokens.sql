-- =====================================================================
-- PHASE 4b — AGENT TOKEN + POLL/REPORT SUPPORT
-- Agent token: raw shown once; only its hash is stored.
-- =====================================================================

-- pgcrypto for digest()/gen_random_bytes()
create extension if not exists pgcrypto with schema extensions;

-- ---------- Create an agent, returning the RAW token once -----------
create or replace function public.create_router_agent(
  p_name      text,
  p_router_id uuid default null
)
returns table (agent_id uuid, raw_token text)
language plpgsql
security definer
set search_path = public, extensions
as $createagent$
declare
  _company uuid := public.current_company_id();
  _token   text;
  _hash    text;
  _id      uuid;
begin
  if _company is null or not public.is_company_admin() then
    raise exception 'Hauna ruhusa ya kutengeneza agent';
  end if;

  -- 32-byte random token, hex-encoded.
  _token := encode(extensions.gen_random_bytes(32), 'hex');
  _hash  := encode(extensions.digest(_token, 'sha256'), 'hex');

  insert into public.router_agents (company_id, router_id, name, token_hash)
  values (_company, p_router_id, coalesce(p_name, 'Agent'), _hash)
  returning id into _id;

  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (_company, auth.uid(), 'agent.create', jsonb_build_object('name', p_name));

  agent_id := _id;
  raw_token := _token;
  return next;
end;
$createagent$;

-- ---------- Rotate / revoke helpers ---------------------------------
create or replace function public.revoke_router_agent(p_agent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $revoke$
begin
  if not public.is_company_admin() then
    raise exception 'Hauna ruhusa';
  end if;
  update public.router_agents
     set is_active = false
   where id = p_agent_id
     and company_id = public.current_company_id();
end;
$revoke$;
