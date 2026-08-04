export type OmadaConnectionType = 'cloud' | 'local';
export type OmadaStatus = 'online' | 'offline' | 'unknown' | 'error';

export interface OmadaController {
  id: string;
  companyId: string;
  branchId: string | null;
  branchName: string | null;
  name: string;
  connectionType: OmadaConnectionType;
  baseUrl: string | null;
  omadacId: string | null;
  siteId: string | null;
  username: string | null;
  status: OmadaStatus;
  lastSeen: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OmadaControllerInput {
  name: string;
  connectionType: OmadaConnectionType;
  branchId?: string | null;
  baseUrl?: string | null;
  omadacId?: string | null;
  siteId?: string | null;
  username?: string | null;
  password?: string | null;
}

/** Normalized device/client shapes for display. */
export interface OmadaDevice {
  mac: string;
  name?: string;
  type?: string;
  status?: number;
  model?: string;
  ip?: string;
  uptime?: string;
}

export interface OmadaClient {
  mac: string;
  name?: string;
  hostName?: string;
  ip?: string;
  signalLevel?: number;
  ssid?: string;
  trafficDown?: number;
  trafficUp?: number;
}
