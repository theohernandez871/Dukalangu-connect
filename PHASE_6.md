# PHASE 6 — Package Management (IMEKAMILIKA 100%)

Vifurushi vya WiFi. Muundo: **table moja inayobadilika** (Chaguo B) — aina 8 zote kwenye schema moja.

---

## 1. Architecture

Table moja `packages` yenye `type` + fields zinazohusika (NULL kama hazitumiki). Vouchers/portal/payments/reports zote zitajua kitu kimoja: "package" — hakuna if/else ya aina 8.

**Validation ya safu mbili:**
- Frontend: Zod `superRefine` (kwa kila type, field ipi inahitajika)
- Database: CHECK constraints (time->duration, data->limit, speed->rate)

**Dynamic form:** `packageMeta.ts` inafafanua fields zipi kwa kila type; `PackageDynamicFields` inaonyesha zinazohusika tu.

---

## 2. Folders/Files mpya

```
src/features/packages/
  constants/  packageMeta (labels, tone, fields per type)
  utils/      format (duration, data, speed formatters)
  components/ PackageTypeBadge, PackageDynamicFields, PackageFormDialog,
              PackageCard (grid), PackageList (table)
  hooks/      usePackages
  services/   package.repository, package.service
  schemas/    package.schema
  types/      package
  pages/      PackagesPage (table/grid toggle)
supabase/migrations/  0012_packages.sql
```

---

## 3. Database changes

**`0012_packages.sql`:** enums `package_type` (8) + `duration_unit`; table `packages` (type, price, duration, data_limit_mb, speed caps, time_window JSONB, **router_profile**, sort_order); CHECK constraints per type; RLS (sales_agent create/update, owner/manager delete); audit + touch triggers.

Aina: unlimited, time, data, speed, night, weekend, monthly, custom.

---

## 4. API mpya

- **packageService**: `list`, `create`, `update`, `setActive`, `remove`
- Hooks: `usePackages`, `usePackageMutations`

---

## 5. UI

- **Table view**: jina, aina, bei, muda, data, toggle ya "hai" (Switch)
- **Grid view**: PackageCard (bei kubwa, muda/data/speed, tayari kwa portal Phase 8)
- Form yenye **dynamic fields** kulingana na type iliyochaguliwa
- `router_profile` field kwa kila kifurushi (activation Phase 8/9)

---

## 6. Sababu za maamuzi

- **Chaguo B (flexible)** — vouchers/payments/portal/reports zote zinajua "package" moja; kuongeza aina = enum tu, hakuna table/query mpya.
- **router_profile sasa** — tayari kwa activation bila migration ya baadaye.
- **CHECK + Zod (safu mbili)** — validation database-level + client-level; usalama wa data.
- **Dynamic form via metadata** — fields hujionyesha kwa type; hakuna form 8 tofauti.

---

## 7. Duplicated code — HAKUNA

- Table + grid zinatumia data/hooks zilezile.
- Dynamic fields = component moja inayoendeshwa na metadata.
- DataTable/Dialog/Select/Switch/Badge zote reuse.

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ | `oxlint` = 0/0 (files 172) | File kubwa = 120.

---

## 8. Uko tayari kwa Phase 7?

**NDIYO.** Vifurushi vipo; muundo tayari kwa vouchers (Phase 7 - generate voucher kwa package), portal (Phase 8), payments (Phase 9 - nunua package). `router_profile` tayari kwa activation.

### Setup mpya
Endesha `0012_packages.sql` (au `all_migrations.sql` v7). Hakuna Edge Function mpya.

**Simama hapa. Subiri maelekezo ya kuendelea Phase 7.**
