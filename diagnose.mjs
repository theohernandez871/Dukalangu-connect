#!/usr/bin/env node
// End-to-end connectivity diagnostic for the Hotspot Billing Agent.
// Runs ON THE CUSTOMER'S MACHINE (where the MikroTik + config actually are)
// and reports real results for each hop. Never prints secrets.
//
//   node diagnose.mjs
//
// It reads the saved (encrypted) wizard config, so run `npm run setup` first.

import { loadWizardConfig } from './dist/security/wizardConfig.js';
import { normalizeSupabaseUrl } from './dist/security/urlNormalize.js';
import { RouterConnection } from './dist/router-api/connection.js';

const line = (s = '') => console.log(s);
const pass = (t) => console.log(`  \x1b[32mPASS\x1b[0m  ${t}`);
const fail = (t, d) => console.log(`  \x1b[31mFAIL\x1b[0m  ${t}${d ? `\n        -> ${d}` : ''}`);
const info = (t) => console.log(`        ${t}`);

// Redact anything secret-looking so the report is safe to share.
const redact = (s) => (s ? `${String(s).slice(0, 3)}***(${String(s).length} chars)` : '(tupu)');

let cfg;
try {
  cfg = await loadWizardConfig();
} catch (e) {
  fail('Kusoma config', String(e));
  process.exit(1);
}

const base = normalizeSupabaseUrl(cfg.supabaseUrl ?? '').url;

line('============================================');
line('  UTHIBITISHO WA MUUNGANISHO (DIAGNOSTIC)');
line('============================================');
line();
line('Config (bila secrets):');
info(`System URL      : ${base || '(haijawekwa)'}`);
info(`Agent Token     : ${redact(cfg.agentToken)}`);
info(`MikroTik host   : ${cfg.routerHost ?? '(haijawekwa)'}:${cfg.routerPort ?? 8728}`);
info(`MikroTik user   : ${cfg.routerUser ?? '(haijawekwa)'}`);
info(`MikroTik pass   : ${redact(cfg.routerPassword)}`);
line();

let mikrotikOk = false;

// ---- A. Supabase reachable + Agent Gateway present -----------------------
line('A. Supabase -> Agent Gateway');
try {
  const r = await fetch(`${base}/functions/v1/agent-gateway`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  info(`HTTP ${r.status} kutoka /functions/v1/agent-gateway`);
  if (r.status === 401) pass('agent-gateway ipo (imekataa bila token = sahihi)');
  else if (r.status === 404) fail('agent-gateway HAIPATIKANI', 'Angalia System URL (project ref) au deploy agent-gateway.');
  else if (r.status === 200) pass('agent-gateway imejibu 200');
  else fail(`agent-gateway imejibu HTTP ${r.status}`, 'Si 401/200 kama inavyotarajiwa.');
} catch (e) {
  fail('Supabase haipatikani', `${e.name}: angalia System URL + internet (ERR_NAME_NOT_RESOLVED = URL mbaya au project paused).`);
}
line();

// ---- B. Agent -> Supabase (authenticated poll) ---------------------------
line('B. Agent -> Supabase (auth + poll)');
try {
  const r = await fetch(`${base}/functions/v1/agent-gateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-token': cfg.agentToken ?? '',
      apikey: cfg.supabaseAnonKey ?? '',
      Authorization: `Bearer ${cfg.supabaseAnonKey ?? ''}`,
    },
    body: JSON.stringify({ action: 'poll' }),
  });
  info(`HTTP ${r.status} kwa action=poll`);
  if (r.status === 200) pass('Token ni sahihi, poll imefanikiwa');
  else if (r.status === 401) fail('Token imekataliwa (401)', 'Tengeneza token mpya dashboard -> Agents.');
  else if (r.status === 404) fail('Gateway haipatikani (404)', 'System URL si sahihi.');
  else fail(`Poll imejibu HTTP ${r.status}`);
} catch (e) {
  fail('Kufikia gateway kumeshindwa', `${e.name}`);
}
line();

// ---- C. Agent -> MikroTik (LAN/API) + identity ---------------------------
line('C. Agent -> MikroTik (API 8728) + D. hotspot data');
if (!cfg.routerHost) {
  fail('MikroTik host haijawekwa', 'Endesha npm run setup.');
} else {
  const conn = new RouterConnection(
    { host: cfg.routerHost, port: cfg.routerPort || 8728, user: cfg.routerUser, password: cfg.routerPassword, timeout: 8000 },
    'diagnose',
  );
  try {
    await conn.connect();
    pass(`Imeunganishwa MikroTik ${cfg.routerHost}:${cfg.routerPort || 8728}`);
    mikrotikOk = true;

    // 8. identity
    try {
      const id = await conn.run('/system/identity/print');
      if (id?.length) pass(`identity: ${id[0]?.name ?? '(bila jina)'}`);
      else fail('Kusoma identity', 'Imerudisha tupu — command imeshindwa (angalia ruhusa za API user).');
    } catch (e) { fail('Kusoma identity', String(e)); }

    // version + resources
    try {
      const res = await conn.run('/system/resource/print');
      const r0 = res?.[0] ?? {};
      info(`RouterOS: ${r0.version ?? '?'} | uptime: ${r0.uptime ?? '?'} | CPU: ${r0['cpu-load'] ?? '?'}%`);
      pass('resource (version/uptime/cpu) imesomeka');
    } catch (e) { fail('Kusoma resource', String(e)); }

    // 9. interfaces
    try {
      const ifs = await conn.run('/interface/print');
      pass(`interfaces: ${ifs?.length ?? 0} zimepatikana`);
    } catch (e) { fail('Kusoma interfaces', String(e)); }

    // 10. hotspot active users (D)
    try {
      const act = await conn.run('/ip/hotspot/active/print');
      pass(`hotspot active users: ${act?.length ?? 0}`);
    } catch (e) { info(`(hotspot active: ${String(e).slice(0, 40)} — huenda hotspot haijawekwa bado)`); }

    await conn.close();
  } catch (e) {
    const m = String(e);
    if (/timed out|ETIMEDOUT|ECONNREFUSED|EHOSTUNREACH/i.test(m)) {
      fail('MikroTik haifikiki', 'Angalia: kompyuta iko LAN moja na MikroTik? API port 8728 open? Available From = 192.168.88.0/24?');
    } else if (/login|password|auth|cannot log/i.test(m)) {
      fail('Login MikroTik imeshindwa', 'Jina/nenosiri si sahihi (API user).');
    } else {
      fail('MikroTik', m);
    }
  }
}
line();

line('============================================');
line('  MUHTASARI');
line('============================================');
info('A/B: kama PASS -> Supabase + gateway + token viko sawa');
info('C/D: kama PASS -> Agent inafikia MikroTik + kusoma data');
info('E/F (dashboard status + command round-trip): huthibitishwa dashboard');
info('     ikionyesha ONLINE baada ya service kuanza.');
line();
if (!mikrotikOk) info('MikroTik haikufikika — tatizo kubwa liko hapo (LAN/API/creds).');
process.exit(0);
