// RouterOS 7.20+ compatibility patch for node-routeros v1.6.9.
//
// Problem: RouterOS 7.20+ answers an empty /print with a `!empty` reply word,
// and crucially sends it FOLLOWED BY `!done`. node-routeros only knows
// `!re`/`!done`/`!trap`; `!empty` hits the default branch which does
// emit('unknown') (throws UNKNOWNREPLY) AND close() (removes the tag). Then the
// trailing `!done` arrives for a tag that no longer exists -> the Receiver
// throws UNREGISTEREDTAG ("Received data on unregistered tag") -> socket error
// -> write() times out -> router flips Offline.
//
// Root-cause fix: treat `!empty` as a harmless no-op marker — do NOT throw and
// do NOT close the channel. The `!done` that RouterOS sends right after is what
// legitimately completes and closes the channel (removing the tag exactly
// once). This keeps tag registration consistent and the connection persistent.
//
// We patch the loaded prototype at runtime (not node_modules) so npm install
// can't wipe it. connection.ts also treats any UNKNOWNREPLY(!empty) as [] as a
// secondary safety net.

import { createRequire } from 'node:module';
import { createLogger } from '../logging/logger.js';

const require = createRequire(import.meta.url);
const log = createLogger('ros-compat');

let patched = false;

export function applyRouterOsCompatPatch(): void {
  if (patched) return;
  patched = true;

  try {
    const mod = require('node-routeros/dist/Channel.js');
    const Channel = mod?.Channel;
    if (typeof Channel?.prototype?.processPacket !== 'function') {
      log.warn('Channel.processPacket haipatikani — naruka patch (connection.ts inashughulikia !empty)');
      return;
    }

    const original = Channel.prototype.processPacket;

    Channel.prototype.processPacket = function patchedProcessPacket(packet: string[]) {
      try {
        const reply = Array.isArray(packet) ? packet[0] : undefined;
        if (reply === '!empty') {
          // Empty result set. Do NOT throw and do NOT close — the trailing
          // !done from RouterOS 7.20+ will complete and close the channel
          // exactly once, keeping the request tag registered until then.
          log.debug('Reply !empty imepokelewa — natambua kama tupu, nasubiri !done');
          return;
        }
      } catch (e) {
        log.warn('Patch ya !empty imekutana na hitilafu ndogo', String(e));
      }
      return original.apply(this, [packet]);
    };

    log.info('RouterOS 7.20+ compatibility patch imewekwa (!empty = no-op, !done inafunga)');
  } catch (e) {
    log.warn('Imeshindwa kuweka patch ya node-routeros (si mbaya)', String(e));
  }
}
