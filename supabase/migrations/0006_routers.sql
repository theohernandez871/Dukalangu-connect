-- =====================================================================
-- PHASE 4a — ROUTERS (MikroTik) + AGENTS
-- Connection model: on-site Agent (works behind CGNAT/NAT), Hybrid-ready.
-- Credentials are NEVER exposed to the browser (see credential columns).
-- Dollar-quoting: kila function ina tag yake ya kipekee.
-- =====================================================================

-- ---------- Enums ----------------------------------------------------
do $rtenum$
begin
  if not exists (select 1 from pg_type where typname = 'router_connection_type') then
    create type public.router_connection_type as enum ('agent', 'direct');
  end if;
  if not exists (select 1 from pg_type where typname = 'router_status') then
    create type public.router_status as enum ('online', 'offline', 'unknown', 'error');
  end if;
end;
$rtenum$;

-- ---------- Routers --------------------------------------------------
create table if not exists public.routers (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  branch_id        uuid references public.branches(id) on delete set null,
  name             text not null,
  connection_type  public.router_connection_type not null default 'agent',

  -- For 'direct' connections only (public IP / port-forward).
  host             text,
  api_port         integer not null default 8728,

  -- RouterOS username. The PASSWORD is never stored here in plain text;
  -- it lives in `router_credentials` (service-role only, no RLS select).
  username         text,

  -- Live status (updated by the agent / test).
  status           public.router_status not null default 'unknown',
  os_version       text,
  model            text,
  last_seen        timestamptz,

  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_routers_company on public.routers(company_id);
create index if not exists idx_routers_branch on public.routers(branch_id);

-- ---------- Router credentials (SECRET — no client access) ----------
-- Separate table so RLS can block ALL client reads. Only Edge Functions
-- using the service role may read/write here. Password stored encrypted
-- (encryption applied in Phase 4b via Edge Function + vault).
create table if not exists public.router_credentials (
  router_id        uuid primary key references public.routers(id) on delete cascade,
  password_enc     text,          -- encrypted blob (never plain text)
  updated_at       timestamptz not null default now()
);

-- ---------- Router agents -------------------------------------------
-- One agent per site; connects outbound to our Edge Function.
create table if not exists public.router_agents (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  router_id        uuid references public.routers(id) on delete set null,
  name             text not null default 'Agent',
  -- Hash of the agent token; raw token shown once at creation.
  token_hash       text not null,
  last_ping        timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_agents_company on public.router_agents(company_id);

-- ---------- Router status history (uptime tracking) ------------------
create table if not exists public.router_status_history (
  id           bigint generated always as identity primary key,
  router_id    uuid not null references public.routers(id) on delete cascade,
  status       public.router_status not null,
  cpu_load     integer,
  mem_used     bigint,
  recorded_at  timestamptz not null default now()
);

create index if not exists idx_status_history_router
  on public.router_status_history(router_id, recorded_at desc);

-- ---------- updated_at touch trigger --------------------------------
create or replace function public.touch_router_updated()
returns trigger
language plpgsql
as $touchrt$
begin
  new.updated_at := now();
  return new;
end;
$touchrt$;

drop trigger if exists trg_touch_router on public.routers;
create trigger trg_touch_router
  before update on public.routers
  for each row execute function public.touch_router_updated();

-- ---------- Audit trigger for router changes ------------------------
create or replace function public.audit_router_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $auditrt$
begin
  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (
    coalesce(new.company_id, old.company_id),
    auth.uid(),
    case tg_op
      when 'INSERT' then 'router.create'
      when 'UPDATE' then 'router.update'
      else 'router.delete'
    end,
    jsonb_build_object('router', coalesce(new.name, old.name))
  );
  return coalesce(new, old);
end;
$auditrt$;

drop trigger if exists trg_audit_router on public.routers;
create trigger trg_audit_router
  after insert or update or delete on public.routers
  for each row execute function public.audit_router_change();
