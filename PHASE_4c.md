# PHASE 4c — RouterOS Operations (IMEKAMILIKA 100%)

Sehemu ya tatu ya Phase 4. Kusoma/kusimamia data halisi ya RouterOS kupitia command queue ya 4b.

---

## 1. Architecture

4c ni hasa **frontend** — queue + agent protocol vipo tayari (4b). Kila operesheni:
`UI -> enqueue_router_command -> queue -> agent-poll -> RouterOS -> agent-report -> UI polls result`.

**Msingi wa 4c:** hook moja reusable **`useRouterQuery`** (enqueue + poll, API kama useQuery) + component moja **`RouterDataView`** (query + states + DataTable). Kila tab (hotspot, pppoe, dhcp, queues, firewall, profiles) inaitumia — hivyo kuongeza operesheni mpya = component ndogo (~25 mistari).

**Command whitelist:** `commandCatalog.ts` inaruhusu commands 13 tu. Command yoyote nje ya orodha inakataliwa client-side — huwezi kutuma amri ghafi kwa router.

---

## 2. Folders/Files mpya

```
src/features/routers/
  constants/  commandCatalog (whitelist + labels + mutating flag)
  hooks/      useRouterQuery (reusable read), useRouterAction (kick/disconnect)
  types/      routeros (resource, hotspot, ppp, dhcp, queue, firewall)
  components/ RouterDataView, PendingAgentState, RouterOverview,
              HotspotTab (+Active/+Users), PppoeTab, DhcpTab,
              QueuesTab, FirewallTab, ProfilesTab
  pages/      RouterDetailPage
```

---

## 3. Files muhimu

| File | Kazi |
|------|------|
| `hooks/useRouterQuery.ts` | Enqueue read command + poll hadi matokeo; API kama useQuery |
| `components/RouterDataView.tsx` | Query + loading/pending/error + DataTable — reusable kwa kila tab |
| `pages/RouterDetailPage.tsx` | Tabs 7: Muhtasari, Hotspot, PPPoE, DHCP, Queues, Firewall, Profiles |
| `constants/commandCatalog.ts` | Whitelist ya commands (usalama) |

---

## 4. Database changes

**HAKUNA.** Command queue (`router_commands`) + RPC (`enqueue_router_command`) vipo tangu 4b. 4c inatumia miundombinu iliyopo.

---

## 5. Operations zilizojengwa

- **Hotspot**: active sessions (+kick), watumiaji wote, profiles
- **PPPoE**: active (+disconnect), akaunti (secrets)
- **DHCP**: leases
- **Queues**: simple queues
- **Firewall**: filter rules (view-only kwa usalama)

Mutating (kick, disconnect) zinahitaji `router:manage` + zinapita `useRouterAction`.

---

## 6. Sababu za maamuzi

- **useRouterQuery + RouterDataView reusable** — bila hivi, kila operesheni ingehitaji enqueue/poll/state logic yake (kurudia mara 6+). Sasa ni component ndogo kwa kila moja.
- **Command whitelist** — kuzuia arbitrary commands kwa router ni usalama muhimu; UI haiwezi kutuma kitu kisicho kwenye catalog.
- **Firewall view-only** — kuhariri firewall kwa mbali ni hatari (unaweza kujifungia nje ya router). Kusoma tu ni salama.
- **Router detail page (si kurasa tofauti)** — operations zote za router moja ziko mahali pamoja; rahisi kuvinjari.
- **"Pending agent" state** — kama agent haijaunganishwa, UI inaeleza wazi badala ya kukwama.

---

## 7. Duplicated code — HAKUNA

- Tabs zote za RouterOS = `RouterDataView` moja.
- Kick + disconnect = `useRouterAction` moja + `DeleteConfirmDialog` ileile.
- States (loading/pending/error) = reusable components.

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ | `oxlint` = 0/0 (files 146) | File kubwa = 120.

---

## 8. Uko tayari kwa 4d?

**NDIYO.** UI kamili ya kusoma/kusimamia RouterOS ipo; inatuma commands kwenye queue. Kinachokosekana ni **agent yenyewe** (4d) — programu ya Node.js itakayosakinishwa kwa mteja, ita-poll `agent-poll`, itaendesha commands kwenye RouterOS (via API 8728/8729), na kurudisha via `agent-report`. Command catalog tayari inafafanua kila command agent itakayotekeleza.

### Setup
Hakuna migration/function mpya 4c. Endesha zilizopita kama bado. UI itaonyesha "Inasubiri agent" hadi 4d ijengwe na agent iunganishwe.

**Simama hapa. Subiri maelekezo ya kuendelea 4d.**
