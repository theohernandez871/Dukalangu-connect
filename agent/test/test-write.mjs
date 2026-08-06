// Verifies the write path: hotspot.create_voucher sends /ip/hotspot/user/add
// to RouterOS and reports success (ok:true) with the returned id.

import { startMockRouter } from './mock-router.mjs';
import { RouterConnection } from '../dist/router-api/connection.js';
import { handleCommand } from '../dist/command-handler/handler.js';

async function main() {
  const server = await startMockRouter(18734);
  const conn = new RouterConnection(
    { host: '127.0.0.1', port: 18734, user: 'admin', password: 'x', timeout: 8000 },
    'write',
  );
  try {
    await conn.connect();

    const result = await handleCommand(conn, {
      id: 'cmd-1',
      command: 'hotspot.create_voucher',
      args: { code: '12345678', profile: 'default', comment: 'voucher:test' },
    });

    // handleCommand returns ok:true and the RouterOS response (with =ret=).
    const ok = result.ok === true;
    const gotId = JSON.stringify(result.data).includes('ret') || Array.isArray(result.data);

    if (ok && gotId) {
      console.log('✅ SUCCESS — create_voucher wrote to RouterOS, ok:true, response:', JSON.stringify(result.data));
    } else {
      console.log(`❌ FAIL — ok:${result.ok} data:${JSON.stringify(result.data)} error:${result.error}`);
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
