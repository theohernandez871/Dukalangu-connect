// RouterOS 7.20+ compatibility patch for node-routeros v1.6.9.
//
// Problem: RouterOS 7.20+ can answer an empty /print with the reply word
// `!empty`. node-routeros only knows `!re`, `!done`, `!trap`; anything else
// hits `emit('unknown')` -> onUnknown() -> throws UNKNOWNREPLY from inside an
// EventEmitter listener. That throw escapes the write() promise and surfaces as
// an uncaughtException, then the pending write() times out ("Timed out after 8
// seconds") and the router flips Offline.
//
// Fix: wrap Channel.prototype.processDataPacket so a `!empty` (or unknown-but-
// harmless terminator) reply is treated as a normal `!done` with no rows. We do
// NOT edit files in node_modules; this patches the loaded prototype at runtime,
// once, before any connection is opened. If the library internals change, the
// patch degrades gracefully (guards below) and the existing !empty handling in
// connection.ts still converts the error to an empty array.

import { createRequire } from 'node:module';
import { createLogger } from '../logging/logger.js';

const require = createRequire(import.meta.url);
const log = createLogger('ros-compat');

let patched = false;

export function applyRouterOsCompatPatch(): void {
  if (patched) return;
  patched = true;

  try {
    // The Channel class isn't a public export; reach it via the package's
    // compiled module.
    const mod = require('node-routeros/dist/Channel.js');
    const Channel = mod?.Channel;
    if (!Channel?.prototype?.processPacket) {
      log.warn('Channel.processPacket haipatikani — naruka patch (connection.ts inashughulikia !empty)');
      return;
    }

    const original = Channel.prototype.processPacket;
    if (typeof original !== 'function') {
      log.warn('Channel.processPacket haipatikani — naruka patch (connection.ts inashughulikia !empty)');
      return;
    }

    Channel.prototype.processPacket = function patched(packet: string[]) {
      try {
        // processPacket shifts the reply word off the front; peek without
        // mutating so we can fall through to the original untouched.
        const reply = Array.isArray(packet) ? packet[0] : undefined;
        if (reply === '!empty') {
          // Mirror the !done path: emit done with accumulated (empty) data,
          // then close — no throw, no timeout.
          if (!this.trapped) this.emit('done', this.data ?? []);
          this.close();
          return;
        }
      } catch (e) {
        log.warn('Patch ya !empty imekutana na hitilafu ndogo', String(e));
      }
      return original.apply(this, [packet]);
    };

    log.info('RouterOS 7.20+ compatibility patch imewekwa (!empty -> done)');
  } catch (e) {
    // Non-fatal: connection.ts still converts UNKNOWNREPLY(!empty) to [].
    log.warn('Imeshindwa kuweka patch ya node-routeros (si mbaya)', String(e));
  }
}
