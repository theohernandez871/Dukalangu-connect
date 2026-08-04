import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employee.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { InviteEmployeeInput } from '../types/employee';
import type { UserRole } from '@/types/rbac';

export function useEmployees() {
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  return useQuery({
    queryKey: ['employees', companyId],
    queryFn: () => employeeService.list(companyId),
    enabled: !!companyId,
  });
}

export function useEmployeeMutations() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const companyId = session?.profile.companyId ?? '';
  const invalidate = () => qc.invalidateQueries({ queryKey: ['employees', companyId] });

  const invite = useMutation({
    mutationFn: (input: InviteEmployeeInput) => employeeService.invite(input),
    onSuccess: invalidate,
  });
  const updateRole = useMutation({
    mutationFn: (vars: { id: string; role: UserRole }) => employeeService.updateRole(vars.id, vars.role),
    onSuccess: invalidate,
  });
  const updateBranch = useMutation({
    mutationFn: (vars: { id: string; branchId: string }) => employeeService.updateBranch(vars.id, vars.branchId),
    onSuccess: invalidate,
  });
  const setActive = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => employeeService.setActive(vars.id, vars.isActive),
    onSuccess: invalidate,
  });

  return { invite, updateRole, updateBranch, setActive };
}
