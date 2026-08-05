-- =====================================================================
-- PHASE 8B-1 — CUSTOMER PORTAL (Captive Portal)
-- Public-facing settings, ads, offers, announcements per company.
-- Portal reads via a SECURITY DEFINER function (no auth needed).
-- Voucher verification + hotspot activation via Edge Function.
-- Dollar-quotes: unique tags.
-- =====================================================================

-- ---------- Portal settings (one row per company) -------------------
create table if not exists public.portal_settings (
  company_id       uuid primary key references public.companies(id) on delete cascade,
  -- Public slug used in the portal URL: /portal/:slug
  slug             text unique,
  brand_name       text,
  logo_url         text,
  primary_color    text default '#059669',
  welcome_title    text default 'Karibu',
  welcome_message  text,
  support_phone    text,
  is_enabled       boolean not null default true,
  updated_at       timestamptz not null default now()
);

-- ---------- Advertisement banners -----------------------------------
create table if not exists public.portal_ads (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  title        text,
  image_url    text not null,
  link_url     text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_ads_company on public.portal_ads(company_id) where is_active;

-- ---------- Offers (promo packages) ---------------------------------
create table if not exists public.portal_offers (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  package_id   uuid references public.packages(id) on delete set null,
  title        text not null,
  description  text,
  promo_price  numeric(12,2),
  badge        text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists idx_offers_company on public.portal_offers(company_id) where is_active;

-- ---------- Announcements -------------------------------------------
create table if not exists public.portal_announcements (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  title        text not null,
  body         text,
  level        text not null default 'info',   -- info | warning | success
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists idx_ann_company on public.portal_announcements(company_id) where is_active;

-- ---------- updated_at trigger for settings -------------------------
create or replace function public.touch_portal_settings()
returns trigger language plpgsql as $touchportal$
begin new.updated_at := now(); return new; end;
$touchportal$;

drop trigger if exists trg_touch_portal on public.portal_settings;
create trigger trg_touch_portal before update on public.portal_settings
  for each row execute function public.touch_portal_settings();

-- ---------- Auto-create default settings + slug on company ----------
-- Reuse the company signup flow: give each new company a portal slug.
create or replace function public.ensure_portal_settings(p_company_id uuid)
returns void language plpgsql security definer set search_path = public
as $ensureportal$
declare _slug text; _name text;
begin
  if exists (select 1 from public.portal_settings where company_id = p_company_id) then
    return;
  end if;
  select name into _name from public.companies where id = p_company_id;
  _slug := lower(regexp_replace(coalesce(_name, 'portal'), '[^a-zA-Z0-9]+', '-', 'g'))
           || '-' || substr(p_company_id::text, 1, 6);
  insert into public.portal_settings (company_id, slug, brand_name, welcome_message)
  values (p_company_id, _slug, _name, 'Ingiza namba ya vocha yako ili kuunganisha.')
  on conflict (company_id) do nothing;
end;
$ensureportal$;

-- ---------- Public portal read (no auth) ----------------------------
-- Returns everything the portal needs for a slug, in one call.
create or replace function public.get_portal(p_slug text)
returns jsonb language plpgsql security definer set search_path = public
as $getportal$
declare _company uuid; _result jsonb;
begin
  select company_id into _company from public.portal_settings
   where slug = p_slug and is_enabled = true;
  if _company is null then
    return null;
  end if;

  select jsonb_build_object(
    'settings', (select to_jsonb(s) from public.portal_settings s where s.company_id = _company),
    'ads', coalesce((select jsonb_agg(to_jsonb(a) order by a.sort_order)
        from public.portal_ads a
       where a.company_id = _company and a.is_active
         and (a.starts_at is null or a.starts_at <= now())
         and (a.ends_at is null or a.ends_at >= now())), '[]'::jsonb),
    'offers', coalesce((select jsonb_agg(to_jsonb(o) order by o.sort_order)
        from public.portal_offers o
       where o.company_id = _company and o.is_active), '[]'::jsonb),
    'announcements', coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc)
        from public.portal_announcements n
       where n.company_id = _company and n.is_active), '[]'::jsonb)
  ) into _result;

  return _result;
end;
$getportal$;

grant execute on function public.get_portal(text) to anon;

-- ---------- Public voucher redemption (no auth) ---------------------
-- Verifies a voucher for a portal slug, marks it used, and enqueues a
-- hotspot activation command to the branch's router (if resolvable).
-- Returns a JSON result the portal shows to the customer.
create or replace function public.portal_redeem_voucher(p_slug text, p_code text, p_mac text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $redeem$
declare
  _company    uuid;
  _voucher    record;
  _pkg        record;
  _router     uuid;
begin
  select company_id into _company from public.portal_settings
   where slug = p_slug and is_enabled = true;
  if _company is null then
    return jsonb_build_object('ok', false, 'error', 'Portal haipatikani');
  end if;

  -- Normalize: strip spaces the portal may add for readability.
  p_code := replace(p_code, ' ', '');

  select * into _voucher from public.vouchers
   where company_id = _company and code = p_code
   limit 1;

  if _voucher.id is null then
    return jsonb_build_object('ok', false, 'error', 'Vocha haipo');
  end if;
  if _voucher.status = 'used' then
    return jsonb_build_object('ok', false, 'error', 'Vocha imeshatumika');
  end if;
  if _voucher.status = 'disabled' then
    return jsonb_build_object('ok', false, 'error', 'Vocha imezimwa');
  end if;
  if _voucher.expires_at is not null and _voucher.expires_at < now() then
    update public.vouchers set status = 'expired' where id = _voucher.id;
    return jsonb_build_object('ok', false, 'error', 'Vocha imeisha muda');
  end if;

  -- Mark used (idempotency guard: only if still unused).
  update public.vouchers
     set status = 'used', used_at = now(), used_by = coalesce(p_mac, used_by)
   where id = _voucher.id and status = 'unused';

  select * into _pkg from public.packages where id = _voucher.package_id;

  -- Try to enqueue a hotspot activation on a router in the same company.
  -- The agent creates a hotspot user (code) bound to the package profile.
  select id into _router from public.routers
   where company_id = _company and is_active
   order by (status = 'online') desc, created_at asc
   limit 1;

  if _router is not null then
    insert into public.router_commands (router_id, company_id, command, params, status)
    values (
      _router, _company, 'hotspot.create_user',
      jsonb_build_object(
        'name', _voucher.code,
        'password', _voucher.code,
        'profile', coalesce(_pkg.router_profile, 'default')
      ),
      'pending'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', _voucher.code,
    'package', coalesce(_pkg.name, null),
    'activated', _router is not null
  );
end;
$redeem$;

grant execute on function public.portal_redeem_voucher(text, text, text) to anon;

-- ---------- RLS (admin-managed tables) ------------------------------
alter table public.portal_settings       enable row level security;
alter table public.portal_ads            enable row level security;
alter table public.portal_offers         enable row level security;
alter table public.portal_announcements  enable row level security;

-- Admin read/write within their company. Public read is via get_portal().
do $portalrls$
declare t text;
begin
  foreach t in array array['portal_settings','portal_ads','portal_offers','portal_announcements'] loop
    execute format($p$
      drop policy if exists %1$s_select on public.%1$s;
      create policy %1$s_select on public.%1$s
        for select using (company_id = public.current_company_id());
      drop policy if exists %1$s_write on public.%1$s;
      create policy %1$s_write on public.%1$s
        for all using (company_id = public.current_company_id() and public.is_company_admin())
        with check (company_id = public.current_company_id());
    $p$, t);
  end loop;
end;
$portalrls$;

-- Backfill portal settings for existing companies.
do $backfill$
declare c record;
begin
  for c in select id from public.companies loop
    perform public.ensure_portal_settings(c.id);
  end loop;
end;
$backfill$;
