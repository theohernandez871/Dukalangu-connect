/** Shapes returned by the agent for each RouterOS command. */

export interface RouterResource {
  'cpu-load'?: string;
  'free-memory'?: string;
  'total-memory'?: string;
  uptime?: string;
  version?: string;
  'board-name'?: string;
}

export interface HotspotActive {
  '.id': string;
  user?: string;
  address?: string;
  'mac-address'?: string;
  uptime?: string;
  'bytes-in'?: string;
  'bytes-out'?: string;
}

export interface HotspotUser {
  '.id': string;
  name?: string;
  profile?: string;
  'limit-uptime'?: string;
  disabled?: string;
}

export interface PppSecret {
  '.id': string;
  name?: string;
  service?: string;
  profile?: string;
  disabled?: string;
}

export interface PppActive {
  '.id': string;
  name?: string;
  address?: string;
  uptime?: string;
  'caller-id'?: string;
}

export interface DhcpLease {
  '.id': string;
  address?: string;
  'mac-address'?: string;
  host?: string;
  status?: string;
}

export interface SimpleQueue {
  '.id': string;
  name?: string;
  target?: string;
  'max-limit'?: string;
  disabled?: string;
}

export interface FirewallRule {
  '.id': string;
  chain?: string;
  action?: string;
  protocol?: string;
  comment?: string;
  disabled?: string;
}

export interface HotspotServer {
  '.id': string;
  name?: string;
  interface?: string;
  profile?: string;
  disabled?: string;
}

export interface HotspotProfile {
  '.id': string;
  name?: string;
  'rate-limit'?: string;
  'session-timeout'?: string;
  'shared-users'?: string;
}

export interface IpBinding {
  '.id': string;
  'mac-address'?: string;
  address?: string;
  'to-address'?: string;
  type?: string;
  comment?: string;
  disabled?: string;
}
