/**
 * RouterOS command catalog.
 * Whitelist of commands the UI may enqueue. The agent (Phase 4d) maps each
 * `command` to the matching RouterOS API path. Anything not listed here is
 * rejected client-side, preventing arbitrary/raw commands to the router.
 */

export type RouterCommandKey =
  | 'identity'
  | 'resource'
  | 'hotspot.active'
  | 'hotspot.users'
  | 'hotspot.profiles'
  | 'hotspot.kick'
  | 'pppoe.secrets'
  | 'pppoe.active'
  | 'pppoe.disconnect'
  | 'ppp.profiles'
  | 'dhcp.leases'
  | 'queue.simple'
  | 'firewall.filter';

export interface CommandMeta {
  key: RouterCommandKey;
  label: string;
  /** Whether this command changes router state (needs router:manage + audit). */
  mutating: boolean;
}

export const COMMAND_CATALOG: Record<RouterCommandKey, CommandMeta> = {
  identity: { key: 'identity', label: 'Kitambulisho', mutating: false },
  resource: { key: 'resource', label: 'Rasilimali (CPU/RAM)', mutating: false },
  'hotspot.active': { key: 'hotspot.active', label: 'Watumiaji hai (Hotspot)', mutating: false },
  'hotspot.users': { key: 'hotspot.users', label: 'Watumiaji wote (Hotspot)', mutating: false },
  'hotspot.profiles': { key: 'hotspot.profiles', label: 'Profiles za Hotspot', mutating: false },
  'hotspot.kick': { key: 'hotspot.kick', label: 'Ondoa mtumiaji', mutating: true },
  'pppoe.secrets': { key: 'pppoe.secrets', label: 'Akaunti za PPPoE', mutating: false },
  'pppoe.active': { key: 'pppoe.active', label: 'Muunganisho hai (PPPoE)', mutating: false },
  'pppoe.disconnect': { key: 'pppoe.disconnect', label: 'Kata muunganisho', mutating: true },
  'ppp.profiles': { key: 'ppp.profiles', label: 'Profiles za PPP', mutating: false },
  'dhcp.leases': { key: 'dhcp.leases', label: 'DHCP Leases', mutating: false },
  'queue.simple': { key: 'queue.simple', label: 'Simple Queues', mutating: false },
  'firewall.filter': { key: 'firewall.filter', label: 'Firewall (kusoma)', mutating: false },
};

export function isValidCommand(key: string): key is RouterCommandKey {
  return key in COMMAND_CATALOG;
}
