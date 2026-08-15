# Jinsi ya Kusakinisha Hotspot Billing Agent

Mwongozo huu ni kwa hatua 3 rahisi. Hauhitaji ujuzi wa programming.

## Kabla ya kuanza — utahitaji:

- Kompyuta ya **Windows** itakayobaki karibu na MikroTik (imeunganishwa kwa cable/LAN)
- **Agent Token** (utaipata kutoka kwa msimamizi wa mfumo / dashboard)
- Taarifa za **MikroTik**: IP, jina la mtumiaji, nenosiri (API)
- **Node.js** imesakinishwa (kutoka https://nodejs.org — toleo 18 au zaidi)

---

## HATUA 1: Sakinisha na Sanidi

1. Nakili folda nzima ya `agent` kwenye kompyuta ya MikroTik
2. Bonyeza mara mbili faili **`install.bat`**
3. Setup Wizard itafunguka kwenye browser
4. Jaza taarifa:
   - **Agent Token** (bandika kutoka dashboard)
   - **MikroTik IP** (mfano 192.168.88.1)
   - **Jina + nenosiri** la MikroTik
   - **System URL + Key** (kutoka kwa msimamizi)
5. Bonyeza **"Jaribu Muunganisho"** — hakikisha vyote vina alama ya kijani ✓
6. Bonyeza **"Hifadhi"**

---

## HATUA 2: Sakinisha Service (24/7)

1. Funga dirisha la Setup Wizard
2. Bonyeza **kulia** faili **`install-service.bat`**
3. Chagua **"Run as administrator"**
4. Subiri iandike "IMEKAMILIKA!"

Sasa Agent itaendesha 24/7 na itajianzisha kila kompyuta inapowashwa.

---

## HATUA 3: Thibitisha

1. Fungua **dashboard** (kwenye simu au kompyuta yoyote)
2. Nenda **Routers**
3. Router yako inapaswa kuonyesha **ONLINE** (nukta ya kijani)

Ukiona ONLINE — umemaliza! Sasa unaweza kusimamia hotspot yako kutoka dashboard popote ulipo.

---

## Kubadilisha mipangilio baadaye

Kama unataka kubadilisha token au taarifa za MikroTik:

1. Fungua Command Prompt kwenye folda ya agent
2. Andika: `npm run setup`
3. Setup Wizard itafunguka tena — badilisha unachotaka, Hifadhi

## Ukikwama

- **Router OFFLINE:** hakikisha kompyuta imeunganishwa kwenye MikroTik (LAN), na Setup Wizard ilikamilika
- **"Node.js haijapatikana":** sakinisha Node.js kutoka https://nodejs.org kisha jaribu tena
- **Service haianzi:** hakikisha ulibonyeza "Run as administrator" kwenye install-service.bat
