# Hotspot Billing — Enterprise Agent

Agent inayosakinishwa kwa mteja, inayounganisha **MikroTik RouterOS** na mfumo wa Hotspot Billing. Ni njia **pekee** ya kuunganisha routers (Direct API imeondolewa).

## Sifa

- **Multi-router** — agent moja inasimamia routers nyingi za kampuni
- **Auto-reconnect** — router/internet ikikatika, inaunganisha upya yenyewe
- **Heartbeat** kila sekunde 30 — dashboard inajua Online/Offline + metrics
- **Encrypted token** — token haihifadhiwi wazi (AES-256-GCM, machine-bound)
- **Command queue** — inapokea amri kutoka server (sync, disconnect, restart, voucher/package)
- **Real-time sync** — inasukuma data ya RouterOS; dashboard inaona papo hapo (Supabase Realtime)
- **Auto-update** (hiari) — inakagua toleo jipya na kuomba restart
- **Logging** — faili za kila siku + rotation
- **Windows Service** (na tayari kwa Linux)

## Mahitaji

- **Node.js 18+** (https://nodejs.org — LTS)
- Kifaa (PC ndogo, Raspberry Pi, au server) kwenye **mtandao ule ule wa router**
- Kwenye RouterOS: washa API — `/ip service enable api`

## Usanidi (.env)

Nakili `.env.example` -> `.env`, weka:

```
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="anon_key_yako"
AGENT_TOKEN="token_kutoka_dashboard"
```

Token unaipata: **Dashboard -> Routers -> Agents -> Tengeneza agent** (inaonyeshwa **mara moja tu**).

> Baada ya kuanzishwa mara ya kwanza, token huhifadhiwa encrypted (`.agent-data/`), hivyo huhitaji kuiweka tena kwenye env.

---

## Njia 3 za kuendesha

### 1. Windows Service (inapendekezwa kwa production)

Njia rahisi — endesha skripti (kama **Administrator**):

```
build\install-windows.bat
```

Au kwa mkono:

```powershell
npm install --omit=dev
npm install node-windows
npm run build
npm run service:install
```

Service **HotspotBillingAgent** itajianzisha yenyewe kila Windows inapowashwa. Angalia kwenye `services.msc`.

Kuondoa: `build\uninstall-windows.bat` (au `npm run service:uninstall`).

### 2. Node.js moja kwa moja (majaribio)

```powershell
npm install
npm run build
npm start
```

### 3. Docker

```bash
docker build -t hotspot-agent .
docker run -d --name hotspot-agent --env-file .env --network host hotspot-agent
```

> `--network host` inasaidia agent kufikia router kwenye LAN.

---

## Kujenga `.exe` (standalone)

Kwenye Windows yenye Node.js:

```powershell
npm install
npm run build:exe
```

`.exe` itapatikana `build\hotspot-agent.exe`. Inaweza kuendeshwa bila Node.js kusakinishwa.

---

## Auto-update (hiari)

Weka kwenye `.env`:

```
UPDATE_MANIFEST_URL="https://server-yako.com/agent/version.json"
UPDATE_INTERVAL=3600000
```

Manifest (mfano `build/version.example.json`):

```json
{ "version": "1.0.1", "url": "https://.../hotspot-agent-1.0.1.exe" }
```

Agent ikigundua toleo jipya, inaomba restart; service manager inaweka toleo jipya.

---

## Variables zote

| Variable | Default | Maelezo |
|----------|---------|---------|
| `SUPABASE_URL` | - | **Lazima** |
| `SUPABASE_ANON_KEY` | - | **Lazima** |
| `AGENT_TOKEN` | - | **Lazima** (mara ya kwanza) |
| `POLL_INTERVAL` | 3000 | ms kati ya poll za commands |
| `HEARTBEAT_INTERVAL` | 30000 | ms kati ya heartbeat |
| `API_TIMEOUT` | 8000 | ms timeout ya RouterOS |
| `LOG_LEVEL` | info | debug/info/warn/error |
| `AGENT_SECRET` | default | Siri ya ziada kwa encryption |
| `UPDATE_MANIFEST_URL` | - | Hiari (auto-update) |

---

## Muundo (modules)

```
agent-core/      Orchestrator + RouterWorker (multi-router lifecycle)
router-api/      RouterOS API client (8728/8729) + auto-reconnect
sync-engine/     collect metrics + all RouterOS data
ws-client/       server transport (poll/heartbeat/sync/ack)
command-handler/ execute server commands
security/        config + encrypted token store
logging/         structured logs + rotation
installer/       Windows Service install/uninstall
updater/         auto-update checker
```

## Usalama

- Token: sha256 hash server-side; encrypted at rest client-side
- Router password: inapokelewa kwa muda wa amri tu; haiandikwi disk
- Outbound-only: agent haifungui port yoyote ya kuingia (CGNAT-safe)
- Mawasiliano yote HTTPS

## Matatizo ya kawaida

- **"AGENT_TOKEN haijawekwa"** -> weka token kwenye `.env` mara ya kwanza
- **"Imeshindwa kuunganisha"** -> hakikisha `/ip service enable api` na firewall inaruhusu port 8728 kwenye LAN
- **Router inaonyesha Offline** -> agent haiendeshi, au haifikii router; angalia `logs/`
