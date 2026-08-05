# AGENT SETUP — Mwongozo wa Kuunganisha Router (Online)

Mwongozo huu unakuelekeza hatua kwa hatua kutoka "Haijaunganishwa" hadi router **Online** yenye metrics za wakati halisi.

> **Muhimu:** Agent ni programu inayoendeshwa kwa **kifaa kilicho kwenye mtandao ule ule wa router** (LAN) — si kwenye Vercel, si kwenye Supabase. Kifaa hiki kinaweza kuwa PC ndogo, laptop, au Raspberry Pi iliyounganishwa na router.

---

## Rekebisho lililofanyika (toleo hili)

**BUG ya host imerekebishwa.** Awali, form ya kutengeneza router haikuwa inauliza IP ya router (ilikuwa imeondolewa kimakosa pamoja na chaguo la "direct"). Sasa form inauliza:
- **IP ya router (LAN)** — mfano `192.168.88.1`
- **API Port** — kawaida `8728`

Bila IP, agent haikuwa na njia ya kujua wapi kuunganisha. Sasa imetatuliwa.

---

## Hatua zote (fuata kwa mpangilio)

### Hatua 1 — Deploy Edge Functions
Bila hizi, agent itagonga 404.

```bash
cd hotspot-billing
supabase functions deploy agent-gateway
supabase functions deploy router-set-credential
```

Thibitisha secret ipo: Supabase Dashboard → Edge Functions → Secrets → `SUPABASE_SERVICE_ROLE_KEY`.

### Hatua 2 — Endesha SQL v10
Bandika `all_migrations.sql` (v10) kwenye Supabase → SQL Editor → **Run**.
(Inaweka metrics columns, sync cache, Realtime — ni idempotent, salama kuendesha tena.)

### Hatua 3 — Washa API kwenye RouterOS
Kwenye MikroTik (Winbox/terminal):

```
/ip service enable api
/ip service set api port=8728
```

Hakikisha firewall ya router inaruhusu port 8728 kutoka kwenye LAN:

```
/ip firewall filter add chain=input protocol=tcp dst-port=8728 \
  src-address=192.168.88.0/24 action=accept comment="Agent API"
```

(Badilisha `192.168.88.0/24` na subnet ya LAN yako.)

### Hatua 4 — Tengeneza router dashboardi
Dashboard → **Routers** → **Ongeza router**:

| Uga | Thamani (mfano) |
|-----|-----------------|
| Jina | Router ya Geita |
| IP ya router (LAN) | `192.168.88.1` |
| API Port | `8728` |
| Jina la mtumiaji | `admin` |
| Nywila | (nywila ya RouterOS) |

> **IP ni ya ndani (LAN)** ambapo agent itaendeshwa — si public IP. Ndiyo agent inatumia kuunganisha na router moja kwa moja.

### Hatua 5 — Tengeneza Agent + nakili token
Dashboard → **Routers** → tab ya **Agents** → **Tengeneza agent**.

- Kwa agent inayosimamia **routers zote za kampuni**: usichague router maalum.
- Kwa router moja: chagua hiyo.

**Nakili token mara moja** (haionyeshwi tena).

### Hatua 6 — Sakinisha + endesha Agent
Kwenye kifaa kilicho kwenye LAN ya router:

```bash
cd agent
npm install
npm run build
```

Tengeneza `.env` (nakili kutoka `.env.example`):

```
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="anon_key_yako"
AGENT_TOKEN="token_kutoka_hatua_5"
```

Endesha:

```bash
npm start
```

Utaona kwenye logs: `Imeunganishwa: ... (192.168.88.1:8728)` + heartbeat kila sekunde 30.

**Kwa production (Windows Service inayojianzisha):**
```powershell
npm install node-windows
npm run service:install
```

### Hatua 7 — Thibitisha
Ndani ya **sekunde 30**:
- Dashboard → router inakuwa **Online**
- Metrics zinajaa: CPU, Memory, Uptime, RouterOS version, Connected Users, Ping, Response
- Bonyeza **"Sync sasa"** → tabs (Hotspot, PPPoE, DHCP, Queues, Firewall, Profiles) zinajaa data halisi

---

## Utatuzi wa matatizo (troubleshooting)

| Dalili | Sababu inayowezekana | Suluhisho |
|--------|----------------------|-----------|
| Router bado Offline baada ya sekunde 60 | Agent haiendeshi | Angalia agent inakimbia; angalia logs |
| Agent: "Token si sahihi" (401) | Token imekosewa au imefutwa | Tengeneza agent mpya, weka token upya |
| Agent: 404 | Edge Function haijadeploy | Rudia Hatua 1 |
| Agent: "Imeshindwa kuunganisha" router | IP/port/firewall | Thibitisha IP, `/ip service`, firewall (Hatua 3-4) |
| Online lakini tabs tupu | Sync bado | Bonyeza "Sync sasa" |
| Metrics hazibadiliki | Realtime haijawashwa | Thibitisha SQL v10 imeendeshwa |

---

## Muhtasari wa mzunguko

```
Agent (kifaa cha LAN) --HTTPS--> agent-gateway (Supabase)
   |                                    |
   |-- poll: pata routers + creds ------|
   |-- RouterOS API (8728) -------------|--> MikroTik
   |-- heartbeat kila 30s --------------|--> routers table (Online + metrics)
   |-- sync data ----------------------|--> router_sync_data cache
                                        |
                              Supabase Realtime
                                        |
                                        v
                              Dashboard (papo hapo)
```

---

## Kumbuka la uaminifu

Code yote ya agent + gateway imethibitishwa kimuundo (`tsc` inapita, inajengeka). Lakini **sikuweza kuipima na MikroTik halisi** (hakuna router kwenye mazingira yangu ya ujenzi). Hatua 3–7 lazima uzifanye na router yako. Kama kuna tatizo la mawasiliano na RouterOS API ambalo halikuonekana wakati wa compile, litajitokeza hapa — niambie ujumbe wa error kutoka kwenye logs za agent nikusaidie.
