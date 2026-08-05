// Sync engine: pulls the full set of RouterOS data for a router and builds
// a metrics snapshot (CPU, memory, uptime, version, connected users, etc.)
// used by the heartbeat.

import { RouterConnection } from '../router-api/connection.js';
import { READ_COMMANDS, SYNC_KINDS } from '../router-api/commands.js';
import { createLogger } from '../logging/logger.js';

const log = createLogger('sync-engine');

export interface RouterMetrics {
  cpuLoad: number | null;
  memUsed: number | null;
  memTotal: number | null;
  uptime: string | null;
  version: string | null;
  boardName: string | null;
  identity: string | null;
  connectedUsers: number | null;
}

export interface SyncSnapshot {
  metrics: RouterMetrics;
  data: Record<string, unknown[]>;
}

export async function collectMetrics(conn: RouterConnection): Promise<RouterMetrics> {
  const [res] = await conn.run(READ_COMMANDS['resource']);
  const [ident] = await conn.run(READ_COMMANDS['identity']).catch(() => [{}]);
  const active = await conn.run(READ_COMMANDS['hotspot.active']).catch(() => []);

  const total = res?.['total-memory'] ? Number(res['total-memory']) : null;
  const free = res?.['free-memory'] ? Number(res['free-memory']) : null;

  return {
    cpuLoad: res?.['cpu-load'] ? Number(res['cpu-load']) : null,
    memUsed: total != null && free != null ? total - free : null,
    memTotal: total,
    uptime: res?.uptime ?? null,
    version: res?.version ?? null,
    boardName: res?.['board-name'] ?? null,
    identity: (ident as Record<string, string>)?.name ?? null,
    connectedUsers: Array.isArray(active) ? active.length : null,
  };
}

/** Pull every sync kind. Failures on one kind don't abort the rest. */
export async function collectAll(conn: RouterConnection): Promise<SyncSnapshot> {
  const metrics = await collectMetrics(conn);
  const data: Record<string, unknown[]> = {};

  for (const kind of SYNC_KINDS) {
    try {
      data[kind] = await conn.run(READ_COMMANDS[kind]);
    } catch (e) {
      log.warn(`Sync ya "${kind}" imeshindwa`, String(e));
      data[kind] = [];
    }
  }

  return { metrics, data };
}
