# FIX: Agent crash (UNKNOWNREPLY) baada ya login

## Hali nzuri kwanza
Dashboard imeonyesha **Online + RouterOS 7.20.7** — login + credential fix
zimefanya kazi. Tatizo lililobaki: crash baada ya muda.

## Root cause (sababu 3)

1. **Hakuna global error handler.** `node-routeros` inatoa `UNKNOWNREPLY` kama
   **async event kutoka socket listener** — nje ya try/catch yako. Node
   inafunga process nzima kwa `unhandledRejection`.

2. **`run()` retry haikulindwa.** Write ya pili (baada ya reconnect) haikuwa
   kwenye try/catch — ikitupa error, inatoka nje.

3. **Library keepalive.** `node-routeros` keepalive inatuma probes za mara kwa
   mara zinazoweza kusababisha UNKNOWNREPLY kwenye RouterOS 7.20+.

## Marekebisho (root cause, si workaround)

### 1. Global handlers (`src/index.ts`)
```
process.on('unhandledRejection', ...) -> log + endelea
process.on('uncaughtException', ...)  -> log + endelea
```
Error moja ya async haiwezi tena kufunga agent.

### 2. `run()` thabiti (`src/router-api/connection.ts`)
- Inarekodi **command + params + response** kabla ya kurecover
- Retry moja iliyolindwa (try/catch)
- Inarudisha `[]` badala ya kutupa -> polling loop inaendelea
- `.on('error')` listener kwenye API -> async socket errors zinashikwa
- `runStrict()` mpya kwa connectivity probe (heartbeat inajua offline kweli)

### 3. Keepalive imezimwa + fresh-socket recovery
- `keepalive: false` (chanzo cha UNKNOWNREPLY 7.20+)
- Heartbeat ikishindwa, inafunga socket + kufungua mpya (`failStreak`)
  -> inasafisha stale UNKNOWNREPLY state

### 4. `collectAll` haiachi kwa command moja
- Kila kind inatumia `run()` (inarudisha [] ikishindwa)
- Command moja ikishindwa (UNKNOWNREPLY kwenye print fulani), nyingine
  zinaendelea; router inabaki online

## Ushahidi (tests)

```
npm run test:connection   -> ✅ version read 7.14.2
npm run test:metrics      -> ✅ metrics + command
npm run test:resilience   -> ✅ command failed gracefully ([]), NO crash
```

Test ya resilience: mock inadondosha socket mid-reply (kama UNKNOWNREPLY).
Matokeo: `run()` inarudisha [], process HAIKUFUNGA.

## RouterOS 7.20.7 compatibility
- keepalive imezimwa (7.20-safe)
- fresh-socket recovery kila kushindwa
- per-command isolation (command moja mbaya haiathiri nyingine)

## Mafaili yaliyobadilishwa
1. src/index.ts (global handlers)
2. src/router-api/connection.ts (robust run + error listener + keepalive off)
3. src/agent-core/RouterWorker.ts (fresh-socket recovery, failStreak)
4. src/sync-engine/collect.ts (runStrict probe + per-command isolation)
5. test/test-resilience.mjs (MPYA)

## Deploy
```
cd agent
npm run build
npm start
```
Agent sasa inabaki ONLINE hata command moja ikishindwa. UNKNOWNREPLY
inaandikwa kwenye log (na command husika), agent inaendelea.
