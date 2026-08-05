// Test the sync-engine collectMetrics + a command against the mock router.
import { startMockRouter } from './mock-router.mjs';
import { RouterConnection } from '../dist/router-api/connection.js';
import { collectMetrics } from '../dist/sync-engine/collect.js';
import { handleCommand } from '../dist/command-handler/handler.js';

async function main() {
  const server = await startMockRouter(18729);
  const conn = new RouterConnection(
    { host: '127.0.0.1', port: 18729, user: 'admin', password: 'test', timeout: 8000 },
    'mock',
  );
  try {
    await conn.connect();

    const metrics = await collectMetrics(conn);
    console.log('METRICS:', JSON.stringify(metrics, null, 2));

    const cmdResult = await handleCommand(conn, { id: 'test-1', command: 'identity', args: {} });
    console.log('COMMAND identity:', JSON.stringify(cmdResult, null, 2));

    const ok = metrics.version && metrics.cpuLoad !== null && cmdResult.ok;
    console.log(ok ? '\n✅ SUCCESS — metrics + command work' : '\n❌ FAIL');
    process.exitCode = ok ? 0 : 1;
  } catch (e) {
    console.log('❌ ERROR:', String(e));
    process.exitCode = 1;
  } finally {
    await conn.close();
    server.close();
  }
}
main();
