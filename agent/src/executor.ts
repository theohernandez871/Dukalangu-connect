import { RouterClient } from './routeros/client.js';
import { COMMAND_HANDLERS, isKnownCommand } from './routeros/commands.js';
import type { PollCommand, PollRouter } from './api/poll.js';
import type { CommandResult, RouterStatusReport } from './api/report.js';
import { log } from './logger.js';

/** Parse RouterOS resource record into a status report. */
function toStatus(resource: Record<string, unknown> | null): RouterStatusReport {
  if (!resource) return { status: 'online' };
  return {
    status: 'online',
    os_version: (resource['version'] as string) ?? undefined,
    model: (resource['board-name'] as string) ?? undefined,
    cpu_load: resource['cpu-load'] ? Number(resource['cpu-load']) : undefined,
    mem_used: resource['free-memory'] ? Number(resource['free-memory']) : undefined,
  };
}

/**
 * Run all pending commands against the router in a single connection,
 * plus a resource read for the heartbeat/status.
 */
export async function executeBatch(
  router: PollRouter,
  commands: PollCommand[],
): Promise<{ results: CommandResult[]; status: RouterStatusReport }> {
  const client = new RouterClient(router);
  const results: CommandResult[] = [];
  let status: RouterStatusReport = { status: 'offline' };

  try {
    await client.connect();

    // Heartbeat resource read.
    try {
      const res = (await client.write('/system/resource/print'))[0] ?? null;
      status = toStatus(res);
    } catch (e) {
      log.warn('resource read failed', String(e));
      status = { status: 'error' };
    }

    for (const cmd of commands) {
      if (!isKnownCommand(cmd.command)) {
        results.push({ id: cmd.id, ok: false, error: `Command haijulikani: ${cmd.command}` });
        continue;
      }
      try {
        const data = await COMMAND_HANDLERS[cmd.command](client, cmd.params ?? {});
        results.push({ id: cmd.id, ok: true, result: { data } });
      } catch (e) {
        results.push({ id: cmd.id, ok: false, error: String(e) });
      }
    }
  } catch (e) {
    // Connection failed: mark every command failed + router error.
    log.error('router connection failed', String(e));
    status = { status: 'error' };
    for (const cmd of commands) {
      results.push({ id: cmd.id, ok: false, error: `Muunganisho umeshindikana: ${String(e)}` });
    }
  } finally {
    await client.close();
  }

  return { results, status };
}
