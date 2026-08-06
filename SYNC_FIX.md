# FIX: sync.all + !empty crash (RouterOS 7.20.7)

## Bugs mbili halisi (zote zimetatuliwa)

### Bug 1: "Command haijulikani: sync.all"
`sync.all` haikuwepo kwenye handler switch wala si "read command", hivyo
iliishia `default -> throw`. RouterWorker ilikuwa inaita `handleCommand(sync.all)`
KWANZA (unknown) KISHA `forceSync()`.

**Fix:** `handler.ts` sasa inatambua `sync.all` (control command) -> inarudisha
`{triggered:true}, ok:true`. RouterWorker inaendelea kuita `forceSync()`.

### Bug 2 (chanzo cha crash): "Tried to process unknown reply: !empty"
RouterOS 7.20+ inajibu print tupu kwa neno `!empty`. node-routeros v1.6.9
inajua `!re`/`!done`/`!trap` tu; `!empty` inaenda `emit('unknown') -> onUnknown()
-> throw UNKNOWNREPLY` KUTOKA NDANI YA event listener. Throw hiyo:
- Haiwezi kukamatwa na promise ya write() (inatoka event, si promise)
- Inakuwa uncaughtException
- write() inakwama -> "Timed out after 8 seconds" -> router Offline

**Fix (root cause, wrapper si kubadilisha node_modules):**
`router-api/ros-compat.ts` — runtime patch ya `Channel.prototype.processPacket`.
`!empty` sasa inashughulikiwa kama `!done` na data tupu (hakuna throw).
Patch inajitumia yenyewe connection.ts inapopakiwa (haiwezi kusahaulika).
Safety net ya pili: `connection.ts` inatambua UNKNOWNREPLY(!empty) -> [].

## sync.all kamili
`commands.ts` sasa inasoma rasilimali zote 27: identity, resource, health,
clock, routerboard, license, packages, interfaces, ip.address, routes, dns,
bridge, wireless, dhcp servers+leases, hotspot servers+active+users+profiles+
hosts, pppoe secrets+active+profiles, queues, firewall filter+nat, capsman.
Rasilimali zisizopo (wireless/capsman kwenye vifaa fulani) -> run() inarudisha
[] bila kuvunja sync (per-command isolation).

## RouterOS compatibility (6.x / 7.x / 7.20+)
- !empty patch (7.20+)
- keepalive: false (chanzo cha UNKNOWNREPLY 7.20+)
- fresh-socket recovery kwenye heartbeat
- per-command isolation (run() -> [] ikishindwa)
- paths ni standard (zinafanya kazi 6.x na 7.x)

## Error handling
- unhandledRejection + uncaughtException handlers (index.ts)
- retry + reconnect kwenye run()
- structured logs: command, params, response rows, execution time (ms), retry,
  reconnect
- graceful recovery: hakuna command inayoweza kuvunja polling loop

## Health monitoring
Heartbeat kila 30s inaripoti: version, cpu, connected users, pingMs, responseMs.
failStreak inasababisha fresh socket. Dashboard inaonyesha Online mara metrics
zinapofika.

## Mafaili yaliyobadilishwa
1. src/command-handler/handler.ts — sync.all recognized + timing logs
2. src/router-api/ros-compat.ts (MPYA) — !empty patch
3. src/router-api/connection.ts — auto-apply patch + !empty -> [] + logs
4. src/router-api/commands.ts — rasilimali zote 27 za sync.all
5. src/index.ts — apply patch mapema (index pia)
6. test/mock-router.mjs — inajibu !empty (7.20 sim)
7. test/test-empty-reply.mjs (MPYA)
8. package.json — test:empty, test:all

## Test report
```
test:connection  ✅ RouterOS version 7.20.7
test:metrics     ✅ metrics + command
test:resilience  ✅ command failed gracefully, no crash
test:empty       ✅ !empty -> [] in ~44ms (si timeout 8s), no crash
```

## Verification report
- agent tsc --noEmit: 0 errors
- frontend tsc + vite build: OK
- hakuna file > 250 lines
- architecture haijabadilika (multi-router, Supabase transport zilezile)

## Deploy
```
cd agent
npm install
npm run build
npm run test:all   # thibitisha zote ✅
npm start
```
Router itabaki Online; sync.all itasoma rasilimali zote; !empty haitavunji tena.
