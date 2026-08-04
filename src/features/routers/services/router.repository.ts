import { supabase } from '@/lib/supabase';
import type { RouterInput } from '../types/router';

/** Fields safe to persist directly from the client (never the password). */
function toRow(companyId: string, input: RouterInput) {
  return {
    company_id: companyId,
    branch_id: input.branchId || null,
    name: input.name,
    connection_type: input.connectionType,
    host: input.connectionType === 'direct' ? input.host || null : null,
    api_port: input.apiPort ?? 8728,
    username: input.username || null,
  };
}

export const routerRepository = {
  list(companyId: string) {
    return supabase
      .from('routers')
      .select('*, branch:branch_id(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  getById(id: string) {
    return supabase.from('routers').select('*, branch:branch_id(name)').eq('id', id).single();
  },

  create(companyId: string, input: RouterInput) {
    return supabase.from('routers').insert(toRow(companyId, input)).select('id').single();
  },

  update(id: string, companyId: string, input: RouterInput) {
    return supabase.from('routers').update(toRow(companyId, input)).eq('id', id);
  },

  remove(id: string) {
    return supabase.from('routers').delete().eq('id', id);
  },

  /**
   * Store the router password securely via Edge Function (encrypts it).
   * Implemented in Phase 4b; here it is a no-op guard when no password given.
   */
  setPassword(routerId: string, password: string) {
    return supabase.functions.invoke('router-set-credential', {
      body: { routerId, password },
    });
  },
};
