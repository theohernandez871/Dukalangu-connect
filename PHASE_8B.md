# PHASE 8B — Customer Portal (Captive Portal) — IMEKAMILIKA 100%

Ukurasa wa umma ambao mteja wa WiFi anaona anapounganisha na hotspot. Voucher login + branding + ads/offers/announcements.

Uamuzi: **Voucher login tu** (QR/OTP baadaye) + **integration kamili** (portal -> verify RPC -> command queue -> agent -> RouterOS).

---

## Sehemu 3 (zote 100%)

### 8B-1 — Database + public RPCs
- `portal_settings` (slug, branding, logo, rangi, ujumbe), `portal_ads`, `portal_offers`, `portal_announcements`
- `get_portal(slug)` — **public (anon)**, inarudisha kila kitu kwa call moja
- `portal_redeem_voucher(slug, code, mac)` — **public**, inathibitisha vocha + inaiweka used + **inaenqueue hotspot.create_user** kwa router
- `ensure_portal_settings()` + backfill; RLS (admin ndani ya kampuni)
- **Hakuna Edge Function** — RPCs za public zinatosha (rahisi + salama)

### 8B-2 — Portal ya umma (React)
- `PortalPage` `/portal/:slug` — mobile-first, branding ya kampuni
- `VoucherLogin` (numeric keypad + validation), `AdsBanner` (auto-rotate), `OffersList`, `AnnouncementsList`, `PortalSuccess`
- **Route ya public kabisa** — nje ya ProtectedRoute + PublicOnlyRoute; hakuna auth dependency

### 8B-3 — Admin management
- `PortalAdminPage` yenye tabs: Mipangilio, Matangazo (Ads), Ofa, Matangazo
- Settings: slug, logo, rangi (color picker), branding + **portal URL + copy**
- Ads/Offers/Announcements CRUD (dialogs)
- Nav "Portal ya Wateja" (`settings:manage`)

---

## Vipengele (checklist)

| Kipengele | Hali |
|-----------|------|
| Captive Portal (branding) | OK |
| Voucher Login | OK |
| QR Login | Baadaye (muundo tayari) |
| OTP Login | Baadaye (muundo tayari) |
| Advertisement Banner | OK |
| Offers | OK |
| Announcements | OK |
| Admin management | OK |

---

## Mzunguko kamili

```
Mteja -> /portal/[slug] -> branding + ofa + matangazo
      -> ingiza vocha -> portal_redeem_voucher (public RPC)
      -> thibitisha + weka 'used' + enqueue command
      -> agent (8A) -> RouterOS hotspot user
      -> mteja anapata WiFi -> skrini ya mafanikio
```

---

## Uthibitisho

`tsc -b` OK | `vite build` OK | `oxlint` 0/0 (files 203) | hakuna file > 250 | portal hakuna auth dependency.

---

## Deploy (8B)

1. **SQL**: endesha `all_migrations.sql` v10 (au `0015_portal.sql`)
2. Hakuna Edge Function mpya
3. Frontend: `git push` (Vercel auto-deploy)
4. Admin: **Portal ya Wateja -> Mipangilio** -> weka slug, logo, rangi, ujumbe -> Hifadhi
5. Nakili portal URL, weka kwenye MikroTik hotspot (login page redirect) au shiriki moja kwa moja

### Kupima
1. Admin: weka portal settings + tengeneza vocha (Phase 7)
2. Fungua `/portal/[slug]` kwenye browser
3. Ingiza namba ya vocha -> inapaswa kuthibitishwa + skrini ya mafanikio
4. Kama router + agent vipo, hotspot user inatengenezwa (mteja anapata WiFi)

---

## PHASE 8B IMEKAMILIKA

Customer Portal iko tayari. Phase 8 (8A + 8B) nzima imekamilika:
muunganisho wa MikroTik (agent) + captive portal.

**Simama hapa. Subiri maelekezo ya phase inayofuata (mfano Payments au Reports).**
