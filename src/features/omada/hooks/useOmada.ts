import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { omadaService } from '../services/omada.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { OmadaControllerInput } from '../types/omada';

export function useControllers() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['omada', companyId],
    queryFn: () => omadaService.list(companyId),
    enabled: !!companyId,
  });
}

export function useController(id: string) {
  return useQuery({
    queryKey: ['omada-controller', id],
    queryFn: () => omadaService.getById(id),
    enabled: !!id,
  });
}

export function useControllerMutations() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const invalidate = () => qc.invalidateQueries({ queryKey: ['omada', companyId] });

  const create = useMutation({
    mutationFn: (input: OmadaControllerInput) => omadaService.create(companyId, input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (vars: { id: string; input: OmadaControllerInput }) =>
      omadaService.update(vars.id, companyId, vars.input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => omadaService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

/** Query a whitelisted Omada command (devices/clients/etc). */
export function useOmadaData<T = unknown>(controllerId: string, command: string, enabled = true) {
  return useQuery({
    queryKey: ['omada-data', controllerId, command],
    queryFn: () => omadaService.runCommand<T>(controllerId, command),
    enabled: enabled && !!controllerId,
    retry: 0,
  });
}
