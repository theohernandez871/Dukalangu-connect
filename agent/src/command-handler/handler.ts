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
      return conn.run('/ip/hotspot/active/remove', [`=.id=${a.id}`]);

    case 'pppoe.disconnect':
      return conn.run('/ppp/active/remove', [`=.id=${a.id}`]);

    case 'hotspot.create_user':
      return conn.run('/ip/hotspot/user/add', [
        `=name=${a.name}`,
        `=password=${a.password ?? a.name}`,
        `=profile=${a.profile ?? 'default'}`,
      ]);

    case 'hotspot.delete_user':
      return conn.run('/ip/hotspot/user/remove', [`=.id=${a.id}`]);

    case 'hotspot.create_profile':
      return conn.run('/ip/hotspot/user/profile/add', profileParams(a));

    case 'hotspot.update_profile':
      return conn.run('/ip/hotspot/user/profile/set', [`=.id=${a.id}`, ...profileParams(a)]);

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
  try {
    const data = await execute(conn, cmd);
    log.info(`Amri OK: ${cmd.command} (${Date.now() - start}ms)`, { id: cmd.id });
    return { id: cmd.id, ok: true, data };
  } catch (e) {
    log.error(`Amri imeshindwa: ${cmd.command} (${Date.now() - start}ms)`, String(e));
    return { id: cmd.id, ok: false, error: String(e) };
  }
}
