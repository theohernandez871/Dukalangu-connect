import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { packageService } from '../services/package.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PackageInput } from '../types/package';

export function usePackages() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['packages', companyId],
    queryFn: () => packageService.list(companyId),
    enabled: !!companyId,
  });
}

export function usePackageMutations() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const invalidate = () => qc.invalidateQueries({ queryKey: ['packages', companyId] });

  const create = useMutation({
    mutationFn: (input: PackageInput) => packageService.create(companyId, input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (vars: { id: string; input: PackageInput }) =>
      packageService.update(vars.id, companyId, vars.input),
    onSuccess: invalidate,
  });
  const setActive = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) =>
      packageService.setActive(vars.id, vars.isActive),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => packageService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, setActive, remove };
}
