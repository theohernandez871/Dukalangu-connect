import { useState } from 'react';
import { commandService } from '../services/agent.service';
import type { RouterCommandKey } from '../constants/commandCatalog';

/**
 * Enqueue a command without blocking on the result. The dashboard reflects
 * the outcome via Supabase Realtime (router row / sync data updates), so we
 * only track a short "sending" state for button feedback.
 */
export function useRouterCommand() {
  const [sending, setSending] = useState<string | null>(null);

  const send = async (
    routerId: string,
    command: RouterCommandKey,
    params?: Record<string, string>,
  ): Promise<boolean> => {
    setSending(command);
    try {
      if (params) await commandService.enqueueWithParams(routerId, command, params);
      else await commandService.enqueue(routerId, command);
      return true;
    } catch {
      return false;
    } finally {
      setSending(null);
    }
  };

  return { send, sending };
}
