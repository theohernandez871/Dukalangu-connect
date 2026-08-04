import { supabase } from '@/lib/supabase';
import type { OmadaControllerInput } from '../types/omada';

function toRow(companyId: string, input: OmadaControllerInput) {
  return {
    company_id: companyId,
    branch_id: input.branchId || null,
    name: input.name,
    connection_type: input.connectionType,
    base_url: input.connectionType === 'cloud' ? input.baseUrl || null : null,
    omadac_id: input.omadacId || null,
    site_id: input.siteId || null,
    username: input.username || null,
  };
}

export const omadaRepository = {
  list(companyId: string) {
    return supabase
      .from('omada_controllers')
      .select('*, branch:branch_id(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  getById(id: string) {
    return supabase.from('omada_controllers').select('*, branch:branch_id(name)').eq('id', id).single();
  },

  create(companyId: string, input: OmadaControllerInput) {
    return supabase.from('omada_controllers').insert(toRow(companyId, input)).select('id').single();
  },

  update(id: string, companyId: string, input: OmadaControllerInput) {
    return supabase.from('omada_controllers').update(toRow(companyId, input)).eq('id', id);
  },

  remove(id: string) {
    return supabase.from('omada_controllers').delete().eq('id', id);
  },

  setPassword(controllerId: string, password: string) {
    return supabase.rpc('set_omada_password', { p_controller_id: controllerId, p_password: password });
  },

  /** Run a whitelisted Omada command via the edge proxy (cloud controllers). */
  runCommand(controllerId: string, command: string) {
    return supabase.functions.invoke('omada-proxy', { body: { controllerId, command } });
  },
};
