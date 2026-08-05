# FIX: Router Credential Read (RosException: Username or password invalid)

## Root cause

Credentials ZINAHIFADHIWA sawa (Supabase Vault, `secret_id`). Tatizo lilikuwa
kwenye KUSOMA:

- `agent-gateway` na `omada-proxy` zilijaribu kusoma `vault.decrypted_secrets`
  moja kwa moja kupitia PostgREST API: `.schema('vault').from('decrypted_secrets')`
- Lakini **schema ya `vault` HAIJAFUNULIWA kwa API** (Supabase default). Hata
  service_role haiwezi kuisoma kupitia REST.
- Matokeo: read inarudisha `null` -> agent inapokea password TUPU -> MikroTik
  inakataa: "Username or password is invalid".

Kwa nini database findings zako zilikuwa sahihi:
- `password_enc = NULL` -> sahihi (column ya zamani, haitumiki)
- `secret_id` ipo -> sahihi (inarejelea Vault secret)
- `decrypted_secrets`/`secrets` hazipo kwenye `public` -> sahihi; ziko kwenye
  schema ya `vault` (imezuiwa kwa API). Hii NDIYO ilikuwa root cause.

## Suluhisho (root cause, si workaround)

RPC ya SECURITY DEFINER inayosoma vault NDANI ya database (ambapo vault
inafikika) na kurudisha password. Callable na `service_role` tu.

## Mafaili yaliyobadilishwa

1. **supabase/migrations/0017_credential_read_fix.sql** (MPYA)
   - `get_router_password(uuid)` -> soma vault, rudisha password (service_role)
   - `get_omada_password(uuid)` -> vivyo hivyo kwa Omada
   - Ondoa column ya zamani `password_enc`

2. **supabase/functions/_shared/agentGateway.ts**
   - Badala ya kusoma `vault.decrypted_secrets` moja kwa moja, inaita
     `admin.rpc('get_router_password', ...)`

3. **supabase/functions/omada-proxy/index.ts**
   - Inaita `admin.rpc('get_omada_password', ...)`

4. **Imeondolewa: supabase/functions/agent-poll, agent-report**
   - Dead code (Phase 4b legacy) yenye bug ileile. Enterprise agent inatumia
     `agent-gateway` pekee. Kuondoa kunazuia kudeploy code isiyofanya kazi.

## Hakuna workaround ya SQL

Password inasomwa kwa njia sahihi (RPC), architecture haijabadilika:
- Storage: bado Vault (`set_router_password` -> `vault.create_secret`)
- Read: sasa `get_router_password` RPC (badala ya API query iliyoshindwa)

## Deploy

```bash
# 1. Migration
#    Endesha all_migrations.sql (v11) au 0017_credential_read_fix.sql
# 2. Edge Functions (zilizobadilishwa)
supabase functions deploy agent-gateway
supabase functions deploy omada-proxy
```

## Baada ya deploy

1. Weka password ya router upya (dashboardi -> Routers -> Hariri -> nywila)
   ili ihifadhiwe Vault (kama haikuhifadhiwa vizuri awali).
2. Endesha agent (`npm start`).
3. Bonyeza "Jaribu" -> sasa gateway inasoma password sahihi -> agent inaingia
   MikroTik -> router **ONLINE** + RouterOS version.

Kama bado "invalid password" BAADA ya hii + kuweka nywila upya: thibitisha
nywila ni sahihi kwa kujaribu kuingia RouterOS moja kwa moja (Winbug/WebFig).
