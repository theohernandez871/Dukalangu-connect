// Sync engine: pulls the full set of RouterOS data for a router and builds
// a metrics snapshot (CPU, memory, uptime, version, connected users, etc.)
// used by the heartbeat.

import { RouterConnection } from '../router-api/connection.js';
import { READ_COMMANDS, SYNC_KINDS, OPTIONAL_KINDS } from '../router-api/commands.js';
import { createLogger } from '../logging/logger.js';

const log = createLogger('sync-engine');

// Remembers which optional resources a router doesn't support, so we stop
// probing them after the first empty/failed result. Keyed by router label.
const unsupported = new Map<string, Set<string>>();

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
  // The resource read is the connectivity probe: if it fails, the router is
  // genuinely unreachable, so this one throws (heartbeat marks offline).
  const [res] = await conn.runStrict(READ_COMMANDS['resource']);
  // Identity and active-users are best-effort; a failure here must not flip a
  // reachable router to offline, so they use the swallowing run().
  const identRows = await conn.run(READ_COMMANDS['identity']);
  const ident = identRows[0] ?? {};
  const active = await conn.run(READ_COMMANDS['hotspot.active']);

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

/** Pull every sync kind. run() already swallows per-command failures. */
export async function collectAll(conn: RouterConnection, label = 'default'): Promise<SyncSnapshot> {
  const metrics = await collectMetrics(conn);
  const data: Record<string, unknown[]> = {};
  const skip = unsupported.get(label) ?? new Set<string>();

  for (const kind of SYNC_KINDS) {
    // Skip optional resources this device already proved it lacks.
    if (OPTIONAL_KINDS.has(kind) && skip.has(kind)) continue;

    // run() returns [] on failure and logs the command, so one broken kind
    // (e.g. an UNKNOWNREPLY on a specific print) won't abort the rest.
    data[kind] = await conn.run(READ_COMMANDS[kind]);

    // If an optional resource yields nothing, mark it unsupported so we stop
    // probing it. (Required resources are always retried.)
    if (OPTIONAL_KINDS.has(kind) && data[kind].length === 0) {
      skip.add(kind);
      log.info(`Rasilimali "${kind}" haipatikani kwenye kifaa hiki — naiacha`);
    }
  }
  unsupported.set(label, skip);

  return { metrics, data };
}
