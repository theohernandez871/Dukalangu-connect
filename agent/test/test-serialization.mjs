// Verifies the connection mutex: many run() calls fired at once must execute
// one-at-a-time (no overlap), preventing "Received data on unregistered tag".

import { startMockRouter } from './mock-router.mjs';
import { RouterConnection } from '../dist/router-api/connection.js';

async function main() {
  const server = await startMockRouter(18732);
  const conn = new RouterConnection(
    { host: '127.0.0.1', port: 18732, user: 'admin', password: 'x', timeout: 8000 },
    'serial',
  );

  // Track how many operations are "in flight" at any moment by wrapping the
  // API write via a probe: we fire 20 concurrent run() calls and assert the
  // mock never sees a second command before the first completes.
  let inFlight = 0;
  let maxConcurrent = 0;
  const origConnect = conn.connect.bind(conn);
  await origConnect();

  // Monkey-patch the private api write to observe concurrency at the socket.
  const api = conn.api ?? conn['api'];
  const origWrite = api.write.bind(api);
  api.write = async (...args) => {
    inFlight++;
    maxConcurrent = Math.max(maxConcurrent, inFlight);
    try {
      return await origWrite(...args);
    } finally {
      inFlight--;
    }
  };

  try {
    // Fire 20 reads concurrently.
    const calls = Array.from({ length: 20 }, () => conn.run('/system/identity/print'));
    const results = await Promise.all(calls);

    const allResolved = results.every((r) => Array.isArray(r));
    const serialized = maxConcurrent === 1;

    if (allResolved && serialized) {
      console.log(`✅ SUCCESS — 20 concurrent calls serialized (max in-flight = ${maxConcurrent}), no tag collision`);
    } else {
      console.log(`❌ FAIL — allResolved:${allResolved} maxConcurrent:${maxConcurrent} (should be 1)`);
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
