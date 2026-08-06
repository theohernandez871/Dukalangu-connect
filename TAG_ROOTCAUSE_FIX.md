# FIX: "Received data on unregistered tag" — ROOT CAUSE (RouterOS 7.21.5)

## Chanzo halisi (kilichokuwa kimefichwa)

RouterOS 7.20+/7.21 inatuma print tupu kama replies MBILI kwenye tag moja:
```
!empty
!done
```

node-routeros v1.6.9 processPacket:
- !empty -> default branch -> emit('unknown') (throw) + **close()** (inaondoa tag)
- !done (inayofuata) -> tag imeshaondoka -> Receiver.sendTagData ->
  **throw UNREGISTEREDTAG** ("Received data on unregistered tag")
- -> Socket error -> write() timeout 8s -> router Offline

### Kwa nini fix yangu ya awali haikutosha
Patch yangu ya kwanza ilibadilisha !empty kutoa 'done' + **close()**. Lakini
bado ILIFUNGA channel. Kisha !done halisi ya RouterOS ikafika -> tag imeondoka
-> UNREGISTEREDTAG. Patch ilikuwa SEHEMU ya tatizo.

## Suluhisho sahihi

!empty sasa ni **no-op kamili**: hairuhusu throw, na **HAIFUNGI** channel.
!done inayofuata (ambayo RouterOS hutuma) ndiyo inayokamilisha na kufunga
channel — tag inaondolewa MARA MOJA tu, kwa wakati sahihi.

```
!empty -> tambua tupu, subiri (usifunge)
!done  -> emit('done', []) + close() [asili ya library]
```

## Layers za ulinzi (defense in depth)
1. **!empty no-op patch** (root cause) — tag inabaki hadi !done
2. **Serialization mutex** — request moja kwa wakati (hakuna concurrent writes)
3. **Single main loop** — poll + heartbeat hazipishani kwenye connection moja
4. **Fresh-socket recovery** — UNREGISTEREDTAG/Socket error -> close() kamili
   kabla ya retry (tag map safi mpya)
5. **isEmptyReply guard** kwenye connection.ts (secondary net)

## Persistent connection + reconnect
- Connection inabaki hai (persistent) — !empty haiivunji tena
- Socket error -> connected=false -> run() inayofuata inaunganisha upya
- Retry ya socket-state error inatumia socket MPYA (tag map safi)
- Tags hazipotei kwa sababu !done pekee ndiyo inafunga channel

## Mafaili yaliyobadilishwa
1. src/router-api/ros-compat.ts — !empty = no-op (HAIFUNGI channel) [ROOT CAUSE]
2. src/router-api/connection.ts — isSocketStateError + fresh socket kwenye retry
3. test/mock-router.mjs — inatuma !empty + !done (kama RouterOS 7.21)
4. test/test-syncall.mjs (MPYA) — inaiga sync.all kamili
5. package.json — test:syncall, test:all

## Test report (RouterOS 7.21.5 simulated)
```
connection      ✅ version 7.21.5
metrics         ✅ metrics + command
resilience      ✅ command failed gracefully, no crash
empty-reply     ✅ !empty+!done -> [], no unregistered-tag
serialization   ✅ 20 concurrent -> max in-flight 1
syncall         ✅ 27 kinds, no unregistered-tag, connection alive
```

## Verification report
- agent tsc --noEmit: 0 errors
- frontend tsc + vite build: OK
- hakuna file > 250 lines
- architecture haijabadilika

## Deploy
```
cd agent
npm install
npm run build
npm run test:all   # zote sita ✅
npm start
```
Baada ya sync.all, router itabaki ONLINE muda wote. !empty+!done inashughulikiwa
sahihi; tag hazipotei; connection ni persistent.
