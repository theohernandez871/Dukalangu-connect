import { supabase } from '@/lib/supabase';
import type { InviteEmployeeInput } from '../types/employee';
import type { UserRole } from '@/types/rbac';

export const employeeRepository = {
  list(companyId: string) {
    return supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, branch_id, is_active, email_verified, created_at, branch:branch_id(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  invite(input: InviteEmployeeInput) {
    return supabase.functions.invoke('invite-employee', { body: input });
  },

  updateRole(id: string, role: UserRole) {
    return supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id);
  },

  updateBranch(id: string, branchId: string) {
    return supabase.from('profiles').update({ branch_id: branchId, updated_at: new Date().toISOString() }).eq('id', id);
  },

  setActive(id: string, isActive: boolean) {
    return supabase.from('profiles').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
  },
};
