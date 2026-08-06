# FIX: Vocha hazionekani kwenye MikroTik (write path)

## Root cause
Voucher generation ilikuwa na hatua MOJA tu:
- `generate_vouchers` RPC -> inaandika vocha kwenye DATABASE ✅

Lakini HAKUNA hatua ya pili:
- Kutuma command kwa agent kuunda hotspot user kwenye MikroTik ❌

Voucher batch haikuwa hata na `router_id` — mfumo haukujua router gani.
Ndiyo maana vocha zilionekana kwenye mfumo lakini si kwenye router.
(Read path ilifanya kazi; write path haikuwepo kabisa kwa vouchers.)

## Suluhisho

### 1. Frontend: chagua router + tuma commands
- GenerateVoucherDialog: sehemu mpya "Peleka MikroTik" (Router + Profile)
- voucher.service.generate(): baada ya generate_vouchers, kama routerId ipo,
  inasoma codes na kutuma `hotspot.create_voucher` kwa kila code kupitia
  command queue iliyopo (enqueueWithParams)
- Auto-sync (tuliyoongeza) inaonyesha users papo hapo baada ya create

### 2. Agent: logging ya request + response
handleCommand sasa (kwa mutating commands):
```
REQUEST  -> hotspot.create_voucher {code, profile, comment}
RESPONSE OK <- hotspot.create_voucher (45ms): {"ret":"*1A"}
```
au kama imeshindwa:
```
RESPONSE FAIL <- hotspot.create_voucher (..ms): <kosa la MikroTik> {args}
```

### 3. Mutating commands sasa zinatumia runStrict
Awali `run()` iliswallow errors -> [] (add iliyoshindwa ilionekana kama
mafanikio). Sasa `runStrict()` -> error inapropagate -> inaonekana kama
RESPONSE FAIL. Muhimu: sasa TUNAJUA kama write imeshindwa (duplicate name,
profile mbaya, n.k.). handleCommand inashika error -> ok:false (si crash).

## Mzunguko kamili sasa
```
Tengeneza vocha (chagua router + profile)
  -> generate_vouchers (DB)
  -> kwa kila code: enqueue hotspot.create_voucher
  -> agent: REQUEST log -> /ip/hotspot/user/add -> RESPONSE log
  -> auto-sync
  -> Router -> Hotspot -> Watumiaji (vocha zinaonekana)
```

## Mafaili yaliyobadilishwa
1. src/features/vouchers/types/voucher.ts — routerId + routerProfile
2. src/features/vouchers/schemas/voucher.schema.ts — validation
3. src/features/vouchers/components/GenerateVoucherDialog.tsx — router+profile UI
4. src/features/vouchers/services/voucher.service.ts — pushBatchToRouter
5. src/features/vouchers/services/voucher.repository.ts — listVouchersByBatch
6. agent/src/command-handler/handler.ts — request/response logging + runStrict
7. agent/test/mock-router.mjs — inashughulikia user/add
8. agent/test/test-write.mjs (MPYA)

## Test report
```
connection  ✅ version 7.21.5
syncall     ✅ 28 kinds, no unregistered-tag
write       ✅ create_voucher -> user/add, ok:true, response {ret:*1A}
```
Logging inayoonekana wakati wa write test:
```
REQUEST  -> hotspot.create_voucher {code:12345678, profile:default}
RESPONSE OK <- hotspot.create_voucher (45ms): {"ret":"*1A"}
```

## Verification
- agent tsc: 0 errors | frontend tsc + vite: OK | oxlint: 0 | hakuna >250

## Jinsi ya kupima (mteja halisi)
1. Jenga agent upya: `cd agent && npm install && npm run build && npm start`
2. Frontend: git push
3. Dashboard -> Vocha -> Tengeneza -> chagua Kifurushi + **Router** + **Profile**
   (profile lazima IWEPO kwenye router; anza na "default")
4. Tengeneza vocha chache (mfano 5)
5. Angalia agent log: REQUEST/RESPONSE kwa kila vocha
6. Router -> Hotspot -> Watumiaji -> Sync sasa -> vocha zinaonekana

## Muhimu
- Profile lazima iwepo kwenye MikroTik. Kama huna, tengeneza kwanza (au tumia
  "default"). Vinginevyo utaona RESPONSE FAIL "no such item" kwenye log.
- Kama vocha nyingi (mfano 100), ni commands 100 — agent inazitekeleza moja
  baada ya nyingine (serialized). Inaweza kuchukua sekunde kadhaa.
