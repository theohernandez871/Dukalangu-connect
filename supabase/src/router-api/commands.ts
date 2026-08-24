// Maps server command keys to RouterOS API paths. Read commands return data;
// mutating commands accept an argument (id or param object). The sync set is
// the full list pulled by sync.all and pushed to the dashboard cache.

export const READ_COMMANDS: Record<string, string> = {
  // System
  identity: '/system/identity/print',
  resource: '/system/resource/print',
  health: '/system/health/print',
  clock: '/system/clock/print',
  routerboard: '/system/routerboard/print',
  license: '/system/license/print',
  packages: '/system/package/print',

  // Network
  interfaces: '/interface/print',
  'ip.address': '/ip/address/print',
  routes: '/ip/route/print',
  'dns.settings': '/ip/dns/print',
  bridge: '/interface/bridge/print',
  wireless: '/interface/wireless/print',

  // DHCP
  'dhcp.servers': '/ip/dhcp-server/print',
  'dhcp.leases': '/ip/dhcp-server/lease/print',

  // Hotspot
  'hotspot.servers': '/ip/hotspot/print',
  'hotspot.active': '/ip/hotspot/active/print',
  'hotspot.users': '/ip/hotspot/user/print',
  'hotspot.profiles': '/ip/hotspot/user/profile/print',
  'hotspot.hosts': '/ip/hotspot/host/print',
  'hotspot.bindings': '/ip/hotspot/ip-binding/print',

  // PPP / PPPoE
  'pppoe.secrets': '/ppp/secret/print',
  'pppoe.active': '/ppp/active/print',
  'ppp.profiles': '/ppp/profile/print',

  // Queues + firewall
  'queue.simple': '/queue/simple/print',
  'firewall.filter': '/ip/firewall/filter/print',
  'firewall.nat': '/ip/firewall/nat/print',

  // CAPsMAN (present only if the package is enabled)
  'capsman.registrations': '/caps-man/registration-table/print',
};

/**
 * The kinds sync.all pushes to the dashboard cache. Some (wireless, capsman)
 * may not exist on every device/version — run() returns [] for those safely.
 */
export const SYNC_KINDS: string[] = [
  'identity',
  'resource',
  'health',
  'clock',
  'routerboard',
  'license',
  'packages',
  'interfaces',
  'ip.address',
  'routes',
  'dns.settings',
  'bridge',
  'wireless',
  'dhcp.servers',
  'dhcp.leases',
  'hotspot.servers',
  'hotspot.active',
  'hotspot.users',
  'hotspot.profiles',
  'hotspot.hosts',
  'hotspot.bindings',
  'pppoe.secrets',
  'pppoe.active',
  'ppp.profiles',
  'queue.simple',
  'firewall.filter',
  'firewall.nat',
  'capsman.registrations',
];

/**
 * Resources that don't exist on every RouterOS device/version. We probe for
 * them once; if a probe returns nothing usable or errors, the kind is skipped
 * on future syncs. `run()` already returns [] safely, so this is an
 * optimization + clean logging, not a safety requirement.
 *   - health: absent on CHR and some x86 builds (no hardware sensors)
 *   - wireless: absent when using wifiwave2/wifi package instead of legacy
 *   - capsman: only when the CAPsMAN package is enabled
 */
export const OPTIONAL_KINDS = new Set<string>([
  'health',
  'wireless',
  'capsman.registrations',
]);

export function isReadCommand(cmd: string): boolean {
  return cmd in READ_COMMANDS;
}
