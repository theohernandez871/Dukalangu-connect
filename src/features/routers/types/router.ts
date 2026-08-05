export type RouterConnectionType = 'agent' | 'direct';
export type RouterStatus = 'online' | 'offline' | 'unknown' | 'error';

export interface Router {
  id: string;
  companyId: string;
  branchId: string | null;
  branchName: string | null;
  name: string;
  connectionType: RouterConnectionType;
  host: string | null;
  apiPort: number;
  username: string | null;
  status: RouterStatus;
  osVersion: string | null;
  model: string | null;
  lastSeen: string | null;
  // Live metrics (heartbeat)
  cpuLoad: number | null;
  memUsed: number | null;
  memTotal: number | null;
  uptime: string | null;
  boardName: string | null;
  connectedUsers: number | null;
  pingMs: number | null;
  responseMs: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface RouterInput {
  name: string;
  connectionType: RouterConnectionType;
  branchId?: string | null;
  host?: string | null;
  apiPort?: number;
  username?: string | null;
  /** Only sent on create/update; never read back from the server. */
  password?: string | null;
}
