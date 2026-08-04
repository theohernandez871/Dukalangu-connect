import { RouterOSAPI } from 'node-routeros';
import { config } from '../config.js';
import type { PollRouter } from '../api/poll.js';

/**
 * Thin wrapper around node-routeros. Opens a connection, runs one or more
 * command "sentences", and closes. Connections are short-lived per command
 * batch to avoid stale sockets behind NAT.
 */
export class RouterClient {
  private conn: RouterOSAPI;

  constructor(router: PollRouter) {
    const host = config.routerHostOverride ?? router.host ?? '127.0.0.1';
    this.conn = new RouterOSAPI({
      host,
      user: router.username ?? 'admin',
      password: router.password ?? '',
      port: router.api_port ?? 8728,
      timeout: Math.ceil(config.routerTimeoutMs / 1000),
    });
  }

  async connect(): Promise<void> {
    await this.conn.connect();
  }

  async close(): Promise<void> {
    try {
      await this.conn.close();
    } catch {
      /* ignore close errors */
    }
  }

  /**
   * Execute a RouterOS command path with optional parameters.
   * Returns the array of records RouterOS sends back.
   */
  async write(path: string, params: string[] = []): Promise<Record<string, unknown>[]> {
    const result = await this.conn.write(path, params);
    return result as Record<string, unknown>[];
  }
}
