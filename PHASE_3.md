# PHASE 3 — Company Management (IMEKAMILIKA 100%)

Matawi, wafanyakazi, ruhusa, na kumbukumbu. Pointi 8 kama ilivyoagizwa.

---

## 1. Architecture

Phase 3 imeongeza features 3 mpya (`companies`, `employees`, `activity`) zote ndani ya App Shell ya Phase 2. Kila moja inafuata layer pattern ileile: `page → hook → service → repository → Supabase`.

**Uamuzi mkuu:** kila mfanyakazi LAZIMA awe kwenye tawi. Kila kampuni inapata tawi la **"Makao Makuu" (HQ)** otomatiki wakati wa signup. Invite ya mfanyakazi inafanyika kupitia **Edge Function** salama (service-role haiwezi kukaa upande wa client).

---

## 2. Folders mpya

```
src/
  components/
    ui/       Dialog, Select, Switch, Tabs               (reusable mpya)
    data/     DataTable, Pagination, dataTable.types      (reusable mpya)
    feedback/ DeleteConfirmDialog                          (reusable mpya)
  constants/  actionLabels (imehamishwa hapa — shared)
  features/
    companies/  components/ (CompanyProfileForm, BranchList,
                BranchFormDialog) + hooks + services + schemas +
                types + pages/CompanyPage
    employees/  components/ (EmployeeTable, InviteEmployeeDialog,
                EmployeeRoleBadge, EmployeeActionsMenu) + hooks +
                services + schemas + types +
                pages/ (EmployeesPage, PermissionsPage)
    activity/   components/ (ActivityFilters) + hooks +
                services + types + pages/ActivityPage
supabase/
  migrations/  0004_branches.sql, 0005_company_rls.sql
  functions/   invite-employee/index.ts   (Edge Function)
```

---

## 3. Files mpya (muhimu)

| File | Kazi |
|------|------|
| `components/data/DataTable.tsx` | Jedwali reusable (sort, loading/empty/error) — backbone ya phase zote |
| `components/ui/Dialog.tsx` | Modal reusable (Framer Motion, esc-to-close) |
| `supabase/functions/invite-employee/index.ts` | Invite salama: huthibitisha admin, huzuia cross-tenant |
| `features/employees/services/employee.service.ts` | List/invite/role/branch/active |
| `features/activity/hooks/useActivityLogs.ts` | Pagination + filter state |

---

## 4. Database changes

**`0004_branches.sql`:**
- `branches` table (company_id, name, location, phone, manager_id, is_hq, is_active)
- `profiles.branch_id` (FK mpya)
- Helpers: `current_user_role()`, `is_company_admin()`
- **Trigger iliyoandikwa upya** `handle_new_user()`: hutambua invited employee (metadata `invited_company_id/branch_id/role`) vs fresh owner; huunda HQ branch otomatiki

**`0005_company_rls.sql`:**
- RLS kamili kwa `branches` (select/insert/update/delete, HQ hailindwi kufutwa)
- Policy `profiles_admin_update` (admin husimamia wafanyakazi wa kampuni)
- **`guard_profile_update()` trigger** — privilege-escalation guard
- `audit_branch_change()` trigger

---

## 5. API mpya

- **companyService**: `get`, `update`
- **branchService**: `list`, `create`, `update`, `remove`
- **employeeService**: `list`, `invite` (Edge Function), `updateRole`, `updateBranch`, `setActive`
- **activityService**: `list` (paginated + filter)
- **Edge Function** `invite-employee` (POST)

---

## 6. Sababu za maamuzi ya architecture

- **DataTable moja reusable** — badala ya kujenga jedwali kila feature. Companies, employees, activity zote zinaitumia; pia packages/vouchers/payments zijazo.
- **Edge Function kwa invite** — `inviteUserByEmail` inahitaji service-role. Kuiweka client ingekuwa hatari kubwa ya usalama. Function inathibitisha caller + branch ownership kabla ya kualika.
- **HQ branch otomatiki** — inatimiza sheria "kila mfanyakazi ana tawi" bila kumlazimu owner kuunda tawi kwanza.
- **guard_profile_update trigger** — usalama wa role haupaswi kutegemea UI pekee; database inazuia escalation hata kama mtu atapita API moja kwa moja.
- **actionLabels shared** (`constants/`) — dashboard + activity zinaitumia; hakuna cross-feature import.

---

## 7. Duplicated code — HAKUNA

- Jedwali zote (branches, employees, activity) = `DataTable` moja.
- Modals zote = `Dialog` moja; kufuta = `DeleteConfirmDialog` moja.
- Role labels/tones = `EmployeeRoleBadge` moja (inatumika employees + permissions).
- Actor-name resolution logic inashirikiwa kimtindo kati ya dashboard + activity services.

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ | `oxlint` = 0 warnings, 0 errors (files 113) | File kubwa = mistari 120.

---

## 8. Uko tayari kwa Phase inayofuata?

**NDIYO.** Muundo wa multi-branch upo; DataTable/Dialog/Select/Switch/Tabs reusable ziko tayari kwa Phase 4 (Routers). Nav items za Phase 3 zimewezeshwa; za Phase 4+ bado "Inakuja".

### Setup mpya
1. Endesha migrations mpya kwa mpangilio:
   `0004_branches.sql` → `0005_company_rls.sql`
2. Deploy Edge Function:
   `supabase functions deploy invite-employee`
3. Weka secrets (Supabase auto-injects SUPABASE_URL/ANON/SERVICE_ROLE kwa Edge Functions).
4. Washa "Invite" template kwenye Supabase Auth (Email → Invite user).

**Simama hapa. Subiri maelekezo ya kuendelea Phase 4.**
