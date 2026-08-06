// Minimal mock of the MikroTik RouterOS API (binary protocol over TCP).
// Enough to let node-routeros connect, log in, and answer a few /system
// commands so we can test the agent end-to-end without real hardware.
//
// Protocol: each "word" is length-prefixed; a "sentence" is a series of words
// terminated by a zero-length word. Post-v6.43 login is plaintext-capable.

import net from 'node:net';

function encodeLength(n) {
  if (n < 0x80) return Buffer.from([n]);
  if (n < 0x4000) { const b = Buffer.alloc(2); b.writeUInt16BE(n | 0x8000); return b; }
  if (n < 0x200000) { const b = Buffer.alloc(3); b[0] = (n >> 16) | 0xc0; b.writeUInt16BE(n & 0xffff, 1); return b; }
  const b = Buffer.alloc(4); b.writeUInt32BE(n | 0xe0000000); return b;
}
function encodeWord(w) { const s = Buffer.from(w, 'utf8'); return Buffer.concat([encodeLength(s.length), s]); }
function encodeSentence(words) { return Buffer.concat([...words.map(encodeWord), Buffer.from([0])]); }

// Simple length decoder for incoming words.
function makeDecoder(onSentence) {
  let buf = Buffer.alloc(0);
  let words = [];
  return (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length === 0) return;
      const first = buf[0];
      let len, header;
      if (first === 0) { header = 1; len = 0; }
      else if ((first & 0x80) === 0) { header = 1; len = first; }
      else if ((first & 0xc0) === 0x80) { if (buf.length < 2) return; header = 2; len = buf.readUInt16BE(0) & 0x3fff; }
      else if ((first & 0xe0) === 0xc0) { if (buf.length < 3) return; header = 3; len = ((first & 0x1f) << 16) | buf.readUInt16BE(1); }
      else { if (buf.length < 4) return; header = 4; len = buf.readUInt32BE(0) & 0x1fffffff; }
      if (buf.length < header + len) return;
      if (len === 0) { const s = words; words = []; buf = buf.subarray(header); onSentence(s); continue; }
      words.push(buf.subarray(header, header + len).toString('utf8'));
      buf = buf.subarray(header + len);
    }
  };
}

const REPLIES = {
  '/system/resource/print': {
    '=cpu-load': '7', '=free-memory': '104857600', '=total-memory': '268435456',
    '=uptime': '1w2d3h', '=version': '7.21.5 (stable)', '=board-name': 'hAP ac2',
  },
  '/system/identity/print': { '=name': 'MikroTik-Mock' },
  '/ip/hotspot/active/print': null, // empty list -> replies !empty on 7.20+
};

export function startMockRouter(port = 8728) {
  const server = net.createServer((socket) => {
    const send = (words) => socket.write(encodeSentence(words));
    const decode = makeDecoder((sentence) => {
      const cmd = sentence[0];
      // node-routeros attaches a .tag=N to each sentence; echo it back so the
      // library can match the reply to its pending write().
      const tagWord = sentence.find((w) => w.startsWith('.tag='));
      const withTag = (words) => (tagWord ? [...words, tagWord] : words);

      if (cmd === '/login') {
        send(withTag(['!done']));
      } else if (cmd === '/ip/hotspot/user/add') {
        // RouterOS returns the new internal id on a successful add.
        send(withTag(['!done', '=ret=*1A']));
      } else if (REPLIES[cmd] !== undefined) {
        const data = REPLIES[cmd];
        if (data) {
          send(withTag(['!re', ...Object.entries(data).map(([k, v]) => `${k}=${v}`)]));
          send(withTag(['!done']));
        } else {
          // RouterOS 7.20+/7.21 answers an empty print with !empty FOLLOWED BY
          // !done (two replies on the same tag). This reproduces the exact
          // "unregistered tag" scenario the agent must survive.
          send(withTag(['!empty']));
          send(withTag(['!done']));
        }
      } else {
        send(withTag(['!done']));
      }
    });
    socket.on('data', decode);
    socket.on('error', () => {});
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

// Allow running standalone: `node test/mock-router.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  startMockRouter(8728).then(() => console.log('Mock RouterOS API on 127.0.0.1:8728'));
}
