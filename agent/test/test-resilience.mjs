// Resilience test: prove that a failing command returns [] (not a throw/crash)
// so the polling loop keeps running. Uses a mock that accepts login but drops
// the socket on the first data command, simulating UNKNOWNREPLY-style faults.

import net from 'node:net';
import { RouterConnection } from '../dist/router-api/connection.js';

// Minimal length-prefixed framing (same as mock-router).
function encLen(n) {
  if (n < 0x80) return Buffer.from([n]);
  const b = Buffer.alloc(2); b.writeUInt16BE(n | 0x8000); return b;
}
function encWord(w) { const s = Buffer.from(w, 'utf8'); return Buffer.concat([encLen(s.length), s]); }
function encSentence(words) { return Buffer.concat([...words.map(encWord), Buffer.from([0])]); }

function startFlakyRouter(port) {
  let commandCount = 0;
  const server = net.createServer((socket) => {
    let buf = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      // Very rough: detect a full sentence by a trailing zero byte.
      if (buf.includes(0)) {
        const text = buf.toString('utf8');
        buf = Buffer.alloc(0);
        if (text.includes('/login')) {
          socket.write(encSentence(['!done']));
        } else {
          commandCount++;
          // Drop the connection mid-reply to simulate a fault.
          socket.destroy();
        }
      }
    });
    socket.on('error', () => {});
  });
  return new Promise((res) => server.listen(port, '127.0.0.1', () => res(server)));
}

async function main() {
  const server = await startFlakyRouter(18730);
  const conn = new RouterConnection(
    { host: '127.0.0.1', port: 18730, user: 'admin', password: 'x', timeout: 3000 },
    'flaky',
  );

  let crashed = false;
  process.once('uncaughtException', () => { crashed = true; });

  try {
    // run() must NOT throw even though the command fails — it returns [].
    const result = await conn.run('/system/resource/print');
    const survived = Array.isArray(result) && result.length === 0;
    await new Promise((r) => setTimeout(r, 300)); // let any async error surface

    if (survived && !crashed) {
      console.log('✅ SUCCESS — command failed gracefully ([]), process did NOT crash');
    } else {
      console.log('❌ FAIL — survived:', survived, 'crashed:', crashed);
      process.exitCode = 1;
    }
  } catch (e) {
    console.log('❌ FAIL — run() threw instead of returning []:', String(e));
    process.exitCode = 1;
  } finally {
    await conn.close();
    server.close();
  }
}
main();
