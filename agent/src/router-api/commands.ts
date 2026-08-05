// Maps server command keys to RouterOS API paths. Read commands return data;
// mutating commands accept an argument (id or param object).

export interface CommandSpec {
  path: string;
  mutating: boolean;
}

export const READ_COMMANDS: Record<string, string> = {
  identity: '/system/identity/print',
  resource: '/system/resource/print',
  'hotspot.active': '/ip/hotspot/active/print',
  'hotspot.users': '/ip/hotspot/user/print',
  'hotspot.profiles': '/ip/hotspot/user/profile/print',
  'pppoe.secrets': '/ppp/secret/print',
  'pppoe.active': '/ppp/active/print',
  'ppp.profiles': '/ppp/profile/print',
  'dhcp.leases': '/ip/dhcp-server/lease/print',
  'queue.simple': '/queue/simple/print',
  'firewall.filter': '/ip/firewall/filter/print',
};

/** The set of "kinds" the sync engine pushes to the dashboard cache. */
export const SYNC_KINDS: string[] = [
  'hotspot.active',
  'hotspot.users',
  'hotspot.profiles',
  'pppoe.secrets',
  'pppoe.active',
  'ppp.profiles',
  'dhcp.leases',
  'queue.simple',
  'firewall.filter',
];

export function isReadCommand(cmd: string): boolean {
  return cmd in READ_COMMANDS;
}
