import { useCallback, useEffect, useRef, useState } from 'react';
import { commandService } from '../services/agent.service';
import { isValidCommand, type RouterCommandKey } from '../constants/commandCatalog';

interface RouterQueryState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  /** True while waiting for an agent that may be offline. */
  pending: boolean;
  refetch: () => void;
}

const POLL_INTERVAL = 1500;
const MAX_WAIT = 25_000;

/**
 * Enqueue a read command for a router and poll its result until resolved.
 * Mirrors a useQuery-style API so every RouterOS view can reuse it.
 */
export function useRouterQuery<T = unknown>(
  routerId: string,
  command: RouterCommandKey,
  enabled = true,
): RouterQueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const activeRef = useRef(true);

  const execute = useCallback(async () => {
    if (!isValidCommand(command)) {
      setIsError(true);
      setError('Command si sahihi');
      return;
    }
    setIsLoading(true);
    setIsError(false);
    setError(null);
    setPending(false);

    try {
      const id = await commandService.enqueue(routerId, command);
      const deadline = Date.now() + MAX_WAIT;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
        if (!activeRef.current) return;
        const cmd = await commandService.get(id);

        if (cmd.status === 'done') {
          setData((cmd.result?.data ?? cmd.result ?? null) as T);
          setIsLoading(false);
          return;
        }
        if (cmd.status === 'failed' || cmd.status === 'timeout') {
          setIsError(true);
          setError(cmd.error ?? 'Operesheni imeshindikana');
          setIsLoading(false);
          return;
        }
      }
      // Still pending after max wait — agent likely offline.
      setPending(true);
      setIsLoading(false);
    } catch (e) {
      setIsError(true);
      setError(e instanceof Error ? e.message : 'Hitilafu');
      setIsLoading(false);
    }
  }, [routerId, command]);

  useEffect(() => {
    activeRef.current = true;
    if (enabled) void execute();
    return () => {
      activeRef.current = false;
    };
  }, [enabled, execute]);

  return { data, isLoading, isError, error, pending, refetch: execute };
}
