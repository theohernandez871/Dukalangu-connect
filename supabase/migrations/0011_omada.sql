-- =====================================================================
-- PHASE 5 — TP-LINK OMADA CONTROLLERS
-- Hybrid: 'cloud' (public URL, via Edge Function) or 'local' (via agent).
-- Credentials stored in Vault (like Phase 4b). Dollar-quotes: unique tags.
-- =====================================================================

-- ---------- Enum -----------------------------------------------------
do $omadaenum$
begin
  if not exists (select 1 from pg_type where typname = 'omada_connection_type') then
    create type public.omada_connection_type as enum ('cloud', 'local');
  end if;
end;
$omadaenum$;

-- ---------- Omada controllers ----------------------------------------
create table if not exists public.omada_controllers (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  branch_id        uuid references public.branches(id) on delete set null,
  name             text not null,
  connection_type  public.omada_connection_type not null default 'cloud',

  -- Base URL of the controller, e.g. https://omada.example.com:8043
  base_url         text,
  -- Omada Controller ID (omadacId) + Site name/id.
  omadac_id        text,
  site_id          text,
  username         text,

  status           public.router_status not null default 'unknown',
  last_seen        timestamptz,

  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_omada_company on public.omada_controllers(company_id);

-- ---------- Omada credentials (SECRET — Vault) -----------------------
create table if not exists public.omada_credentials (
  controller_id  uuid primary key references public.omada_controllers(id) on delete cascade,
  secret_id      uuid,
  updated_at     timestamptz not null default now()
);

-- ---------- Store password into Vault --------------------------------
create or replace function public.set_omada_password(p_controller_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $setomadapw$
declare
  _company   uuid;
  _secret_id uuid;
begin
  select company_id into _company from public.omada_controllers where id = p_controller_id;
  if _company is null or _company <> public.current_company_id() then
    raise exception 'Controller si ya kampuni yako';
  end if;
  if not public.is_company_admin() then
    raise exception 'Hauna ruhusa';
  end if;

  select secret_id into _secret_id from public.omada_credentials where controller_id = p_controller_id;

  if _secret_id is null then
    _secret_id := vault.create_secret(p_password, 'omada_' || p_controller_id::text, 'Omada password');
    insert into public.omada_credentials (controller_id, secret_id)
    values (p_controller_id, _secret_id)
    on conflict (controller_id) do update set secret_id = excluded.secret_id, updated_at = now();
  else
    perform vault.update_secret(_secret_id, p_password);
    update public.omada_credentials set updated_at = now() where controller_id = p_controller_id;
  end if;
end;
$setomadapw$;

-- ---------- updated_at + audit triggers ------------------------------
drop trigger if exists trg_touch_omada on public.omada_controllers;
create trigger trg_touch_omada
  before update on public.omada_controllers
  for each row execute function public.touch_router_updated();

create or replace function public.audit_omada_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $auditomada$
begin
  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (
    coalesce(new.company_id, old.company_id),
    auth.uid(),
    case tg_op when 'INSERT' then 'omada.create' when 'UPDATE' then 'omada.update' else 'omada.delete' end,
    jsonb_build_object('controller', coalesce(new.name, old.name))
  );
  return coalesce(new, old);
end;
$auditomada$;

drop trigger if exists trg_audit_omada on public.omada_controllers;
create trigger trg_audit_omada
  after insert or update or delete on public.omada_controllers
  for each row execute function public.audit_omada_change();

-- ---------- RLS ------------------------------------------------------
alter table public.omada_controllers  enable row level security;
alter table public.omada_credentials  enable row level security;

drop policy if exists omada_select on public.omada_controllers;
create policy omada_select on public.omada_controllers
  for select using (company_id = public.current_company_id());

drop policy if exists omada_insert on public.omada_controllers;
create policy omada_insert on public.omada_controllers
  for insert with check (company_id = public.current_company_id() and public.is_company_admin());

drop policy if exists omada_update on public.omada_controllers;
create policy omada_update on public.omada_controllers
  for update using (company_id = public.current_company_id() and public.is_company_admin())
  with check (company_id = public.current_company_id());

drop policy if exists omada_delete on public.omada_controllers;
create policy omada_delete on public.omada_controllers
  for delete using (company_id = public.current_company_id() and public.is_company_admin());

-- omada_credentials: no client policies (service-role only).
