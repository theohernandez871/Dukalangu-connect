# PHASE 2 — Dashboard (IMEKAMILIKA 100%)

Muendelezo wa Phase 1. Layout ya kudumu + takwimu za msingi. Pointi 8 kama ilivyoagizwa.

---

## 1. Architecture

Phase 2 imeongeza **App Shell** — layout ya kudumu (Sidebar + Topbar) inayotumia React Router `<Outlet />`. Phase zote zijazo (routers, payments, reports...) zitaingia ndani ya shell hii bila kuijenga upya.

Mtiririko wa data unabaki uleule wa Phase 1:
```
Page → hook (TanStack Query) → service → repository → Supabase
```
Dashboard inasoma:
- **Data halisi**: watumiaji (profiles), shughuli (audit_logs)
- **Placeholder (0)**: revenue, routers, online — zitaunganishwa phase husika

**Uamuzi wa data isiyo tayari:** Inaonyesha `0` kwa uwazi + tag "Inakuja". Hakuna demo/mock data ya kudanganya — professional na mwaminifu kwa mtumiaji.

---

## 2. Folders mpya

```
src/
  components/
    layout/    Sidebar, SidebarNav, MobileDrawer, Topbar,
               DashboardLayout, PageHeader, BrandMark
    charts/    chartOptions, AreaChartCard, DonutChartCard, LazyCharts
    ui/        Card, Badge, Skeleton, Avatar, Dropdown  (mpya)
    feedback/  EmptyState, ErrorState                   (mpya)
  features/dashboard/
    components/  StatCard, StatGrid, RevenueChart, SalesChart,
                 RouterStatusWidget, RecentActivity, UserMenu
    constants/   actionLabels
    hooks/       useDashboard
    services/    dashboard.repository, dashboard.service
    types/       dashboard
    pages/       DashboardPage
  hooks/         useSidebar
  utils/         currency (formatTsh, formatCompact, timeAgo)
  constants/     navigation (permission-gated menu)
supabase/migrations/  0003_dashboard.sql
```

---

## 3. Files mpya (muhimu)

| File | Kazi |
|------|------|
| `components/layout/DashboardLayout.tsx` | Shell: Sidebar + Topbar + Outlet |
| `components/layout/SidebarNav.tsx` | Menu moja inayotumika desktop + mobile (hakuna kurudia) |
| `constants/navigation.ts` | Menu items + permission gating + "enabled" flag |
| `components/charts/LazyCharts.tsx` | ApexCharts lazy-loaded (performance) |
| `features/dashboard/services/dashboard.service.ts` | Stats + activity mapping |
| `hooks/useSidebar.ts` | Collapse state (imehifadhiwa) |
| `utils/currency.ts` | TSH formatting + relative time (Kiswahili) |

---

## 4. Database changes

**Migration `0003_dashboard.sql`:**
- `get_dashboard_stats()` — RPC (SECURITY DEFINER, `$fn$`) inayorudisha counts zilizofungwa kwa `company_id` ya mtumiaji. Placeholder metrics zinarudisha 0 hadi phase yao.
- `notifications` table — id, company_id, user_id, title, body, type, is_read
- RLS policies kwa `notifications` (mtumiaji anaona zake + broadcasts za kampuni)

Hakuna mabadiliko kwa tables za Phase 1.

---

## 5. API mpya

**dashboardService:**
- `getStats()` → `DashboardStats` (counts zote)
- `getRecentActivity()` → `ActivityEntry[]` (kutoka audit_logs, na majina ya waliofanya)

Zinapatikana kupitia hooks: `useDashboardStats()`, `useRecentActivity()`.

---

## 6. Sababu za maamuzi ya architecture

- **App Shell mara moja** — layout inajengwa sasa ili phase zote 3–12 ziitumie tu (`<Outlet />`). Hii inazuia kurudia navigation code.
- **SidebarNav moja** kwa desktop + mobile — chanzo kimoja cha ukweli cha menu.
- **ApexCharts lazy-loaded** — ilikuwa inaongeza 840 kB kwenye dashboard chunk. Sasa inapakiwa tu chart inapoonekana. **DashboardPage: 866 kB → 10 kB.**
- **Manual vendor chunks** (react/data/form/chart/motion) — caching bora; mtumiaji akirudi, vendor haziunwdownloadwi upya.
- **RPC kwa stats** (badala ya queries nyingi client-side) — call moja, RLS-safe, na rahisi kupanua phase zijazo.
- **Permission-gated nav** — inatumia `hasPermission()` ya Phase 1; keshia haoni "Ripoti", n.k.

---

## 7. Duplicated code — HAKUNA

- Navigation: `SidebarNav` moja inashirikiwa (desktop Sidebar + MobileDrawer).
- Charts: `baseChartOptions()` moja inashirikiwa na Area + Donut.
- Feedback states: `EmptyState`/`ErrorState`/`Skeleton` reusable kila mahali.
- Stat cards: `StatCard` moja, inaitwa mara 6 kwa props tofauti.

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ (hakuna chunk warning) | `oxlint` = 0 warnings, 0 errors kwenye files 79 | File kubwa = mistari 81.

---

## 8. Uko tayari kwa Phase inayofuata?

**NDIYO.** App Shell ipo; Phase 3 (Company Management) itaongeza tu pages mpya ndani ya `DashboardLayout` na kuwezesha nav items husika (`enabled: true`). Reusable UI (Card, DataTable-ready, Dropdown, EmptyState) ziko tayari.

### Setup mpya
Endesha migration mpya baada ya zile za Phase 1:
```
supabase/migrations/0003_dashboard.sql
```

**Simama hapa. Subiri maelekezo ya kuendelea Phase 3.**
