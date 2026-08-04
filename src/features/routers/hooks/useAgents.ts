import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { agentService, commandService } from '../services/agent.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { RouterCommand } from '../types/agent';

export function useAgents() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['agents', companyId],
    queryFn: () => agentService.list(companyId),
    enabled: !!companyId,
  });
}

export function useAgentMutations() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const invalidate = () => qc.invalidateQueries({ queryKey: ['agents', companyId] });

  const create = useMutation({
    mutationFn: (vars: { name: string; routerId: string | null }) =>
      agentService.create(vars.name, vars.routerId),
    onSuccess: invalidate,
  });
  const revoke = useMutation({
    mutationFn: (agentId: string) => agentService.revoke(agentId),
    onSuccess: invalidate,
  });

  return { create, revoke };
}

/**
 * Enqueue a command, then poll its result until done/failed/timeout.
 * Long-polling matches the agent transport; we poll the DB row here.
 */
export function useRouterCommand() {
  const [result, setResult] = useState<RouterCommand | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async (routerId: string, command: string) => {
    setIsRunning(true);
    setResult(null);
    try {
      const id = await commandService.enqueue(routerId, command);
      const deadline = Date.now() + 30_000; // 30s max
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        const cmd = await commandService.get(id);
        if (cmd.status === 'done' || cmd.status === 'failed' || cmd.status === 'timeout') {
          setResult(cmd);
          return cmd;
        }
      }
      const timed: RouterCommand | null = await commandService.get(id).catch(() => null);
      setResult(timed);
      return timed;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { run, result, isRunning };
}
