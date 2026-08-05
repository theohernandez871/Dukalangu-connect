// RouterOS API client wrapper (ports 8728/8729) with connect + auto-reconnect.
// Uses node-routeros, which speaks the binary API protocol for v6 and v7.
//
// Robustness (RouterOS 7.20+ / UNKNOWNREPLY):
//  - An error listener is attached to the API so async socket errors (emitted
//    outside our await) are captured instead of crashing the process.
//  - Every command is wrapped; a single failed command never kills the agent.
//  - The command and any response detail are logged before we recover.

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
  private lastError: string | null = null;

  constructor(private readonly creds: RouterCredentials, private readonly label: string) {}

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    if (this.connected && this.api) return;
    if (!this.creds.host) {
      throw new Error(
        `Router ${this.label} haina IP (host). Nenda dashboardi -> Routers -> Hariri -> weka IP.`,
      );
    }
    log.info(`Najaribu kuunganisha: ${this.label} (${this.creds.host}:${this.creds.port}, user=${this.creds.user})`);
    const api = new RouterOSAPI({
      host: this.creds.host,
      port: this.creds.port,
      user: this.creds.user,
      password: this.creds.password,
      timeout: Math.ceil(this.creds.timeout / 1000),
      // Library keepalive sends periodic probes that can trigger UNKNOWNREPLY
      // on RouterOS 7.20+. We disable it and drive reconnection from our own
      // heartbeat/poll loops instead — more predictable and 7.20-safe.
      keepalive: false,
    });

    // Capture async errors (e.g. UNKNOWNREPLY) emitted by the socket after
    // connect, so they are logged and handled rather than crashing Node.
    api.on('error', (err: unknown) => {
      this.lastError = String(err);
      this.connected = false;
      log.warn(`Socket error (${this.label}) — connection itafunguliwa upya`, String(err));
    });

    try {
      await api.connect();
      this.api = api;
      this.connected = true;
      this.lastError = null;
      log.info(`Imeunganishwa: ${this.label} (${this.creds.host}:${this.creds.port})`);
    } catch (e) {
      this.connected = false;
      this.api = null;
      log.error(`Imeshindwa kuunganisha ${this.label}: ${String(e)}`);
      throw e;
    }
  }

  /**
   * Run a single command. Never throws to the caller — returns [] on failure so
   * one bad command cannot abort the polling/sync loop. Logs the command and
   * any RouterOS response detail before recovering. Reconnects once on error.
   */
  async run(path: string, params: string[] = []): Promise<Record<string, string>[]> {
    try {
      if (!this.api || !this.connected) await this.connect();
      const res = await this.api!.write(path, params);
      return res as Record<string, string>[];
    } catch (e) {
      log.warn(`Amri imeshindwa (${this.label}): "${path}" ${params.length ? JSON.stringify(params) : ''} -> ${String(e)}`);
      this.connected = false;
      // One guarded retry after a fresh reconnect.
      try {
        await this.connect();
        const res = await this.api!.write(path, params);
        log.info(`Amri "${path}" imefanikiwa baada ya kuunganisha upya (${this.label})`);
        return res as Record<string, string>[];
      } catch (e2) {
        log.error(`Amri "${path}" imeshindwa tena baada ya reconnect (${this.label}): ${String(e2)}`);
        // Swallow: caller (sync/heartbeat) treats [] as "not available" and
        // keeps the agent running. Router stays online via other successful reads.
        return [];
      }
    }
  }

  /** Like run() but signals failure via throw — used only where the caller
   *  explicitly needs to know (e.g. the initial heartbeat connectivity probe). */
  async runStrict(path: string, params: string[] = []): Promise<Record<string, string>[]> {
    if (!this.api || !this.connected) await this.connect();
    const res = await this.api!.write(path, params);
    return res as Record<string, string>[];
  }

  getLastError(): string | null {
    return this.lastError;
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
