// Reproduces the sync.all crash: run the full SYNC_KINDS sequence where several
// endpoints return !empty+!done (RouterOS 7.21). Must complete with no
// UNREGISTEREDTAG, no crash, and the connection stays usable afterwards.

import { startMockRouter } from './mock-router.mjs';
import { RouterConnection } from '../dist/router-api/connection.js';
import { collectAll } from '../dist/sync-engine/collect.js';

async function main() {
  const server = await startMockRouter(18733);
  const conn = new RouterConnection(
    { host: '127.0.0.1', port: 18733, user: 'admin', password: 'x', timeout: 8000 },
    'syncall',
  );

  let crashed = false;
  let unregistered = false;
  process.on('uncaughtException', (e) => {
    crashed = true;
    if (String(e).includes('UNREGISTEREDTAG') || String(e).includes('unregistered')) unregistered = true;
  });

  try {
    await conn.connect();

    // Full sync — most endpoints are unknown to the mock, so they return
    // !empty+!done. This is exactly what sync.all does after identity.
    const snap = await collectAll(conn);

    // Connection must still work after the sync burst.
    await new Promise((r) => setTimeout(r, 300));
    const stillWorks = (await conn.runStrict('/system/resource/print'))[0]?.version;

    const kinds = Object.keys(snap.data).length;
    if (!crashed && !unregistered && stillWorks) {
      console.log(`✅ SUCCESS — sync.all ran ${kinds} kinds, no unregistered-tag, connection alive (v${stillWorks})`);
    } else {
      console.log(`❌ FAIL — crashed:${crashed} unregistered:${unregistered} stillWorks:${!!stillWorks}`);
      process.exitCode = 1;
    }
  } catch (e) {
    console.log('❌ FAIL —', String(e));
    process.exitCode = 1;
  } finally {
    await conn.close();
    server.close();
  }
}
main();
