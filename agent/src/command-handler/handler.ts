// Executes commands dispatched from the server. Read commands return a
// printout; mutating commands perform an action; sync.all triggers a full
// resource collection (handled by the caller via forceSync). Every result is
// reported back for acknowledgement. A failed command never throws to the loop.

import { RouterConnection } from '../router-api/connection.js';
import { READ_COMMANDS, isReadCommand } from '../router-api/commands.js';
import { createLogger } from '../logging/logger.js';

const log = createLogger('command-handler');

export interface Command {
  id: string;
  command: string;
  args?: Record<string, string> | null;
}

export interface CommandResult {
  id: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

// Commands the worker handles specially (not via this module's execute()).
export const CONTROL_COMMANDS = new Set(['sync.all', 'agent.restart']);

// Mutating commands change router state — the worker forces a sync after these
// so the dashboard reflects the change immediately.
const MUTATING_COMMANDS = new Set([
  'hotspot.kick',
  'pppoe.disconnect',
  'hotspot.create_user',
  'hotspot.delete_user',
  'hotspot.enable_user',
  'hotspot.disable_user',
  'hotspot.create_voucher',
  'hotspot.create_profile',
  'hotspot.update_profile',
]);

export function isMutating(command: string): boolean {
  return MUTATING_COMMANDS.has(command);
}

async function execute(conn: RouterConnection, cmd: Command): Promise<unknown> {
  const a = cmd.args ?? {};

  // sync.all is a control command: the RouterWorker runs forceSync() for it.
  // We accept it here (no-op) so it is never reported as "unknown".
  if (cmd.command === 'sync.all') {
    return { triggered: true };
  }

  // Read commands: return the printout (run() is crash-safe, returns [] on fail).
  if (isReadCommand(cmd.command)) {
    return conn.run(READ_COMMANDS[cmd.command]);
  }

  switch (cmd.command) {
    case 'hotspot.kick':
      return conn.runStrict('/ip/hotspot/active/remove', [`=.id=${a.id}`]);

    case 'pppoe.disconnect':
      return conn.runStrict('/ppp/active/remove', [`=.id=${a.id}`]);

    case 'hotspot.create_user':
      return conn.runStrict('/ip/hotspot/user/add', [
        `=name=${a.name}`,
        `=password=${a.password ?? a.name}`,
        `=profile=${a.profile ?? 'default'}`,
      ]);

    case 'hotspot.delete_user':
      return conn.runStrict('/ip/hotspot/user/remove', [`=.id=${a.id}`]);

    case 'hotspot.enable_user':
      return conn.runStrict('/ip/hotspot/user/enable', [`=.id=${a.id}`]);

    case 'hotspot.disable_user':
      return conn.runStrict('/ip/hotspot/user/disable', [`=.id=${a.id}`]);

    // A voucher is a hotspot user with a limited-uptime/quota profile. Create
    // the user; the profile is expected to exist (created via create_profile).
    case 'hotspot.create_voucher':
      return conn.runStrict('/ip/hotspot/user/add', [
        `=name=${a.code}`,
        `=password=${a.code}`,
        `=profile=${a.profile ?? 'default'}`,
        ...(a.limitUptime ? [`=limit-uptime=${a.limitUptime}`] : []),
        ...(a.comment ? [`=comment=${a.comment}`] : []),
      ]);

    case 'hotspot.create_profile':
      return conn.runStrict('/ip/hotspot/user/profile/add', profileParams(a));

    case 'hotspot.update_profile':
      return conn.runStrict('/ip/hotspot/user/profile/set', [`=.id=${a.id}`, ...profileParams(a)]);

    default:
      throw new Error(`Command haijulikani: ${cmd.command}`);
  }
}

function profileParams(a: Record<string, string>): string[] {
  const p: string[] = [`=name=${a.name}`];
  if (a.rateLimit) p.push(`=rate-limit=${a.rateLimit}`);
  if (a.sessionTimeout) p.push(`=session-timeout=${a.sessionTimeout}`);
  if (a.sharedUsers) p.push(`=shared-users=${a.sharedUsers}`);
  return p;
}

export async function handleCommand(conn: RouterConnection, cmd: Command): Promise<CommandResult> {
  const start = Date.now();
  const mutating = isMutating(cmd.command);
  if (mutating) {
    // Log the full request for write commands so we can trace what was sent.
    log.info(`REQUEST -> ${cmd.command}`, { id: cmd.id, args: cmd.args ?? {} });
  }
  try {
    const data = await execute(conn, cmd);
    const ms = Date.now() - start;
    if (mutating) {
      // RouterOS /add returns the new .id (=ret=...); log it as proof of write.
      const created = Array.isArray(data) && data[0] ? JSON.stringify(data[0]) : 'ok';
      log.info(`RESPONSE OK <- ${cmd.command} (${ms}ms): ${created}`, { id: cmd.id });
    } else {
      log.info(`Amri OK: ${cmd.command} (${ms}ms)`, { id: cmd.id });
    }
    return { id: cmd.id, ok: true, data };
  } catch (e) {
    log.error(`RESPONSE FAIL <- ${cmd.command} (${Date.now() - start}ms): ${String(e)}`, { id: cmd.id, args: cmd.args ?? {} });
    return { id: cmd.id, ok: false, error: String(e) };
  }
}
