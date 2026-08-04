# Hotspot Billing Agent

Agent hii ndogo huunganisha router yako ya MikroTik na mfumo wa Hotspot Billing.
Inaishi **ndani ya mtandao wako** na huunganisha **nje kwenda** kwa server — hivyo
inafanya kazi hata kama router yako iko nyuma ya CGNAT/NAT (haihitaji public IP).

---

## Inavyofanya kazi

1. Agent inauliza server kila sekunde chache: "kuna amri?"
2. Server inarudisha maelezo ya router + amri zozote zinazosubiri
3. Agent inaunganisha na RouterOS (API port 8728) **ndani** ya mtandao
4. Inatekeleza amri, inarudisha matokeo + hali ya router
5. Nywila ya router haihifadhiwi kwenye agent — inatumika kwa muda wa amri tu

---

## Kabla ya kuanza

Utahitaji:
- **Node.js 18+** (au Docker) kwenye kifaa kilicho kwenye mtandao ule ule wa router
  (kompyuta ndogo, mini-PC, Raspberry Pi, n.k.)
- **API service** iwe imewashwa kwenye RouterOS:
  - RouterOS: `/ip service enable api`
  - Hakikisha port 8728 inafikika kutoka kifaa cha agent
- **Token ya agent** — itengeneze kwenye dashboard:
  Routers → Agents → "Tengeneza agent". Token inaonyeshwa **mara moja tu** — inakili.
- **SUPABASE_URL** na **SUPABASE_ANON_KEY** (Project Settings → API kwenye Supabase)

---

## Njia 1: Node.js moja kwa moja (rahisi)

```bash
# 1. Ingia kwenye folda ya agent
cd agent

# 2. Sakinisha dependencies
npm install

# 3. Tengeneza faili la mazingira
cp .env.example .env
# Hariri .env, weka SUPABASE_URL, SUPABASE_ANON_KEY, AGENT_TOKEN

# 4. Build
npm run build

# 5. Endesha
npm start
```

Ukiona `Hotspot Billing Agent imeanza`, imefanikiwa. Rudi kwenye dashboard —
agent itaonekana "Imeunganishwa", na router itaonyesha hali yake.

> **Kupima haraka:** kwenye dashboard, bonyeza router → "Jaribu". Ukiona
> kitambulisho cha router, kila kitu kinafanya kazi.

---

## Njia 2: PM2 (service inayojianzisha)

PM2 huendesha agent kama service inayojirudi yenyewe ikizimika, na kujianzisha
kompyuta ikiwashwa upya. Nzuri kwa production.

```bash
# Sakinisha PM2 (mara moja tu)
npm install -g pm2

cd agent
npm install
cp .env.example .env      # hariri .env kama juu
npm run build

# Anzisha kupitia PM2
pm2 start ecosystem.config.cjs

# Hakikisha inajianzisha kompyuta ikiwashwa
pm2 save
pm2 startup             # fuata maelekezo yatakayoonyeshwa

# Amri muhimu
pm2 logs hotspot-agent  # ona kumbukumbu
pm2 restart hotspot-agent
pm2 stop hotspot-agent
```

> **Kumbuka:** PM2 haisomi `.env` yenyewe kwa njia zote. Kama variables
> hazikupatikana, ziweke moja kwa moja au tumia:
> `pm2 start ecosystem.config.cjs --env production` baada ya kuweka variables
> kwenye `ecosystem.config.cjs`, au endesha kupitia `env $(cat .env) pm2 start ...`.

---

## Njia 3: Docker

```bash
cd agent

# Jenga image
docker build -t hotspot-agent .

# Endesha (weka variables zako)
docker run -d \
  --name hotspot-agent \
  --restart unless-stopped \
  -e SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  -e SUPABASE_ANON_KEY="YOUR_ANON_KEY" \
  -e AGENT_TOKEN="your_agent_token" \
  hotspot-agent

# Ona kumbukumbu
docker logs -f hotspot-agent
```

Au kwa `docker compose` (tengeneza `docker-compose.yml`):

```yaml
services:
  agent:
    build: .
    restart: unless-stopped
    environment:
      SUPABASE_URL: "https://YOUR_PROJECT.supabase.co"
      SUPABASE_ANON_KEY: "YOUR_ANON_KEY"
      AGENT_TOKEN: "your_agent_token"
```

```bash
docker compose up -d
```

---

## Mazingira (Environment variables)

| Variable | Lazima? | Maelezo |
|----------|---------|---------|
| `SUPABASE_URL` | Ndiyo | URL ya project (https://xxxx.supabase.co) |
| `SUPABASE_ANON_KEY` | Ndiyo | Anon key ya Supabase |
| `AGENT_TOKEN` | Ndiyo | Token kutoka dashboard (mara moja) |
| `POLL_INTERVAL_MS` | Hapana | Muda wa kupoll (default 3000) |
| `ROUTER_TIMEOUT_MS` | Hapana | Timeout ya router (default 8000) |
| `ROUTER_HOST` | Hapana | Lazimisha IP ya router (kawaida haihitajiki) |

---

## Matatizo ya kawaida

**Agent haionekani "Imeunganishwa":**
- Hakikisha `AGENT_TOKEN` ni sahihi (haikukatwa wakati wa kunakili)
- Hakikisha `SUPABASE_URL` na `SUPABASE_ANON_KEY` ni sahihi
- Angalia kumbukumbu kwa makosa

**"Muunganisho umeshindikana" wakati wa kujaribu router:**
- API service imewashwa? `/ip service print` kwenye RouterOS
- Port 8728 inafikika kutoka kifaa cha agent? (jaribu `telnet ROUTER_IP 8728`)
- Jina la mtumiaji/nywila ni sahihi kwenye dashboard?
- Firewall ya router inaruhusu API kutoka kwenye mtandao wa ndani?

**Agent inasimama ghafla:**
- Tumia PM2 au Docker `--restart unless-stopped` ili ijirudi yenyewe

---

## Usalama

- Agent inatumia **token** tu (si key ya juu ya mfumo). Ikivuja, ifute kwenye
  dashboard (Agents → ondoa) na itengeneze mpya.
- Agent **haifungui** port yoyote ya kuingia — muunganisho ni wa nje tu.
- Nywila ya router hupokelewa kwa muda wa amri tu; **haiandikwi kwenye disk**.
