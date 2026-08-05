// Transport to the server via HTTPS (encrypted). Long-polling for commands +
// heartbeat/metric/sync push. The dashboard receives updates in real time via
// Supabase Realtime once these writes land in the database.

import { createLogger } from '../logging/logger.js';
import type { AgentConfig } from '../security/config.js';
import type { RouterMetrics } from '../sync-engine/collect.js';
import type { Command, CommandResult } from '../command-handler/handler.js';

const log = createLogger('ws-client');

export interface PollResponse {
  routers: PollRouter[];
  commands: Record<string, Command[]>; // keyed by routerId
}

export interface PollRouter {
  id: string;
  host: string;
  apiPort: number;
  username: string;
  password: string;
}

export class ServerClient {
  constructor(private readonly cfg: AgentConfig) {}

  private url(fn: string): string {
    return `${this.cfg.supabaseUrl}/functions/v1/${fn}`;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.cfg.supabaseAnonKey,
      Authorization: `Bearer ${this.cfg.supabaseAnonKey}`,
      'x-agent-token': this.cfg.agentToken,
    };
  }

  /** Fetch routers this agent manages + any pending commands. */
  async poll(): Promise<PollResponse> {
    const res = await fetch(this.url('agent-gateway'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ action: 'poll' }),
    });
    if (!res.ok) {
      log.error(`poll imekataliwa na server: HTTP ${res.status} (token? gateway deployed?)`);
      throw new Error(`poll ${res.status}`);
    }
    return (await res.json()) as PollResponse;
  }

  /** Push heartbeat metrics for a router (updates Online + live stats). */
  async heartbeat(routerId: string, metrics: RouterMetrics, pingMs: number, responseMs: number): Promise<void> {
    await this.send('heartbeat', { routerId, metrics, pingMs, responseMs });
  }

  /** Push synced RouterOS data (hotspot/pppoe/dhcp/...) to the cache. */
  async pushSync(routerId: string, kind: string, payload: unknown[]): Promise<void> {
    await this.send('sync', { routerId, kind, payload });
  }

  /** Acknowledge executed commands with their results. */
  async ack(results: CommandResult[]): Promise<void> {
    if (results.length === 0) return;
    await this.send('ack', { results });
  }

  // --- Remote logging (batched) ---
  private logBuffer: { level: string; scope: string; message: string }[] = [];

  /** Queue a log entry to ship to the server (router_logs). */
  queueLog(entry: { level: string; scope: string; message: string }): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > 50) this.logBuffer.shift(); // cap memory
  }

  /** Flush queued logs to the server. Called periodically by the orchestrator. */
  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    const entries = this.logBuffer.splice(0, this.logBuffer.length);
    await this.send('log', { entries });
  }

  private async send(action: string, body: Record<string, unknown>): Promise<void> {
    try {
      const res = await fetch(this.url('agent-gateway'), {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ action, ...body }),
      });
      if (!res.ok) log.warn(`${action} imekataliwa: ${res.status}`);
    } catch (e) {
      log.warn(`${action} imeshindwa (mtandao?)`, String(e));
    }
  }
}
