# PHASE 4d — Agent (Programu ya Node.js) — IMEKAMILIKA 100%

Sehemu ya mwisho ya Phase 4. Agent inayosakinishwa kwa mteja, inayofanya kila kitu cha 4a–4c "kifanye kazi" kwa router halisi.

---

## 1. Architecture

Agent ni **project tofauti** (`agent/`) — Node.js pure, si sehemu ya frontend build. Muundo wa mzunguko:

```
loop kila POLL_INTERVAL_MS:
  poll()        -> agent-poll (token auth) -> {router, commands}
  executeBatch  -> unganisha RouterOS (8728) -> tekeleza commands + soma resource
  report()      -> agent-report -> matokeo + status
```

Agent inaunganisha **nje kwenda** (outbound) — CGNAT/NAT-safe. Haifungui port yoyote ya kuingia.

---

## 2. Folder mpya

```
agent/
  src/
    config.ts          soma env (SUPABASE_URL, ANON_KEY, AGENT_TOKEN, intervals)
    logger.ts          logging yenye timestamp
    api/poll.ts        piga agent-poll
    api/report.ts      piga agent-report
    routeros/client.ts wrapper ya node-routeros (TCP 8728)
    routeros/commands.ts  ramani: command catalog -> RouterOS paths
    executor.ts        tekeleza batch + soma status (heartbeat)
    index.ts           main loop + graceful shutdown
  package.json, tsconfig.json, .env.example
  Dockerfile, .dockerignore, ecosystem.config.cjs (PM2)
  README.md            nyaraka za usakinishaji (Node/PM2/Docker)
```

---

## 3. Command mapping (routeros/commands.ts)

Inalingana 1:1 na `commandCatalog` ya frontend:

| Command | RouterOS path |
|---------|---------------|
| identity | /system/identity/print |
| resource | /system/resource/print |
| hotspot.active | /ip/hotspot/active/print |
| hotspot.users | /ip/hotspot/user/print |
| hotspot.profiles | /ip/hotspot/user/profile/print |
| hotspot.kick | /ip/hotspot/active/remove (=.id) |
| pppoe.secrets | /ppp/secret/print |
| pppoe.active | /ppp/active/print |
| pppoe.disconnect | /ppp/active/remove (=.id) |
| ppp.profiles | /ppp/profile/print |
| dhcp.leases | /ip/dhcp-server/lease/print |
| queue.simple | /queue/simple/print |
| firewall.filter | /ip/firewall/filter/print |

Commands nje ya ramani hii zinarudishwa kama "haijulikani" — usalama safu ya pili (frontend + agent).

---

## 4. Usakinishaji (njia 3 — zote kwenye README)

1. **Node.js**: `npm install && npm run build && npm start`
2. **PM2**: `pm2 start ecosystem.config.cjs` (service, autorestart, boot-start)
3. **Docker**: `docker build -t hotspot-agent . && docker run -d ...`

Mteja anaweka `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AGENT_TOKEN` (kutoka dashboard).

---

## 5. Database/API

Hakuna mpya. Agent inatumia Edge Functions za 4b (`agent-poll`, `agent-report`) + `node-routeros` library.

---

## 6. Sababu za maamuzi

- **node-routeros library** — inashughulikia protocol ya binary ya RouterOS API (v6 + v7), login, encoding ya sentences. Kuandika protocol mwenyewe ingekuwa hatari + kazi kubwa.
- **Connection short-lived kwa batch** — kufungua/kufunga kwa kila mzunguko kunazuia stale sockets nyuma ya NAT.
- **Password haiandikwi disk** — inapokelewa kwa muda wa amri tu; ikivuja disk ya agent, hakuna siri.
- **Token badala ya service-key** — ikivuja, inafutwa kutoka dashboard bila kuathiri mfumo mzima.
- **Njia 3 za usakinishaji** — wateja wana mazingira tofauti (PC ndogo, Pi, server yenye Docker).

---

## 7. Duplicated code — HAKUNA

- Command mapping ni chanzo kimoja (`commands.ts`); index/executor zinaitumia.
- api/poll + api/report zinashiriki `config.functionUrl()`.

**Uthibitisho:** agent `tsc --noEmit` ✓ | `tsc` build -> dist/ ✓ | frontend `tsc -b` bado ✓ | File kubwa agent = mistari 67.

---

## 8. PHASE 4 IMEKAMILIKA KABISA

4a (database + CRUD) + 4b (agent protocol + Vault encryption) + 4c (RouterOS operations UI) + 4d (agent) = **MikroTik Integration kamili**.

Mtiririko kamili sasa unafanya kazi:
```
UI (bonyeza "Jaribu" / fungua tab)
  -> enqueue_router_command
  -> agent-poll (agent inapokea)
  -> node-routeros (inaendesha kwenye router halisi)
  -> agent-report (matokeo yanarudi)
  -> UI inaonyesha data
```

### Kupima (na router halisi)
1. Washa API kwenye RouterOS: `/ip service enable api`
2. Dashboard: tengeneza agent, nakili token
3. Endesha agent (Node/PM2/Docker) kwa kifaa kwenye mtandao wa router
4. Dashboard: bonyeza router -> "Jaribu" -> unapaswa kuona kitambulisho
5. Fungua tabs (Hotspot, PPPoE, DHCP) -> data halisi ya router

> **Kumbuka:** Sikuweza kupima na router halisi hapa (hakuna MikroTik).
> Code imethibitishwa kimuundo (compile ✓). Jaribu na router yako.

**Simama hapa. Phase 4 imekamilika. Subiri maelekezo ya Phase 5 (TP-Link).**
