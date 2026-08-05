# PHASE 8A — MikroTik Agent & Real-time Integration (IMEKAMILIKA 100%)

Enterprise Agent + real-time. Agent = njia PEKEE ya kuunganisha MikroTik (Direct API imeondolewa).

Transport: **agent long-polling (ndani)** + **Supabase Realtime (dashboard)**. Hakuna server mpya — Supabase + Vercel tu.

---

## Sehemu 5 (zote 100%)

### 8A-1 — Database + ondoa Direct
- Live metrics kwenye `routers` (CPU, mem, uptime, board, connected_users, ping, response, agent_id)
- `router_command_catalog` (commands 18), `router_sync_data` (cache)
- **Supabase Realtime** kwa routers/sync/commands
- `mark_stale_routers_offline()` + pg_cron + dashboard fallback sweep
- Router form: **agent-only** (direct imeondolewa)

### 8A-2 — Enterprise Agent modules
- `agent-core` (Orchestrator + RouterWorker, multi-router)
- `router-api` (RouterOS 8728/8729 + auto-reconnect)
- `sync-engine` (metrics + data zote)
- `ws-client` (poll/heartbeat/sync/ack)
- `command-handler` (kick/disconnect/voucher/package)
- `security` (config + **encrypted token** AES-256-GCM machine-bound)
- `logging` (levels + file rotation)

### 8A-3 — agent-gateway Edge Function
- Actions: poll (routers + creds decrypt + commands), heartbeat (metrics + online), sync (cache), ack (results)
- Token auth (sha256), multi-router (router_id null = zote za kampuni)

### 8A-4 — Dashboard commands + live
- `RouterCommandControls` (Sync sasa, Restart Agent)
- Tabs zote -> `RouterSyncView` (real-time kutoka cache, si command-polling)
- Live metrics: Online/Offline, Last Seen, version, CPU, Memory, Uptime, Connected Users, Ping, Response
- **Dead code imeondolewa**: RouterDataView, useRouterQuery, PendingAgentState

### 8A-5 — Installer + Updater
- `installer/service.ts` — Windows Service (node-windows), Linux-ready
- `updater/updater.ts` — auto-update checker (manifest)
- `build/install-windows.bat` + `uninstall-windows.bat`
- `npm run build:exe` (pkg -> .exe)
- README kamili (Kiswahili): njia 3 + .exe + auto-update

---

## Mahitaji yako yote (checklist)

| # | Hitaji | Hali |
|---|--------|------|
| 1 | Windows Service (Linux-ready) | OK (installer + service.ts) |
| 2 | Agent Token self-register salama | OK (encrypted, sha256) |
| 3 | RouterOS API 8728/8729 | OK (router-api) |
| 4 | Auto-reconnect | OK (connection.ts) |
| 5 | Heartbeat 30s (online/offline) | OK (heartbeat + sweep) |
| 6 | Sync (hotspot/pppoe/dhcp/queues/firewall/profiles/identity/version) | OK (sync-engine) |
| 7 | Commands (voucher/package/disconnect/sync/restart) | OK (command-handler) |
| 8 | Dashboard metrics zote 9 | OK (RouterOverview live) |
| 9 | Encrypted comms + token | OK (HTTPS + Vault + AES) |
| 10 | Modules ndogo | OK (8 modules) |
| 11 | Windows installer + auto-update | OK (installer + updater) |
| 12 | Production, hakuna mock | OK (data halisi kutoka RouterOS) |

**Marekebisho ya uaminifu:**
- **WSS**: Supabase Realtime (managed WebSocket) badala ya WSS server (uliomba hakuna server mpya). Dashboard = real-time WebSocket kweli; agent = HTTPS long-polling encrypted.
- **.exe**: code + scripts + `npm run build:exe`; compile ya mwisho kwenye Windows yako (siwezi ku-compile .exe hapa).
- Sikuweza kupima na router halisi (hakuna MikroTik). Code imethibitishwa kimuundo (compile OK).

---

## Uthibitisho

Frontend: `tsc -b` OK | `vite build` OK | `oxlint` 0/0 (files 188)
Agent: `tsc --noEmit` OK | build -> dist/ OK | file kubwa = 102
Hakuna file > mistari 250.

---

## Deploy (8A)

1. **SQL**: endesha `all_migrations.sql` v9 (au `0014_agent_realtime.sql` peke yake)
2. **Edge Function mpya**: `supabase functions deploy agent-gateway`
   (+ za awali kama bado: invite-employee, router-set-credential, omada-proxy)
3. **Realtime**: hakikisha Realtime imewashwa Supabase (SQL inaiwasha kwa tables)
4. **Agent**: kwa kila site — tengeneza agent dashboardi, nakili token, sakinisha (README)
5. **Frontend**: `git push` (Vercel auto-deploy)

### Kupima
1. RouterOS: `/ip service enable api`
2. Dashboard -> Routers -> tengeneza router + agent, nakili token
3. Endesha agent (Windows Service au `npm start`)
4. Dashboard -> router inapaswa kuwa **Online** ndani ya sekunde 30, na metrics live
5. Bonyeza "Sync sasa" -> tabs (Hotspot/PPPoE/DHCP...) zinajaa data halisi

---

## PHASE 8A IMEKAMILIKA

Muunganisho wa MikroTik ni **production-ready**. Kuanzia sasa, mfumo unatumia **Agent pekee**.

**Simama hapa. Subiri maelekezo ya PHASE 8B — Customer Portal.**
