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
  const [phase, setPhase] = useState<string | null>(null);

  const run = useCallback(async (routerId: string, command: string) => {
    setIsRunning(true);
    setResult(null);
    setPhase('Inaandaa amri...');
    console.info('[test] enqueue', { routerId, command });
    try {
      // Pre-check: is there an active agent that can pick this up?
      const agentCount = await commandService.countActiveAgents(routerId).catch(() => -1);
      console.info('[test] active agents for router:', agentCount);

      const id = await commandService.enqueue(routerId, command);
      console.info('[test] command queued, id =', id);

      const deadline = Date.now() + 30_000;
      let everRunning = false;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        const cmd = await commandService.get(id);
        console.info('[test] poll status =', cmd.status);
        if (cmd.status === 'running') {
          everRunning = true;
          setPhase('Agent inatekeleza amri kwenye RouterOS...');
        }
        if (cmd.status === 'done' || cmd.status === 'failed' || cmd.status === 'timeout') {
          setResult(cmd);
          return cmd;
        }
      }

      // Timed out. Distinguish "no agent" from "agent stuck".
      const timed = await commandService.get(id).catch(() => null);
      if (timed && !everRunning && timed.status === 'pending') {
        // Command never moved past 'pending' => nothing polled it.
        const noAgentMsg =
          agentCount === 0
            ? 'Hakuna agent iliyosajiliwa kwa router hii. Tengeneza agent na uiendeshe.'
            : 'Amri haikuchukuliwa na agent yoyote. Hakikisha programu ya agent INAENDESHWA kwenye kifaa cha LAN (si tu imewekwa).';
        setResult({ ...timed, status: 'timeout', error: noAgentMsg });
        console.warn('[test] no agent picked up the command');
        return timed;
      }
      setResult(timed);
      return timed;
    } catch (e) {
      console.error('[test] error', e);
      throw e;
    } finally {
      setIsRunning(false);
      setPhase(null);
    }
  }, []);

  return { run, result, isRunning, phase };
}
