import { useState } from 'react';
import { commandService } from '../services/agent.service';
import type { RouterCommandKey } from '../constants/commandCatalog';

interface ActionState {
  run: (routerId: string, command: RouterCommandKey, targetId: string) => Promise<boolean>;
  isRunning: boolean;
  error: string | null;
}

const POLL = 1500;
const MAX_WAIT = 20_000;

/**
 * Enqueue a mutating command (e.g. kick / disconnect) targeting a
 * specific RouterOS `.id`, then poll until it resolves.
 */
export function useRouterAction(): ActionState {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (
    routerId: string,
    command: RouterCommandKey,
    targetId: string,
  ): Promise<boolean> => {
    setIsRunning(true);
    setError(null);
    try {
      const id = await commandService.enqueueWithParams(routerId, command, { id: targetId });
      const deadline = Date.now() + MAX_WAIT;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL));
        const cmd = await commandService.get(id);
        if (cmd.status === 'done') return true;
        if (cmd.status === 'failed' || cmd.status === 'timeout') {
          setError(cmd.error ?? 'Imeshindikana');
          return false;
        }
      }
      setError('Muda umeisha — agent haijajibu');
      return false;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hitilafu');
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  return { run, isRunning, error };
}
