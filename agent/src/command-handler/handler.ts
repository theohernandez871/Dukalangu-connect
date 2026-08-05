// Executes mutating commands dispatched from the server. Each returns a
// small result object that the agent reports back for acknowledgement.

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

async function execute(conn: RouterConnection, cmd: Command): Promise<unknown> {
  const a = cmd.args ?? {};

  // Read commands: just return the printout.
  if (isReadCommand(cmd.command)) {
    return conn.run(READ_COMMANDS[cmd.command]);
  }

  switch (cmd.command) {
    case 'hotspot.kick':
      return conn.run('/ip/hotspot/active/remove', [`=.id=${a.id}`]);

    case 'pppoe.disconnect':
      return conn.run('/ppp/active/remove', [`=.id=${a.id}`]);

    // Create a hotspot user (voucher) bound to a profile.
    case 'hotspot.create_user':
      return conn.run('/ip/hotspot/user/add', [
        `=name=${a.name}`,
        `=password=${a.password ?? a.name}`,
        `=profile=${a.profile ?? 'default'}`,
      ]);

    case 'hotspot.delete_user':
      return conn.run('/ip/hotspot/user/remove', [`=.id=${a.id}`]);

    // Create a hotspot user profile (package) with rate limit + session time.
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
  try {
    const data = await execute(conn, cmd);
    log.info(`Amri OK: ${cmd.command}`, { id: cmd.id });
    return { id: cmd.id, ok: true, data };
  } catch (e) {
    log.error(`Amri imeshindwa: ${cmd.command}`, String(e));
    return { id: cmd.id, ok: false, error: String(e) };
  }
}
