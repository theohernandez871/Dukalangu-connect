# PHASE 5 — TP-Link Omada Integration (IMEKAMILIKA 100%)

Muunganisho wa Omada. Hybrid: **cloud** (Edge Function proxy) au **local** (agent, tayari kimuundo).

---

## 1. Architecture

Tofauti na MikroTik (kila kifaa huru), Omada ina **Controller** kimoja kinachosimamia APs/switches/gateways. Tunaunganisha na Controller, si kila AP.

Omada Controller ina **REST API ya HTTPS** — hivyo kwa controller za cloud/public, tunaweza kufikia moja kwa moja kupitia **Edge Function** (`omada-proxy`) bila agent. Kwa controller za ndani (CGNAT), muundo unakubali `connection_type = 'local'` (agent itapanuliwa baadaye).

Mtiririko (cloud): `UI -> omada-proxy (login + API) -> Omada Controller -> data -> UI`.

---

## 2. Folders/Files mpya

```
src/features/omada/
  components/  OmadaStatusBadge, OmadaFormDialog, OmadaList,
               OmadaDataView, DevicesTab, ClientsTab
  hooks/       useOmada (controllers CRUD + useOmadaData)
  services/    omada.repository, omada.service
  schemas/     omada.schema
  types/       omada
  pages/       OmadaControllersPage, OmadaDetailPage
supabase/
  migrations/  0011_omada.sql
  functions/
    _shared/omadaClient.ts   (login + API + command mapping)
    omada-proxy/index.ts
```

---

## 3. Database changes

**`0011_omada.sql`:**
- Enum `omada_connection_type` (cloud/local)
- `omada_controllers` (base_url, omadac_id, site_id, username, status)
- `omada_credentials` (Vault secret_id — siri, hakuna RLS ya client)
- `set_omada_password()` (Vault), touch + audit triggers, RLS kamili

Inatumia tena `router_status` enum + `touch_router_updated()` ya Phase 4 (hakuna kurudia).

---

## 4. Edge Function + operations

**`omada-proxy`** — inathibitisha caller (RLS ownership), ina-decrypt password (Vault), inaita Omada API. Commands (whitelist): `omada.devices`, `omada.aps`, `omada.clients`, `omada.status`.

Omada API flow ndani ya `_shared/omadaClient.ts`: login -> Csrf-Token + cookie -> site-scoped GET.

---

## 5. API mpya (frontend)

- **omadaService**: `list`, `getById`, `create`, `update`, `remove`, `runCommand`
- Hooks: `useControllers`, `useController`, `useControllerMutations`, `useOmadaData`

UI: Discover Devices, Access Points (filtered), Clients + Signal strength (rangi kwa nguvu ya signal), Device Status.

---

## 6. Sababu za maamuzi

- **Edge Function kwa cloud, si agent** — Omada API ni HTTPS; Edge Function inaweza kuifikia moja kwa moja (tofauti na RouterOS TCP). Rahisi + haraka.
- **Hybrid (cloud/local)** — soko lina mchanganyiko; muundo unakubali zote bila kuvunja.
- **Vault reuse** — encryption ileile ya Phase 4b; hakuna mfumo mpya wa siri.
- **OmadaDataView reusable** — kama RouterDataView; kila tab (devices/aps/clients) ni component ndogo.
- **Reuse ya router_status + touch trigger** — hakuna kurudia database objects.

---

## 7. Duplicated code — HAKUNA

- Tabs zote za Omada = `OmadaDataView` moja.
- DataTable/Dialog/Select/Vault/status enum zote ni reuse ya phase zilizopita.
- Status badge inafuata mtindo uleule wa RouterStatusBadge (component tofauti kwa type-safety ya OmadaStatus).

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ | `oxlint` = 0/0 (files 159) | File kubwa = 120.

---

## 8. Uko tayari kwa Phase 6?

**NDIYO.** Muunganisho wa network (MikroTik + TP-Link) umekamilika. Phase 6 (Package Management) itajenga vifurushi (unlimited, time/data/speed-based, night, weekend, monthly, custom) ambavyo baadaye vitaunganishwa na hotspot/vouchers.

### Setup mpya
1. Endesha migration `0011_omada.sql` (au `all_migrations.sql` v6).
2. Deploy function: `supabase functions deploy omada-proxy`
3. Kwenye Omada Controller, pata `omadacId` (kwenye URL ya controller) + site id + tengeneza user wa API.

**Simama hapa. Subiri maelekezo ya kuendelea Phase 6.**
