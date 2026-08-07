-- =====================================================================
-- PHASE 3 / Module 2: Public package list for the customer portal.
-- ADDITIVE ONLY — one new SECURITY DEFINER function, granted to anon so the
-- captive portal can show a package store. Returns only active packages, and
-- only the fields a customer needs (no internal ids beyond the package id).
-- =====================================================================

create or replace function public.portal_packages(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $portalpackages$
declare
  _company uuid;
  _result jsonb;
begin
  select company_id into _company
    from public.portal_settings
   where slug = p_slug and is_enabled = true;
  if _company is null then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'price', p.price,
        'duration_value', p.duration_value,
        'duration_unit', p.duration_unit,
        'data_limit_mb', p.data_limit_mb,
        'speed_down_kbps', p.speed_down_kbps,
        'speed_up_kbps', p.speed_up_kbps,
        'description', p.description
      )
      order by p.sort_order, p.price
    ),
    '[]'::jsonb
  )
  into _result
  from public.packages p
  where p.company_id = _company
    and p.is_active;

  return _result;
end;
$portalpackages$;

grant execute on function public.portal_packages(text) to anon;
