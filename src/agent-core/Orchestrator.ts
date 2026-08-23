// The Orchestrator ties everything together: it polls the server for the set
// of routers + pending commands, maintains one RouterWorker per router,
// runs the heartbeat loop, and dispatches commands. Handles restart requests.

import { RouterWorker } from './RouterWorker.js';
import { ServerClient, type PollRouter } from '../ws-client/client.js';
import { createLogger, setRemoteSink } from '../logging/logger.js';
import type { AgentConfig } from '../security/config.js';
import type { CommandResult, Command } from '../command-handler/handler.js';

const log = createLogger('agent-core');

export class Orchestrator {
  private workers = new Map<string, RouterWorker>();
  private server: ServerClient;
  private running = false;
  private restartRequested = false;

  constructor(private readonly cfg: AgentConfig) {
    this.server = new ServerClient(cfg);
    // Ship info+ logs to the server so admins see them in the dashboard.
    setRemoteSink((entry) => this.server.queueLog(entry));
  }

  wantsRestart(): boolean {
    return this.restartRequested;
  }

  async start(): Promise<void> {
    this.running = true;
    log.info('Enterprise Agent imeanza');
    await this.mainLoop();
  }

  async stop(): Promise<void> {
    this.running = false;
    for (const w of this.workers.values()) await w.stop();
    this.workers.clear();
  }

  /** Reconcile workers to match the router set from the server. */
  private sync(routers: PollRouter[]): void {
    const seen = new Set(routers.map((r) => r.id));
    for (const r of routers) {
      if (!this.workers.has(r.id)) {
        if (!r.host) {
          log.warn(`Router ${r.id.slice(0, 8)} haina IP (host). Iongeze IP dashboardi (Routers -> Hariri).`);
        }
        this.workers.set(r.id, new RouterWorker(r, this.server, this.cfg));
        log.info(`Router imeongezwa: ${r.id.slice(0, 8)} (${r.host || 'HAKUNA IP'}:${r.apiPort})`);
      }
    }
    for (const id of [...this.workers.keys()]) {
      if (!seen.has(id)) {
        void this.workers.get(id)?.stop();
        this.workers.delete(id);
        log.info(`Router imeondolewa: ${id.slice(0, 8)}`);
      }
    }
  }

  /**
   * Single main loop. Poll runs every pollInterval; heartbeat + sync run on
   * their own slower cadence, tracked by timestamp. Running everything in ONE
   * loop (not two concurrent ones) guarantees a router's connection is never
   * used by heartbeat and command-execution at the same time — the source of
   * "Received data on unregistered tag". The per-connection mutex is a second
   * layer of safety for multi-router setups.
   */
  private async mainLoop(): Promise<void> {
    let lastHeartbeat = 0;
    while (this.running) {
      try {
        const { routers, commands } = await this.server.poll();
        const cmdCount = Object.values(commands).reduce((n, c) => n + c.length, 0);
        log.debug(`Poll: routers=${routers.length}, commands=${cmdCount}`);
        this.sync(routers);

        // 1. Execute any queued commands first.
        await this.runCommands(commands);
        if (this.restartRequested) {
          log.info('Restart imeombwa — nazima kwa ajili ya service manager');
          await this.stop();
          return;
        }

        // 2. Heartbeat + sync on the slower cadence, after commands finish.
        if (Date.now() - lastHeartbeat >= this.cfg.heartbeat) {
          lastHeartbeat = Date.now();
          for (const worker of this.workers.values()) {
            await worker.heartbeat();
            await worker.syncIfDue();
          }
        }
      } catch (e) {
        log.warn('Poll imeshindwa (mtandao?), najaribu tena', String(e));
      }
      await this.server.flushLogs().catch(() => {});
      await delay(this.cfg.pollInterval);
    }
  }

  /** Execute commands per router and acknowledge results. */
  private async runCommands(commands: Record<string, Command[]>): Promise<void> {
    const results: CommandResult[] = [];
    for (const [routerId, cmds] of Object.entries(commands)) {
      if (cmds.length === 0) continue;
      log.info(`Nimepokea amri ${cmds.length} kwa router ${routerId.slice(0, 8)}: ${cmds.map((c) => c.command).join(', ')}`);
      if (cmds.some((c) => c.command === 'agent.restart')) {
        this.restartRequested = true;
        results.push({ id: cmds.find((c) => c.command === 'agent.restart')!.id, ok: true });
      }
      const worker = this.workers.get(routerId);
      const runnable = cmds.filter((c) => c.command !== 'agent.restart');
      if (worker) {
        results.push(...(await worker.runCommands(runnable)));
      } else {
        log.warn(`Hakuna worker kwa router ${routerId.slice(0, 8)} — huenda host/credentials hazipo`);
        for (const c of runnable) {
          results.push({ id: c.id, ok: false, error: 'Router haina worker (host/credentials?)' });
        }
      }
    }
    if (results.length) {
      log.info(`Narudisha matokeo ${results.length} kwa server`);
      await this.server.ack(results);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
