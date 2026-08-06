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
import { applyRouterOsCompatPatch } from './ros-compat.js';

// Ensure the RouterOS 7.20+ compatibility patch is applied before any
// connection is created, regardless of which entry point loaded us.
applyRouterOsCompatPatch();

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
   * Detect the RouterOS 7.20+ `!empty` reply that node-routeros v1.6.9 does
   * not understand and raises as UNKNOWNREPLY. It simply means "no rows", so we
   * treat it as an empty result rather than an error.
   */
  private isEmptyReply(e: unknown): boolean {
    const s = String(e);
    return s.includes('UNKNOWNREPLY') && (s.includes('!empty') || s.includes('empty'));
  }

  /**
   * Run a single command. Never throws to the caller — returns [] on failure so
   * one bad command cannot abort the polling/sync loop. Logs the command and
   * any RouterOS response detail before recovering. Reconnects once on error.
   */
  async run(path: string, params: string[] = []): Promise<Record<string, string>[]> {
    const start = Date.now();
    try {
      if (!this.api || !this.connected) await this.connect();
      const res = await this.api!.write(path, params);
      log.debug(`Amri "${path}" OK (${Date.now() - start}ms, rows=${Array.isArray(res) ? res.length : 0})`);
      return res as Record<string, string>[];
    } catch (e) {
      // RouterOS 7.20+ empty print: not an error, just no rows.
      if (this.isEmptyReply(e)) {
        log.debug(`Amri "${path}" imerudisha tupu (!empty) — ni sawa`);
        return [];
      }
      log.warn(`Amri imeshindwa (${this.label}): "${path}" ${params.length ? JSON.stringify(params) : ''} -> ${String(e)}`);
      this.connected = false;
      // One guarded retry after a fresh reconnect.
      try {
        await this.connect();
        const res = await this.api!.write(path, params);
        log.info(`Amri "${path}" imefanikiwa baada ya kuunganisha upya (${this.label})`);
        return res as Record<string, string>[];
      } catch (e2) {
        if (this.isEmptyReply(e2)) return [];
        log.error(`Amri "${path}" imeshindwa tena baada ya reconnect (${this.label}): ${String(e2)}`);
        // Swallow: caller treats [] as "not available" and keeps running.
        return [];
      }
    }
  }

  /** Like run() but throws on real failure — used for the connectivity probe.
   *  Still treats `!empty` as an empty result (it is not a failure). */
  async runStrict(path: string, params: string[] = []): Promise<Record<string, string>[]> {
    try {
      if (!this.api || !this.connected) await this.connect();
      const res = await this.api!.write(path, params);
      return res as Record<string, string>[];
    } catch (e) {
      if (this.isEmptyReply(e)) return [];
      throw e;
    }
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
