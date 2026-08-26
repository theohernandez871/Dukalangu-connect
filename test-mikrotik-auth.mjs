#!/usr/bin/env node
// Direct MikroTik authentication probe. Connects using the SAME credentials the
// agent would use, runs /system/resource/print, and prints the REAL result or
// the REAL error — with enough detail to distinguish auth vs network vs port,
// but WITHOUT ever printing the full password.
//
// Two credential sources are supported so we can compare them:
//   node test-mikrotik-auth.mjs                 (uses .env: ROUTER_* if present)
//   node test-mikrotik-auth.mjs <host> <user>   (prompts for password, no echo)
//
// It reveals password *shape* (length, leading/trailing spaces, quotes) which
// is the usual culprit when Winbox works but the API does not.

import { RouterOSAPI } from 'node-routeros';
import { createInterface } from 'node:readline';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local' }); // .env.local overrides .env if present

function shape(pw) {
  if (pw == null) return '(haipo)';
  const len = pw.length;
  const lead = /^\s/.test(pw) ? 'NAFASI-MWANZO ' : '';
  const trail = /\s$/.test(pw) ? 'NAFASI-MWISHO ' : '';
  const quotes = /^["']|["']$/.test(pw) ? 'QUOTES ' : '';
  return `urefu=${len} ${lead}${trail}${quotes}`.trim();
}

function ask(q, { hide = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return new Promise((res) => {
    if (hide) {
      // Suppress echo for password entry.
      const orig = rl._writeToOutput?.bind(rl);
      rl._writeToOutput = (s) => { if (!/\n/.test(s)) return; orig?.(s); };
    }
    rl.question(q, (a) => { rl.close(); console.log(); res(a); });
  });
}

const host = process.argv[2] || process.env.ROUTER_HOST || '192.168.88.1';
const port = Number(process.env.ROUTER_PORT || 8728);
const user = process.argv[3] || process.env.ROUTER_USER || 'admin';
let password = process.env.ROUTER_PASSWORD;

console.log('============================================');
console.log('  MIKROTIK AUTH PROBE');
console.log('============================================');

if (password == null) {
  password = await ask('Weka password ya RouterOS (haitaonyeshwa): ', { hide: true });
}

console.log(`Host    : ${host}:${port}`);
console.log(`User    : ${user}`);
console.log(`Password: ${shape(password)}`);
console.log('--------------------------------------------');

const api = new RouterOSAPI({ host, port, user, password, timeout: 8, keepalive: false });

try {
  await api.connect();
  console.log('\x1b[32m✓ LOGIN IMEFANIKIWA\x1b[0m — credentials ni sahihi!');
  try {
    const res = await api.write('/system/resource/print');
    const r = res?.[0] ?? {};
    console.log(`  RouterOS: ${r.version ?? '?'} | uptime: ${r.uptime ?? '?'} | board: ${r['board-name'] ?? '?'}`);
  } catch (e) {
    console.log('  (login OK, lakini /system/resource/print imeshindwa:', String(e).slice(0, 60), ')');
  }
  await api.close();
} catch (e) {
  const m = String(e?.message ?? e);
  console.log('\x1b[31m✗ IMESHINDWA\x1b[0m');
  console.log(`  Error halisi: ${m}`);
  if (/CANTLOGIN|invalid user|cannot log|password/i.test(m)) {
    console.log('  AINA: AUTHENTICATION — username au password si sahihi kwa API.');
    console.log('  Angalia: (a) nafasi/quotes kwenye password (ona "shape" hapo juu),');
    console.log('           (b) je user "'+user+'" ana ruhusa ya "api" group kwenye RouterOS?');
    console.log('           (c) je password database ni ile ile ya sasa? (huenda ya zamani).');
  } else if (/ETIMEDOUT|ECONNREFUSED|EHOSTUNREACH|timed out/i.test(m)) {
    console.log('  AINA: NETWORK/PORT — haifikiki. API service imewashwa? Port sahihi? LAN moja?');
  } else {
    console.log('  AINA: NYINGINE — ona error halisi hapo juu.');
  }
  process.exitCode = 1;
}
