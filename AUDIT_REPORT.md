# CODE AUDIT — MikroTik Agent & Router Connectivity

Ukaguzi wa mfumo mzima, ukilenga chanzo halisi cha "Haijulikani".

---

## 1. ORODHA YA MATATIZO YALIYOPATIKANA

| # | Tatizo | Uzito | Hali |
|---|--------|-------|------|
| 1 | `tsconfig.json`: `moduleResolution: "node"` (deprecated TS 5.5+) → build inashindwa | **KUBWA** | Imerekebishwa |
| 2 | Build ikishindwa → `dist/index.js` haiundwi → `npm start` inashindwa | **KUBWA** | Imerekebishwa (chanzo #1) |
| 3 | Table `router_logs` haipo (ulitaka logs ziandikwe hapo) | Wastani | Imetengenezwa |
| 4 | Agent haikuwa na uonekano dashboardi (logs terminal tu) | Wastani | Imeongezwa |
| 5 | Router form haikuuliza IP (host) — 8A-1 iliondoa kimakosa | KUBWA | Imerekebishwa (audit iliyopita) |

**Chanzo kikuu (root cause):** Tatizo #1. Kila kitu kingine ("agent haiendeshwi", "command haichukuliwi", "Haijulikani") ni **matokeo** ya build kushindwa. Agent haikuwahi kujengwa kwa mafanikio kwenye mazingira yako.

---

## 2. KWA NINI KILA TATIZO LILITOKEA

### #1 — moduleResolution "node"
TypeScript 5.5+ ime-**deprecate** `"node"` (classic resolution). Agent inatumia ESM (`"module": "ESNext"`) na imports za `.js`. Mchanganyiko wa `ESNext` + `node` ni batili kwa TS mpya → build inatoa error, inasimama. Suluhisho: `"NodeNext"` (inaendana na ESM + `.js` imports).

### #2 — dist/index.js haipo
`npm start` inaendesha `node dist/index.js`. Kama `tsc` (build) imeshindwa kwa sababu ya #1, `dist/` haiundwi. Hivyo `Cannot find module dist/index.js`. Si bug ya agent — ni build system.

### #3 — router_logs haipo
Migration za awali hazikuwa na `router_logs`. Kulikuwa na `router_status_history` (karibu), lakini si logs za maandishi za agent.

### #4 — uonekano dashboardi
Logger ya agent iliandika terminal + faili tu. Hakukuwa na njia ya admin kuona logs za agent kutoka dashboardi.

### #5 — host haikuulizwa
8A-1 ilipoondoa "direct" connection, iliondoa pia input ya host kimakosa. Router ziliundwa na `host=''` → agent haiwezi kujua IP ya router.

---

## 3. MAFAILI YALIYOREKEBISHWA / KUONGEZWA

### Agent (build system — chanzo)
- `agent/tsconfig.json` — `moduleResolution`/`module` → **NodeNext** (fix #1, #2)

### Agent (logging → dashboard)
- `agent/src/logging/logger.ts` — remote sink (inatuma logs server)
- `agent/src/ws-client/client.ts` — `queueLog` + `flushLogs` + poll error log
- `agent/src/agent-core/Orchestrator.ts` — set remote sink + flush + poll/command/worker logs
- `agent/src/router-api/connection.ts` — connect attempt + failure logs

### Database
- `supabase/migrations/0016_router_logs.sql` — table `router_logs` + RLS + Realtime + prune (fix #3)

### Edge Function
- `supabase/functions/agent-gateway/index.ts` — action `log`
- `supabase/functions/_shared/agentGateway.ts` — `handleLog`

### Frontend (host fix + logs viewer + diagnostics)
- `src/features/routers/components/RouterFormDialog.tsx` — host + port fields (fix #5)
- `src/features/routers/schemas/router.schema.ts` — host required
- `src/features/routers/hooks/useRouterLogs.ts` — logs realtime (mpya)
- `src/features/routers/components/RouterLogsTab.tsx` — logs viewer (mpya)
- `src/features/routers/pages/RouterDetailPage.tsx` — Logs tab
- `src/features/routers/hooks/useAgents.ts` — test button: active-agent pre-check + clear timeout messages
- `src/features/routers/services/agent.service.ts` + `agent.repository.ts` — countActiveAgents
- `src/features/routers/components/RouterTestButton.tsx` — phase display + no infinite spinner

---

## 4. CODE YA MAREKEBISHO (muhimu)

### tsconfig.json (CHANZO)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["src"]
}
```

(Code nyingine yote imo kwenye ZIP; imethibitishwa `tsc` + build + runtime.)

---

## 5. HATUA ZA KU-RUN (npm install → agent ONLINE → router CONNECTED)

### A. Server-side (mara moja)
```bash
# 1. SQL
# Bandika all_migrations.sql (v11) -> Supabase SQL Editor -> Run

# 2. Edge Functions
supabase functions deploy agent-gateway
supabase functions deploy router-set-credential
```

### B. Dashboard (mara moja)
```
1. Routers -> Ongeza router:
     IP ya router (LAN): 192.168.88.1
     API Port: 8728
     Username: admin
     Password: <ya RouterOS>
2. Routers -> Agents -> Tengeneza agent -> NAKILI TOKEN
```

### C. RouterOS (mara moja)
```
/ip service enable api
/ip service set api port=8728
```

### D. Agent (kwenye kifaa cha LAN)
```bash
cd agent
npm install
npm run build        # SASA inafanya kazi (dist/ inaundwa)
# tengeneza .env:
#   SUPABASE_URL=...
#   SUPABASE_ANON_KEY=...
#   AGENT_TOKEN=<token>
npm start
```

### E. Thibitisha
- Terminal ya agent: `Imeunganishwa: ... (192.168.88.1:8728)`
- Dashboard -> router -> **Online** ndani ya sekunde 30 + RouterOS version
- Tab mpya ya **Logs** -> unaona kila hatua ya agent LIVE
- Bonyeza "Jaribu" -> matokeo halisi (si "Haijulikani")

---

## Ukweli wa mwisho

Chanzo kilikuwa **build system** (tsconfig), si agent logic wala architecture. Agent ilikuwa imeandikwa vizuri lakini haikuweza kujengwa kwa TS yako. Baada ya fix ya `NodeNext`:
- `npm run build` inafanya kazi (imethibitishwa: dist/ 14 modules)
- `npm start` inafanya kazi (imethibitishwa: runtime inaanza, config validation OK)
- Sasa una **Logs tab** ya kuona kila kitu agent inafanya, live, dashboardi

Sikuweza kupima na MikroTik halisi (hakuna router hapa). Ukiendesha na ukapata error ya RouterOS API, itaonekana kwenye Logs tab + terminal — niletee, nitakusaidia.
