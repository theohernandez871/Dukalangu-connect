-- =====================================================================
-- PHASE 3 — RLS & SECURITY
-- Branch isolation + employee management + privilege-escalation guard.
-- =====================================================================

alter table public.branches enable row level security;

-- ---------- Branches -------------------------------------------------
drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select
  using (company_id = public.current_company_id());

drop policy if exists branches_insert on public.branches;
create policy branches_insert on public.branches
  for insert
  with check (company_id = public.current_company_id() and public.is_company_admin());

drop policy if exists branches_update on public.branches;
create policy branches_update on public.branches
  for update
  using (company_id = public.current_company_id() and public.is_company_admin())
  with check (company_id = public.current_company_id());

drop policy if exists branches_delete on public.branches;
create policy branches_delete on public.branches
  for delete
  using (
    company_id = public.current_company_id()
    and public.is_company_admin()
    and is_hq = false            -- never delete HQ
  );

-- ---------- Profiles: admin management of employees ------------------
-- Admins can update employees within their company (role, branch, active).
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update
  using (
    company_id = public.current_company_id()
    and public.is_company_admin()
  )
  with check (company_id = public.current_company_id());

-- ---------- Privilege-escalation & owner-protection guard -----------
-- Prevents: self-escalation, editing the owner, or assigning super_admin.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor_role public.user_role := public.current_user_role();
  v_owner_id   uuid;
begin
  -- Nobody may set a profile to super_admin via the app.
  if new.role = 'super_admin' and old.role <> 'super_admin' then
    raise exception 'Hairuhusiwi kuweka super_admin';
  end if;

  -- A user cannot elevate their own role.
  if new.id = auth.uid() and new.role <> old.role then
    raise exception 'Huwezi kubadilisha jukumu lako mwenyewe';
  end if;

  -- The company owner cannot be demoted or deactivated by others.
  select owner_id into v_owner_id from public.companies where id = old.company_id;
  if old.id = v_owner_id and new.id <> auth.uid() then
    if new.role <> old.role or new.is_active <> old.is_active then
      raise exception 'Mmiliki wa kampuni hawezi kubadilishwa';
    end if;
  end if;

  -- Branch managers may not create owners.
  if v_actor_role = 'branch_manager' and new.role = 'company_owner' then
    raise exception 'Meneja wa tawi hawezi kuunda mmiliki';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_guard_profile_update on public.profiles;
create trigger trg_guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------- Audit trigger for branch changes ------------------------
create or replace function public.audit_branch_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.audit_logs (company_id, actor_id, action, metadata)
  values (
    coalesce(new.company_id, old.company_id),
    auth.uid(),
    case tg_op
      when 'INSERT' then 'branch.create'
      when 'UPDATE' then 'branch.update'
      else 'branch.delete'
    end,
    jsonb_build_object('branch', coalesce(new.name, old.name))
  );
  return coalesce(new, old);
end;
$fn$;

drop trigger if exists trg_audit_branch on public.branches;
create trigger trg_audit_branch
  after insert or update or delete on public.branches
  for each row execute function public.audit_branch_change();
