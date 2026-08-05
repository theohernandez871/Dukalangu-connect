// A RouterWorker owns one router: its connection, heartbeat, periodic sync,
// and command execution. Multiple workers run concurrently (multi-router).

import { RouterConnection } from '../router-api/connection.js';
import { collectMetrics, collectAll } from '../sync-engine/collect.js';
import { handleCommand, type Command, type CommandResult } from '../command-handler/handler.js';
import { createLogger } from '../logging/logger.js';
import type { ServerClient, PollRouter } from '../ws-client/client.js';
import type { AgentConfig } from '../security/config.js';

export class RouterWorker {
  private conn: RouterConnection;
  private log;
  private lastSync = 0;

  constructor(
    private readonly router: PollRouter,
    private readonly server: ServerClient,
    private readonly cfg: AgentConfig,
  ) {
    this.log = createLogger(`router:${router.id.slice(0, 8)}`);
    this.conn = new RouterConnection(
      {
        host: router.host,
        port: router.apiPort,
        user: router.username,
        password: router.password,
        timeout: cfg.apiTimeout,
      },
      router.id.slice(0, 8),
    );
  }

  /** Heartbeat: measure ping + response time, push metrics. Marks offline on failure. */
  async heartbeat(): Promise<void> {
    const start = Date.now();
    try {
      await this.conn.connect();
      const pingStart = Date.now();
      const metrics = await collectMetrics(this.conn);
      const pingMs = Date.now() - pingStart;
      const responseMs = Date.now() - start;
      await this.server.heartbeat(this.router.id, metrics, pingMs, responseMs);
      this.log.debug(`Heartbeat OK: version=${metrics.version}, cpu=${metrics.cpuLoad}, users=${metrics.connectedUsers}`);
    } catch (e) {
      this.log.warn('Heartbeat imeshindwa — router offline', String(e));
      // A failed heartbeat leaves the row un-updated; the server marks it
      // offline after a missed-beat timeout.
    }
  }

  /** Periodic full sync of all RouterOS data kinds into the dashboard cache. */
  async syncIfDue(): Promise<void> {
    const now = Date.now();
    if (now - this.lastSync < 60000) return; // full sync at most once/min
    this.lastSync = now;
    try {
      const snap = await collectAll(this.conn);
      for (const [kind, payload] of Object.entries(snap.data)) {
        await this.server.pushSync(this.router.id, kind, payload);
      }
    } catch (e) {
      this.log.warn('Sync imeshindwa', String(e));
    }
  }

  async forceSync(): Promise<void> {
    this.lastSync = 0;
    await this.syncIfDue();
  }

  async runCommands(commands: Command[]): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    for (const cmd of commands) {
      results.push(await handleCommand(this.conn, cmd));
      if (cmd.command === 'sync.all') await this.forceSync();
    }
    return results;
  }

  async stop(): Promise<void> {
    await this.conn.close();
  }
}
