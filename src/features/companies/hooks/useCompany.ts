import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyService, branchService } from '../services/company.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { BranchInput } from '../types/company';

export function useCompany() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.get(companyId),
    enabled: !!companyId,
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useMutation({
    mutationFn: (name: string) => companyService.update(companyId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', companyId] }),
  });
}

export function useBranches() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['branches', companyId],
    queryFn: () => branchService.list(companyId),
    enabled: !!companyId,
  });
}

export function useBranchMutations() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const invalidate = () => qc.invalidateQueries({ queryKey: ['branches', companyId] });

  const create = useMutation({
    mutationFn: (input: BranchInput) => branchService.create(companyId, input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (vars: { id: string; input: BranchInput }) => branchService.update(vars.id, vars.input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => branchService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
