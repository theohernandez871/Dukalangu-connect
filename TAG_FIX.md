# FIX: "Received data on unregistered tag" (race condition)

## Root cause
Agent ilikuwa na loops MBILI zinazokimbia sambamba:
- heartbeatLoop() — inasoma metrics (resource, identity, active)
- pollLoop() — inatekeleza commands + forceSync (inasoma commands nyingi)

Zote zilitumia CONNECTION MOJA (this.conn) ya kila router kwa wakati mmoja.
RouterOS API inatuma majibu kwa "tags" kwenye socket moja. Commands mbili
zikitumwa kwa pamoja, majibu yanachanganyika -> library inapokea tag ya command
isiyosajiliwa -> "Received data on unregistered tag" -> socket error -> timeout
-> router Offline.

## Suluhisho (root cause, layers 2)

### Layer 1: Single loop (chanzo cha concurrency)
Orchestrator sasa ina loop MOJA (`mainLoop`):
1. Poll (kila pollInterval)
2. Tekeleza commands
3. Heartbeat + sync (kwa cadence ya heartbeat, kwa timestamp)

Hakuna tena loops mbili sambamba -> connection ya router haitumiki na
heartbeat + command kwa wakati mmoja.

### Layer 2: Per-connection mutex (multi-router safety)
`connection.ts` sasa ina mutex (`serialize`): kila run()/runStrict() inasubiri
iliyotangulia. Request moja tu inatumia socket kwa wakati mmoja, hata kama
sehemu tofauti za code zitajaribu kuita kwa pamoja.

## Compatibility na fixes zilizopita (bado zipo)
- !empty patch (RouterOS 7.20+)
- keepalive: false
- fresh-socket recovery (heartbeat failStreak)
- per-command isolation (run() -> [])
- unhandledRejection/uncaughtException handlers
- auto-reconnect kwenye run()

## Timeout + reconnect
- API_TIMEOUT 8000ms (per-command; sasa hakuna pile-up kwa sababu ya
  serialization)
- Reconnect salama: run() inajaribu tena baada ya fresh connect
- Socket haifungwi kwa timeout ndogo bila reconnect

## Mafaili yaliyobadilishwa
1. src/agent-core/Orchestrator.ts — loop moja (mainLoop) badala ya mbili
   sambamba; runCommands imetolewa kama method
2. src/router-api/connection.ts — mutex (serialize) kwenye run/runStrict
3. test/test-serialization.mjs (MPYA) — inathibitisha serialization
4. package.json — test:serial, test:all

## Test report
```
test:connection     ✅ version 7.20.7
test:metrics        ✅ metrics + command
test:resilience     ✅ command failed gracefully, no crash
test:empty          ✅ !empty -> [] in ~45ms, no crash
test:serialization  ✅ 20 concurrent calls serialized (max in-flight = 1)
```

## Verification report
- agent tsc --noEmit: 0 errors
- frontend tsc + vite build: OK
- hakuna file > 250 lines
- architecture haijabadilika (multi-router, Supabase transport)
- offline threshold 90s vs heartbeat 30s (margin ya beats 3)

## Deploy
```
cd agent
npm install
npm run build
npm run test:all   # zote ✅
npm start
```
Router itabaki ONLINE muda wote; hakuna tag collision; commands zinatekelezwa
moja baada ya nyingine.
