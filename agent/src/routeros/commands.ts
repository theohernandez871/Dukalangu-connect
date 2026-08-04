import type { RouterClient } from './client.js';

/**
 * Maps each whitelisted command key to a RouterOS operation.
 * Read commands return records; mutating commands act on a `.id` from params.
 * Keep this in sync with the frontend commandCatalog.
 */

type Handler = (
  client: RouterClient,
  params: Record<string, unknown>,
) => Promise<unknown>;

function idParam(params: Record<string, unknown>): string {
  const id = params.id;
  if (typeof id !== 'string' || !id) throw new Error('id inahitajika');
  return id;
}

export const COMMAND_HANDLERS: Record<string, Handler> = {
  // --- Read: system ---
  identity: (c) => c.write('/system/identity/print'),
  resource: async (c) => {
    const rows = await c.write('/system/resource/print');
    return rows[0] ?? {};
  },

  // --- Read: hotspot ---
  'hotspot.active': (c) => c.write('/ip/hotspot/active/print'),
  'hotspot.users': (c) => c.write('/ip/hotspot/user/print'),
  'hotspot.profiles': (c) => c.write('/ip/hotspot/user/profile/print'),

  // --- Read: pppoe ---
  'pppoe.secrets': (c) => c.write('/ppp/secret/print'),
  'pppoe.active': (c) => c.write('/ppp/active/print'),
  'ppp.profiles': (c) => c.write('/ppp/profile/print'),

  // --- Read: network ---
  'dhcp.leases': (c) => c.write('/ip/dhcp-server/lease/print'),
  'queue.simple': (c) => c.write('/queue/simple/print'),
  'firewall.filter': (c) => c.write('/ip/firewall/filter/print'),

  // --- Mutating ---
  'hotspot.kick': (c, p) => c.write('/ip/hotspot/active/remove', [`=.id=${idParam(p)}`]),
  'pppoe.disconnect': (c, p) => c.write('/ppp/active/remove', [`=.id=${idParam(p)}`]),
};

export function isKnownCommand(key: string): boolean {
  return key in COMMAND_HANDLERS;
}
