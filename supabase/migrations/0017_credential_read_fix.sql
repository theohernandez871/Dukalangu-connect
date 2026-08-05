-- =====================================================================
-- FIX: Router credential READ path.
-- Root cause: the agent-gateway read `vault.decrypted_secrets` directly via
-- PostgREST, but the `vault` schema is NOT exposed to the API — so the read
-- returned NULL and the agent received an empty password ("invalid password").
--
-- Solution: a SECURITY DEFINER RPC that reads the decrypted secret inside the
-- database (where vault IS reachable) and returns it. Callable by service_role
-- only (used by the Edge Function), never by anon/authenticated clients.
-- Dollar-quotes: unique tags.
-- =====================================================================

create or replace function public.get_router_password(p_router_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $getrouterpw$
declare
  _secret_id uuid;
  _password  text;
begin
  select secret_id into _secret_id
    from public.router_credentials
   where router_id = p_router_id;

  if _secret_id is null then
    return null;
  end if;

  -- vault.decrypted_secrets is reachable here (definer context), not via API.
  select decrypted_secret into _password
    from vault.decrypted_secrets
   where id = _secret_id;

  return _password;
end;
$getrouterpw$;

-- Only the service role (Edge Functions) may read decrypted passwords.
revoke all on function public.get_router_password(uuid) from public, anon, authenticated;
grant execute on function public.get_router_password(uuid) to service_role;

-- Same fix for Omada controllers (same root cause).
create or replace function public.get_omada_password(p_controller_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $getomadapw$
declare
  _secret_id uuid;
  _password  text;
begin
  select secret_id into _secret_id
    from public.omada_credentials
   where controller_id = p_controller_id;

  if _secret_id is null then
    return null;
  end if;

  select decrypted_secret into _password
    from vault.decrypted_secrets
   where id = _secret_id;

  return _password;
end;
$getomadapw$;

revoke all on function public.get_omada_password(uuid) from public, anon, authenticated;
grant execute on function public.get_omada_password(uuid) to service_role;

-- ---------- Cleanup: drop obsolete plaintext-era columns -------------
-- password_enc predates the Vault migration and is always NULL now. Removing
-- it prevents confusion about where credentials live (answer: Vault only).
alter table public.router_credentials drop column if exists password_enc;
