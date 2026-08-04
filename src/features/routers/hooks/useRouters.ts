import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { routerService } from '../services/router.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { RouterInput } from '../types/router';

export function useRouters() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['routers', companyId],
    queryFn: () => routerService.list(companyId),
    enabled: !!companyId,
  });
}

export function useRouterMutations() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const invalidate = () => qc.invalidateQueries({ queryKey: ['routers', companyId] });

  const create = useMutation({
    mutationFn: (input: RouterInput) => routerService.create(companyId, input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (vars: { id: string; input: RouterInput }) =>
      routerService.update(vars.id, companyId, vars.input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => routerService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
