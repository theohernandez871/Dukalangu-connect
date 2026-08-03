import { dashboardRepository } from './dashboard.repository';
import type { DashboardStats, ActivityEntry } from '../types/dashboard';

interface StatsRow {
  total_users: number;
  active_users: number;
  online_users: number;
  offline_users: number;
  revenue_today: number;
  revenue_month: number;
  routers_total: number;
  routers_online: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data, error } = await dashboardRepository.getStats();
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as StatsRow | undefined;
    return {
      totalUsers: Number(row?.total_users ?? 0),
      activeUsers: Number(row?.active_users ?? 0),
      onlineUsers: Number(row?.online_users ?? 0),
      offlineUsers: Number(row?.offline_users ?? 0),
      revenueToday: Number(row?.revenue_today ?? 0),
      revenueMonth: Number(row?.revenue_month ?? 0),
      routersTotal: Number(row?.routers_total ?? 0),
      routersOnline: Number(row?.routers_online ?? 0),
    };
  },

  async getRecentActivity(): Promise<ActivityEntry[]> {
    const { data, error } = await dashboardRepository.getRecentActivity();
    if (error) throw error;
    const rows = data ?? [];

    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
    const nameMap = new Map<string, string>();
    if (actorIds.length) {
      const { data: actors } = await dashboardRepository.getActorNames(actorIds);
      actors?.forEach((a) => nameMap.set(a.id, a.full_name || a.email));
    }

    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorName: r.actor_id ? (nameMap.get(r.actor_id) ?? 'Mfumo') : 'Mfumo',
      createdAt: r.created_at,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
    }));
  },
};
