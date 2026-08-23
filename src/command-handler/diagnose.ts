// Reads the real hotspot-related configuration from RouterOS and builds a
// health report. Used by the hotspot.diagnose command to pinpoint why logins
// fail (e.g. an INVALID hotspot server, missing IP pool, wrong login method).
// Every read uses run() so a single missing resource never aborts the report.

import { RouterConnection } from '../router-api/connection.js';
import { createLogger } from '../logging/logger.js';

const log = createLogger('hotspot-diagnose');

export interface HotspotDiagnosis {
  routerOsVersion: string | null;
  servers: Record<string, unknown>[];
  serverProfiles: Record<string, unknown>[];
  usersCount: number;
  activeCount: number;
  ipPools: Record<string, unknown>[];
  dns: Record<string, unknown> | null;
  interfaces: string[];
  loginMethods: string[];
  problems: string[];
  testUser: Record<string, unknown> | null;
}

export async function diagnoseHotspot(conn: RouterConnection): Promise<HotspotDiagnosis> {
  const problems: string[] = [];

  const resource = await conn.run('/system/resource/print');
  const routerOsVersion = resource[0]?.version ?? null;

  // Hotspot servers — the INVALID flag here is the usual login-blocker.
  const servers = await conn.run('/ip/hotspot/print', ['=detail=']);
  for (const s of servers) {
    if (s.invalid === 'true') {
      problems.push(
        `Hotspot server "${s.name}" ni INVALID (interface=${s.interface ?? '?'}). ` +
          `Sababu ya kawaida: interface haina IP address, au address-pool/DHCP haijawekwa. ` +
          `Hakuna user atakayeweza kuingia hadi hii irekebishwe.`,
      );
    }
    if (s.disabled === 'true') problems.push(`Hotspot server "${s.name}" imezimwa (disabled=yes).`);
  }
  if (servers.length === 0) problems.push('Hakuna hotspot server iliyowekwa kwenye router.');

  // Server profiles hold the login method (http-pap/http-chap/https/cookie).
  const serverProfiles = await conn.run('/ip/hotspot/profile/print', ['=detail=']);
  const loginMethods: string[] = [];
  for (const p of serverProfiles) {
    if (p['login-by']) loginMethods.push(`${p.name}: ${p['login-by']}`);
  }

  // Users + active sessions.
  const users = await conn.run('/ip/hotspot/user/print');
  const active = await conn.run('/ip/hotspot/active/print');

  // IP pools — a hotspot needs a pool to hand out addresses; missing = invalid.
  const ipPools = await conn.run('/ip/pool/print');
  const poolReferenced = servers.some((s) => s['address-pool'] && s['address-pool'] !== 'none');
  if (ipPools.length === 0) {
    problems.push('Hakuna IP pool. Hotspot inahitaji address-pool kutoa IP kwa wateja.');
  } else if (!poolReferenced && servers.length > 0) {
    // Not fatal, but worth surfacing.
    log.info('diagnose: hakuna server inayotumia address-pool wazi (huenda inatumia DHCP).');
  }

  // DNS — captive portal redirect needs working DNS.
  const dnsRows = await conn.run('/ip/dns/print');
  const dns = dnsRows[0] ?? null;
  if (dns && !dns.servers && dns['dynamic-servers'] === undefined) {
    problems.push('DNS haina servers zilizowekwa — captive portal inaweza kushindwa ku-redirect.');
  }

  // Interfaces (names only), to help spot mis-assigned hotspot interface.
  const ifaceRows = await conn.run('/interface/print');
  const interfaces = ifaceRows.map((i) => String(i.name ?? '')).filter(Boolean);

  // Create a deterministic test user to isolate credentials vs config.
  let testUser: Record<string, unknown> | null = null;
  try {
    await conn.runStrict('/ip/hotspot/user/add', ['=name=test123', '=password=test123', '=profile=default']);
    log.info('diagnose: test user test123/test123 imeundwa');
  } catch (e) {
    log.info(`diagnose: test user add -> ${String(e)} (huenda ipo tayari)`);
  }
  const testRows = await conn.run('/ip/hotspot/user/print', ['=detail=', '?name=test123']);
  testUser = testRows[0] ?? null;

  const report: HotspotDiagnosis = {
    routerOsVersion,
    servers,
    serverProfiles,
    usersCount: users.length,
    activeCount: active.length,
    ipPools,
    dns,
    interfaces,
    loginMethods,
    problems,
    testUser,
  };
  log.info(`diagnose: ripoti -> matatizo=${problems.length}: ${problems.join(' | ') || '(hakuna)'}`);
  return report;
}
