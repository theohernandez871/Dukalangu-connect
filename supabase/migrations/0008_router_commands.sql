-- =====================================================================
-- PHASE 4b — AGENT PROTOCOL: command queue + credential encryption
-- Transport: HTTP long-polling. Encryption: Supabase Vault.
-- Dollar-quoting: kila function ina tag yake ya kipekee.
-- =====================================================================

-- ---------- Vault (encryption) --------------------------------------
-- Supabase ships the `supabase_vault` extension. Secrets live outside
-- the data tables; we store only the secret's UUID reference.
create extension if not exists supabase_vault with schema vault;

-- Replace plain-text column with a Vault secret reference.
alter table public.router_credentials
  add column if not exists secret_id uuid;

-- Old column (password_enc) kept for compatibility; no longer written.
-- New writes go through set_router_password() below.

-- ---------- Command status enum -------------------------------------
do $cmdenum$
begin
  if not exists (select 1 from pg_type where typname = 'router_command_status') then
    create type public.router_command_status as enum
      ('pending', 'running', 'done', 'failed', 'timeout');
  end if;
end;
$cmdenum$;

-- ---------- Router command queue ------------------------------------
create table if not exists public.router_commands (
  id            uuid primary key default gen_random_uuid(),
  router_id     uuid not null references public.routers(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  requested_by  uuid references auth.users(id) on delete set null,
  command       text not null,             -- e.g. 'identity', 'ping', 'hotspot.list'
  params        jsonb not null default '{}'::jsonb,
  status        public.router_command_status not null default 'pending',
  result        jsonb,
  error         text,
  created_at    timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

create index if not exists idx_commands_router on public.router_commands(router_id, status);
create index if not exists idx_commands_pending
  on public.router_commands(router_id) where status = 'pending';

-- ---------- Store a router password into Vault ----------------------
-- SECURITY DEFINER so only this controlled path writes secrets.
-- Returns nothing; the raw password never leaves the server.
create or replace function public.set_router_password(p_router_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $setpw$
declare
  _company    uuid;
  _secret_id  uuid;
  _secret_name text;
begin
  -- Verify the caller manages this router's company.
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null or _company <> public.current_company_id() then
    raise exception 'Router si ya kampuni yako';
  end if;
  if not public.is_company_admin() then
    raise exception 'Hauna ruhusa';
  end if;

  _secret_name := 'router_' || p_router_id::text;

  -- Create or update the Vault secret.
  select secret_id into _secret_id from public.router_credentials where router_id = p_router_id;

  if _secret_id is null then
    _secret_id := vault.create_secret(p_password, _secret_name, 'RouterOS password');
    insert into public.router_credentials (router_id, secret_id)
    values (p_router_id, _secret_id)
    on conflict (router_id) do update set secret_id = excluded.secret_id, updated_at = now();
  else
    perform vault.update_secret(_secret_id, p_password);
    update public.router_credentials set updated_at = now() where router_id = p_router_id;
  end if;
end;
$setpw$;

-- ---------- Enqueue a command (client-facing, RLS-safe) -------------
create or replace function public.enqueue_router_command(
  p_router_id uuid,
  p_command   text,
  p_params    jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $enqueue$
declare
  _company uuid;
  _id      uuid;
begin
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null or _company <> public.current_company_id() then
    raise exception 'Router si ya kampuni yako';
  end if;

  insert into public.router_commands (router_id, company_id, requested_by, command, params)
  values (p_router_id, _company, auth.uid(), p_command, p_params)
  returning id into _id;

  return _id;
end;
$enqueue$;
