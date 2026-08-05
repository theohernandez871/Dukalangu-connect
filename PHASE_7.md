# PHASE 7 — Voucher Management (IMEKAMILIKA 100%)

Vocha za numeric (keypad-friendly), QR + barcode, batch printing (PDF). Client-side generation.

---

## 1. Architecture

Vocha zimefungwa na kifurushi (Phase 6). **Batch** = kundi lililotengenezwa pamoja. Codes ni **numeric** (rahisi kwa simu). QR/barcode/PDF hutengenezwa **client-side** (haraka, hakuna server).

Uzalishaji ni atomic kupitia `generate_vouchers()` (SECURITY DEFINER) — inatengeneza codes za kipekee kwa mkupuo, retry on collision, hadi 1000 kwa batch.

---

## 2. Folders/Files mpya

```
src/features/vouchers/
  utils/       codes (QR, barcode, formatCode), pdf (batch PDF builder)
  components/  VoucherStatusBadge, GenerateVoucherDialog,
               VoucherPreviewDialog, VoucherBatchList, VoucherTable
  hooks/       useVouchers, useBatchPdf
  services/    voucher.repository, voucher.service
  schemas/     voucher.schema
  types/       voucher
  pages/       VouchersPage (Batches + Vocha zote tabs)
supabase/migrations/  0013_vouchers.sql
```

Dependencies mpya: `qrcode`, `jsbarcode`, `jspdf` (chunk yao tofauti — inapakiwa vouchers page tu).

---

## 3. Database changes

**`0013_vouchers.sql`:** enum `voucher_status`; `voucher_batches`; `vouchers` (code unique per company, status, expires_at, used_at/used_by kwa Phase 8); **`generate_vouchers()`** (numeric, atomic, unique, prefix + validity); RLS (inserts via function tu); audit.

---

## 4. API mpya

- **voucherService**: `generate`, `listBatches`, `listVouchers`, `setStatus`, `removeBatch`
- Hooks: `useBatches`, `useVouchers`, `useVoucherMutations`, `useBatchPdf`

---

## 5. Features

- **Generate**: chagua kifurushi, idadi (1–1000), urefu wa namba, prefix, uhalali (siku)
- **QR + Barcode**: kila vocha (preview dialog)
- **Batch Printing / PDF**: tiketi 10 kwa ukurasa A4 (2×5), QR + code + jina la kampuni + bei
- **History**: vocha zote + filter kwa hali (haijatumika/imetumika/imeisha/imezimwa)

---

## 6. Sababu za maamuzi

- **Numeric codes** — wateja wa hotspot Tanzania wanaandika kwa keypad ya simu; numeric ni rahisi zaidi.
- **Client-side generation** — PDF ya vocha 100 haraka bila kupakia server; qrcode/jspdf ni imara. Server inaweza kuongezwa baadaye.
- **generate_vouchers() atomic** — codes za kipekee bila race condition; retry on collision.
- **Batch model** — kurahisisha printing + tracking; foundation ya reports (Phase 10).
- **voucher-vendor chunk** — jspdf/qrcode (488 kB) inapakiwa vouchers page tu, si initial load.

---

## 7. Duplicated code — HAKUNA

- Tables (batches, vouchers) = `DataTable` reuse.
- CopyButton, Dialog, Select, Badge reuse.
- QR/PDF logic centralized kwenye utils; components zinaitumia.

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ | `oxlint` = 0/0 (files 186) | File kubwa = 120.

---

## 8. Uko tayari kwa Phase 8?

**NDIYO.** Vocha zipo na zina code + status. Phase 8 (Customer Portal) itatumia vocha kuingia WiFi: captive portal, QR/OTP/voucher login, kubadilisha status -> 'used', na used_by (device MAC).

### Setup mpya
Endesha `0013_vouchers.sql` (au `all_migrations.sql` v8). Hakuna Edge Function mpya.

**Simama hapa. Subiri maelekezo ya kuendelea Phase 8.**
