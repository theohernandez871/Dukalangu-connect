# PHASE 4a — Routers: Database + CRUD (IMEKAMILIKA 100%)

Sehemu ya kwanza ya Phase 4 (MikroTik). Muundo wa muunganisho: **Agent** (inafanya kazi hata CGNAT/NAT), tayari kwa Hybrid.

---

## 1. Architecture

Phase 4 imegawanywa katika sehemu ndogo 4:
- **4a (HII)**: Database + Router CRUD kwenye UI (bila muunganisho halisi)
- **4b**: Agent protocol + encryption + Router Test/Status
- **4c**: RouterOS operations (hotspot, PPPoE, DHCP, queues)
- **4d**: Agent yenyewe (programu ya mteja) + nyaraka

**Uamuzi mkuu wa muunganisho:** Agent. Sababu — router nyingi Tanzania ziko CGNAT (hazina public IP). Agent inaunganisha *nje kwenda* kwa server (outbound), hivyo NAT/CGNAT haizuii. Muundo pia unaruhusu `direct` (public IP) kwa siku zijazo bila kuvunja kitu.

**Usalama wa credentials:** nywila ya RouterOS HAIHIFADHIWI kwenye `routers` table. Ipo kwenye table tofauti `router_credentials` ambayo **haina RLS policy ya SELECT** — hivyo browser hauwezi kabisa kuisoma. Edge Function (service-role) pekee ndiyo inayoisimamia. Encryption halisi inakuja 4b.

---

## 2. Folders mpya

```
src/features/routers/
  components/  RouterStatusBadge, RouterFormDialog, RouterList
  hooks/       useRouters
  services/    router.repository, router.service
  schemas/     router.schema
  types/       router
  pages/       RoutersPage
supabase/migrations/  0006_routers.sql, 0007_routers_rls.sql
```

---

## 3. Files mpya (muhimu)

| File | Kazi |
|------|------|
| `services/router.repository.ts` | CRUD; password huenda Edge Function, si DB moja kwa moja |
| `components/RouterFormDialog.tsx` | Fomu ya agent/direct; fields za direct hujionyesha kwa masharti |
| `components/RouterStatusBadge.tsx` | Hali (online/offline/error/unknown) na dot ya rangi |

---

## 4. Database changes

**`0006_routers.sql`:**
- Enums: `router_connection_type` (agent/direct), `router_status`
- `routers` — jina, connection_type, host, api_port, username, status, os_version, last_seen, branch_id
- `router_credentials` — table ya SIRI (password_enc); tofauti kimakusudi
- `router_agents` — agent kwa kila site (token_hash, last_ping)
- `router_status_history` — uptime tracking (cpu, mem)
- Triggers: touch updated_at + audit

**`0007_routers_rls.sql`:**
- RLS kamili kwa routers/agents/history (isolation kwa company_id)
- `router_credentials`: **hakuna policy ya SELECT** — client amezuiwa kabisa

---

## 5. API mpya

- **routerService**: `list`, `create`, `update`, `remove`
- `router.repository.setPassword()` — huita Edge Function `router-set-credential` (itajengwa 4b)

---

## 6. Sababu za maamuzi

- **Agent badala ya Direct** — soko la Tanzania ni CGNAT; direct pekee ingepoteza wateja wengi.
- **Credentials table tofauti** — kutenganisha siri na data ya kawaida kunaruhusu RLS kuzuia siri 100% bila kuathiri usomaji wa router info.
- **Password huenda Edge Function** — client haipaswi kamwe kushika njia ya encryption; server pekee.
- **status_history table** — msingi wa uptime reports (Phase 10) tangu sasa.

---

## 7. Duplicated code — HAKUNA

- RouterList inatumia `DataTable` ileile ya Phase 3.
- Form inatumia Dialog/Input/Select/PasswordInput reusable.
- Delete inatumia `DeleteConfirmDialog` ileile.

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ | `oxlint` = 0 warnings, 0 errors (files 122) | File kubwa = mistari 120.

---

## 8. Uko tayari kwa 4b?

**NDIYO.** Muundo wa database (routers + credentials + agents) upo; UI ya CRUD inafanya kazi. 4b itaongeza: Edge Function `router-set-credential` (encryption), agent WebSocket/polling protocol, agent token management, na Router Test/Status halisi.

### Setup mpya
Endesha migrations mpya baada ya zilizopita:
`0006_routers.sql` -> `0007_routers_rls.sql`
(au tumia `all_migrations.sql` v4 iliyosasishwa).

**Simama hapa. Subiri maelekezo ya kuendelea 4b.**
