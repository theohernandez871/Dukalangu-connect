# Kusakinisha Agent kama Service ya Kudumu (24/7)

Mwongozo huu unakuwezesha Agent ijianzishe yenyewe kila computer inapowashwa,
bila wewe kuiendesha kwa mkono. Mfumo utajiendesha 24/7.

## Kwa nini service?

Bila service, lazima ufungue terminal na kuandika `npm start` kila mara. Ukifunga
terminal au computer ikizimwa/kuwashwa, Agent inasimama. Kama **service**:

- Agent inaanza yenyewe computer inapowashwa (hata baada ya umeme kukatika)
- Inajirudisha yenyewe ikisitishwa kwa bahati mbaya
- Inaendesha nyuma (background) — huhitaji terminal wazi
- Huhitaji kukumbuka kuiwasha

## Mahitaji

- Computer ya **Windows** inayobaki ON 24/7 ofisini
- Agent tayari imejengwa na inafanya kazi (umeshathibitisha router ONLINE)
- **Endesha PowerShell kama Administrator** (bonyeza kulia -> Run as administrator)

## Hatua za kusakinisha

### 1. Fungua PowerShell kama Administrator
Bonyeza Start -> andika "PowerShell" -> bonyeza kulia -> **Run as administrator**

### 2. Nenda kwenye folda ya agent
```powershell
cd C:\path\to\hotspot-billing\agent
```
(Badilisha na njia halisi ya folda yako)

### 3. Hakikisha imejengwa + node-windows ipo
```powershell
npm install
npm run build
```

### 4. Sakinisha service
```powershell
npm run service:install
```
Utaona ujumbe: "Service imesakinishwa. Naiwasha..."

### 5. Thibitisha inafanya kazi
- Fungua **Services** (Start -> andika "services.msc")
- Tafuta **HotspotBillingAgent**
- Hali (Status) inapaswa kuwa **Running**
- Startup Type inapaswa kuwa **Automatic**

Au kwenye PowerShell:
```powershell
Get-Service HotspotBillingAgent
```

### 6. Thibitisha dashboard
Fungua dashboard -> router inapaswa kuwa **ONLINE** (Agent inaendesha kama service)

## Kupima kwamba auto-start inafanya kazi

1. **Zima computer kabisa**, kisha uiwashe tena
2. Bila kufanya chochote, subiri dakika 1-2
3. Fungua dashboard -> router inapaswa kuwa **ONLINE** yenyewe
4. Agent imejianzisha bila wewe kufanya kitu ✓

## Amri muhimu

**Kuona hali:**
```powershell
Get-Service HotspotBillingAgent
```

**Kusitisha service (kama unahitaji):**
```powershell
Stop-Service HotspotBillingAgent
```

**Kuwasha tena:**
```powershell
Start-Service HotspotBillingAgent
```

**Kuondoa service (kama unahitaji kubadilisha):**
```powershell
npm run service:uninstall
```

## Baada ya kusasisha Agent (update)

Ukipata toleo jipya la Agent:
```powershell
npm run service:uninstall   # ondoa ya zamani
npm install
npm run build
npm run service:install     # sakinisha mpya
```

## Muhimu

- Service inatumia `.env` ileile (SUPABASE_URL, AGENT_TOKEN, n.k.) — hakikisha
  `.env` ipo kwenye folda ya agent
- Computer LAZIMA ibaki imeunganishwa kwenye MikroTik (LAN) ili Agent ifikie
  router — service haibadilishi hili
- Kama computer inaunganishwa kwenye MikroTik kwa WiFi, hakikisha WiFi
  inajiunganisha yenyewe computer inapowashwa (si kuomba password kila mara)

## Ukikwama

- **Service haianzi:** angalia logs kwenye `agent/logs/` au Event Viewer
- **Router OFFLINE baada ya install:** thibitisha `.env` ipo + computer
  inafikia MikroTik (`Test-NetConnection 192.168.88.1 -Port 8728`)
- **node-windows error:** endesha `npm install node-windows` kisha jaribu tena
