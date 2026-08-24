/**
 * RouterOS command catalog.
 * Whitelist of commands the UI may enqueue. The agent (Phase 4d) maps each
 * `command` to the matching RouterOS API path. Anything not listed here is
 * rejected client-side, preventing arbitrary/raw commands to the router.
 */

export type RouterCommandKey =
  | 'identity'
  | 'resource'
  | 'sync.all'
  | 'hotspot.active'
  | 'hotspot.users'
  | 'hotspot.profiles'
  | 'hotspot.kick'
  | 'hotspot.create_user'
  | 'hotspot.delete_user'
  | 'hotspot.enable_user'
  | 'hotspot.disable_user'
  | 'hotspot.create_voucher'
  | 'hotspot.create_profile'
  | 'hotspot.update_profile'
  | 'hotspot.servers'
  | 'hotspot.bindings'
  | 'pppoe.secrets'
  | 'pppoe.active'
  | 'pppoe.disconnect'
  | 'ppp.profiles'
  | 'dhcp.leases'
  | 'queue.simple'
  | 'firewall.filter'
  | 'agent.restart';

export interface CommandMeta {
  key: RouterCommandKey;
  label: string;
  /** Whether this command changes router state (needs router:manage + audit). */
  mutating: boolean;
}

export const COMMAND_CATALOG: Record<RouterCommandKey, CommandMeta> = {
  identity: { key: 'identity', label: 'Kitambulisho', mutating: false },
  resource: { key: 'resource', label: 'Rasilimali (CPU/RAM)', mutating: false },
  'sync.all': { key: 'sync.all', label: 'Sync yote', mutating: false },
  'hotspot.active': { key: 'hotspot.active', label: 'Watumiaji hai (Hotspot)', mutating: false },
  'hotspot.users': { key: 'hotspot.users', label: 'Watumiaji wote (Hotspot)', mutating: false },
  'hotspot.profiles': { key: 'hotspot.profiles', label: 'Profiles za Hotspot', mutating: false },
  'hotspot.kick': { key: 'hotspot.kick', label: 'Ondoa mtumiaji', mutating: true },
  'hotspot.create_user': { key: 'hotspot.create_user', label: 'Tengeneza voucher/user', mutating: true },
  'hotspot.delete_user': { key: 'hotspot.delete_user', label: 'Futa voucher/user', mutating: true },
  'hotspot.enable_user': { key: 'hotspot.enable_user', label: 'Wezesha user', mutating: true },
  'hotspot.disable_user': { key: 'hotspot.disable_user', label: 'Zima user', mutating: true },
  'hotspot.create_voucher': { key: 'hotspot.create_voucher', label: 'Tengeneza voucher', mutating: true },
  'hotspot.create_profile': { key: 'hotspot.create_profile', label: 'Tengeneza package/profile', mutating: true },
  'hotspot.update_profile': { key: 'hotspot.update_profile', label: 'Sasisha package/profile', mutating: true },
  'hotspot.servers': { key: 'hotspot.servers', label: 'Hotspot Servers', mutating: false },
  'hotspot.bindings': { key: 'hotspot.bindings', label: 'IP Bindings', mutating: false },
  'pppoe.secrets': { key: 'pppoe.secrets', label: 'Akaunti za PPPoE', mutating: false },
  'pppoe.active': { key: 'pppoe.active', label: 'Muunganisho hai (PPPoE)', mutating: false },
  'pppoe.disconnect': { key: 'pppoe.disconnect', label: 'Kata muunganisho', mutating: true },
  'ppp.profiles': { key: 'ppp.profiles', label: 'Profiles za PPP', mutating: false },
  'dhcp.leases': { key: 'dhcp.leases', label: 'DHCP Leases', mutating: false },
  'queue.simple': { key: 'queue.simple', label: 'Simple Queues', mutating: false },
  'firewall.filter': { key: 'firewall.filter', label: 'Firewall (kusoma)', mutating: false },
  'agent.restart': { key: 'agent.restart', label: 'Restart Agent', mutating: true },
};

export function isValidCommand(key: string): key is RouterCommandKey {
  return key in COMMAND_CATALOG;
}
