import { supabase } from '@/lib/supabase';

export const agentRepository = {
  list(companyId: string) {
    return supabase
      .from('router_agents')
      .select('id, router_id, name, last_ping, is_active, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  create(name: string, routerId: string | null) {
    return supabase.rpc('create_router_agent', { p_name: name, p_router_id: routerId });
  },

  revoke(agentId: string) {
    return supabase.rpc('revoke_router_agent', { p_agent_id: agentId });
  },
};

export const commandRepository = {
  enqueue(routerId: string, command: string, params: Record<string, unknown> = {}) {
    return supabase.rpc('enqueue_router_command', {
      p_router_id: routerId,
      p_command: command,
      p_params: params,
    });
  },

  get(commandId: string) {
    return supabase
      .from('router_commands')
      .select('id, router_id, command, status, result, error, created_at, finished_at')
      .eq('id', commandId)
      .single();
  },
};
