# PHASE 4b — Agent Protocol + Encryption + Test (IMEKAMILIKA 100%)

Sehemu ya pili ya Phase 4. Transport: **HTTP long-polling**. Encryption: **Supabase Vault**.

---

## 1. Architecture

Agent (kwa mteja) haiwezi kupokea muunganisho wa kuingia (CGNAT). Kwa hivyo:
- Agent inauliza server kila muda (`agent-poll`) — outbound, CGNAT-safe
- Server inarudisha router details + pending commands
- Agent inatekeleza, inarudisha matokeo (`agent-report`)

**Command queue** iko kwenye Postgres (`router_commands`). Client ana-enqueue kupitia function; agent inaipokea; matokeo yanarudi. UI inapoll matokeo (DB row) hadi `done/failed/timeout`.

**Encryption:** nywila za RouterOS zinahifadhiwa kwenye **Supabase Vault** (key iko nje ya data tables). `router_credentials` inahifadhi `secret_id` (rejeleo) tu. `agent-poll` (service-role) pekee ndiyo inayoweza decrypt.

---

## 2. Folders/Files mpya

```
supabase/
  migrations/  0008_router_commands.sql, 0009_commands_rls.sql,
               0010_agent_tokens.sql
  functions/
    _shared/   http.ts, agentAuth.ts
    router-set-credential/index.ts
    agent-poll/index.ts
    agent-report/index.ts
src/features/routers/
  components/  AgentCreateDialog, AgentList, RouterTestButton
  hooks/       useAgents (agents + useRouterCommand polling)
  services/    agent.repository, agent.service
  types/       agent
src/components/ui/  CopyButton (reusable)
```

---

## 3. Database changes

**`0008`:** `supabase_vault` extension; `router_credentials.secret_id`; `router_commands` queue; `set_router_password()` (Vault); `enqueue_router_command()`.
**`0009`:** RLS — client anasoma commands za kampuni; hawezi kuunda/kuandika moja kwa moja (function/agent pekee).
**`0010`:** `pgcrypto`; `create_router_agent()` (raw token mara moja, hash tu huhifadhiwa); `revoke_router_agent()`.

---

## 4. Edge Functions mpya

| Function | Auth | Kazi |
|----------|------|------|
| `router-set-credential` | User JWT | Huhifadhi password kwa Vault (via RPC) |
| `agent-poll` | Agent token | Hutoa router details + decrypted password + pending commands |
| `agent-report` | Agent token | Hupokea matokeo + router status/heartbeat |

---

## 5. API mpya (frontend)

- **agentService**: `list`, `create` (returns raw token once), `revoke`
- **commandService**: `enqueue`, `get`
- **useRouterCommand()**: enqueue + poll hadi matokeo (max 30s)

---

## 6. Sababu za maamuzi

- **Long-polling badala ya WebSocket** — Supabase Edge Functions hazishikilii WS ya kudumu; polling hakuhitaji server ya ziada, hakuna gharama.
- **Vault badala ya env key** — key iko nje ya data; hata mwenye access ya deployment haoni nywila. Bora kuliko kuweka key kwenye function env.
- **Token: hash tu huhifadhiwa** — raw inaonyeshwa mara moja; ikivuja database, hakuna token halisi.
- **Command queue Postgres** — hakuna infra mpya; RLS inalinda; audit rahisi.

---

## 7. Duplicated code — HAKUNA

- AgentList + RouterList = `DataTable` ileile.
- Dialogs = `Dialog` reusable; CopyButton mpya inatumika popote token/siri inanakiliwa.
- Edge Functions zinashiriki `_shared/http.ts` + `_shared/agentAuth.ts`.

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ | `oxlint` = 0/0 (files 130) | File kubwa = 120.

---

## 8. Uko tayari kwa 4c?

**NDIYO.** Njia ya mawasiliano (enqueue -> agent-poll -> execute -> agent-report -> UI) ipo. 4c itaongeza commands halisi za RouterOS (hotspot.list, pppoe.list, dhcp.leases, queues, profiles) + kurasa za kuzionyesha. 4d itajenga agent yenyewe (Node.js) inayotekeleza commands hizi.

### Setup mpya
1. Endesha migrations `0008` -> `0009` -> `0010` (au `all_migrations.sql` v5).
   - Zinawasha `supabase_vault` + `pgcrypto` zenyewe.
2. Deploy functions:
   `supabase functions deploy router-set-credential`
   `supabase functions deploy agent-poll`
   `supabase functions deploy agent-report`

**Simama hapa. Subiri maelekezo ya kuendelea 4c.**
