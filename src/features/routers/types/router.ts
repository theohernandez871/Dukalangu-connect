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
