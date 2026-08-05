// End-to-end test: start the mock RouterOS server, then use the agent's own
// compiled RouterConnection to connect, log in, and read resource + identity.
// Verifies the RouterOS API path works before touching real hardware.

import { startMockRouter } from './mock-router.mjs';
import { RouterConnection } from '../dist/router-api/connection.js';

async function main() {
  const server = await startMockRouter(18728);
  console.log('Mock router listening on 127.0.0.1:18728');

  const conn = new RouterConnection(
    { host: '127.0.0.1', port: 18728, user: 'admin', password: 'test', timeout: 8000 },
    'mock',
  );

  try {
    await conn.connect();
    console.log('CONNECT OK');

    const res = await conn.runStrict('/system/resource/print');
    console.log('RESOURCE:', JSON.stringify(res[0] ?? {}, null, 2));

    const ident = await conn.runStrict('/system/identity/print');
    console.log('IDENTITY:', JSON.stringify(ident[0] ?? {}, null, 2));

    const version = res[0]?.version;
    if (version) {
      console.log('\n✅ SUCCESS — RouterOS version read:', version);
    } else {
      console.log('\n❌ FAIL — no version in response');
      process.exitCode = 1;
    }
  } catch (e) {
    console.log('\n❌ CONNECTION FAILED:', String(e));
    process.exitCode = 1;
  } finally {
    await conn.close();
    server.close();
  }
}

main();
