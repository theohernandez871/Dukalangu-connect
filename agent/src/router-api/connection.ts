// RouterOS API client wrapper (ports 8728/8729) with connect + auto-reconnect.
// Uses node-routeros, which speaks the binary API protocol for v6 and v7.

import { RouterOSAPI } from 'node-routeros';
import { createLogger } from '../logging/logger.js';

const log = createLogger('router-api');

export interface RouterCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  timeout: number;
}

export class RouterConnection {
  private api: RouterOSAPI | null = null;
  private connected = false;

  constructor(private readonly creds: RouterCredentials, private readonly label: string) {}

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    log.info(`Najaribu kuunganisha: ${this.label} (${this.creds.host}:${this.creds.port}, user=${this.creds.user})`);
    this.api = new RouterOSAPI({
      host: this.creds.host,
      port: this.creds.port,
      user: this.creds.user,
      password: this.creds.password,
      timeout: Math.ceil(this.creds.timeout / 1000),
    });
    try {
      await this.api.connect();
      this.connected = true;
      log.info(`Imeunganishwa: ${this.label} (${this.creds.host}:${this.creds.port})`);
    } catch (e) {
      this.connected = false;
      log.error(`Imeshindwa kuunganisha ${this.label} (${this.creds.host}:${this.creds.port}): ${String(e)}`);
      throw e;
    }
  }

  /** Run a command; on connection loss, reconnect once and retry. */
  async run(path: string, params: string[] = []): Promise<Record<string, string>[]> {
    if (!this.api || !this.connected) await this.connect();
    try {
      const res = await this.api!.write(path, params);
      return res as Record<string, string>[];
    } catch (e) {
      log.warn(`Amri imeshindwa (${this.label}), najaribu kuunganisha upya`, String(e));
      this.connected = false;
      await this.connect();
      const res = await this.api!.write(path, params);
      return res as Record<string, string>[];
    }
  }

  async close(): Promise<void> {
    try {
      await this.api?.close();
    } catch {
      // ignore
    }
    this.connected = false;
    this.api = null;
  }
}
