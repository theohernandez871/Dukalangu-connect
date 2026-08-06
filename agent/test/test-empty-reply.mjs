// Verifies the RouterOS 7.20+ `!empty` reply is handled as an empty result
// instead of crashing with UNKNOWNREPLY / timing out.

import { applyRouterOsCompatPatch } from '../dist/router-api/ros-compat.js';
import { startMockRouter } from './mock-router.mjs';
import { RouterConnection } from '../dist/router-api/connection.js';

applyRouterOsCompatPatch();

async function main() {
  const server = await startMockRouter(18731);
  const conn = new RouterConnection(
    { host: '127.0.0.1', port: 18731, user: 'admin', password: 'x', timeout: 8000 },
    'v720',
  );

  let crashed = false;
  process.once('uncaughtException', () => { crashed = true; });

  try {
    await conn.connect();

    // This endpoint returns !empty on 7.20+. Must resolve to [] quickly, not
    // throw and not time out.
    const start = Date.now();
    const active = await conn.run('/ip/hotspot/active/print');
    const elapsed = Date.now() - start;

    // A normal read still works alongside it.
    const res = await conn.runStrict('/system/resource/print');
    const version = res[0]?.version;

    await new Promise((r) => setTimeout(r, 300));

    const emptyOk = Array.isArray(active) && active.length === 0;
    const fast = elapsed < 3000; // must NOT hit the 8s timeout
    const versionOk = version?.startsWith('7.2');

    if (emptyOk && fast && versionOk && !crashed) {
      console.log(`✅ SUCCESS — !empty handled as [] in ${elapsed}ms, version ${version}, no crash`);
    } else {
      console.log(`❌ FAIL — emptyOk:${emptyOk} fast:${fast}(${elapsed}ms) versionOk:${versionOk} crashed:${crashed}`);
      process.exitCode = 1;
    }
  } catch (e) {
    console.log('❌ FAIL — threw instead of returning []:', String(e));
    process.exitCode = 1;
  } finally {
    await conn.close();
    server.close();
  }
}
main();
