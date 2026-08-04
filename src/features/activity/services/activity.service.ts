import { activityRepository } from './activity.repository';
import type { ActivityPage, ActivityQuery } from '../types/activity';

interface LogRow {
  id: number;
  action: string;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const activityService = {
  async list(query: ActivityQuery): Promise<ActivityPage> {
    const { data, error, count } = await activityRepository.list(query);
    if (error) throw error;
    const rows = (data ?? []) as LogRow[];

    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
    const nameMap = new Map<string, string>();
    if (actorIds.length) {
      const { data: actors } = await activityRepository.getActorNames(actorIds);
      actors?.forEach((a) => nameMap.set(a.id, a.full_name || a.email));
    }

    return {
      total: count ?? 0,
      rows: rows.map((r) => ({
        id: r.id,
        action: r.action,
        actorName: r.actor_id ? (nameMap.get(r.actor_id) ?? 'Mfumo') : 'Mfumo',
        metadata: r.metadata ?? {},
        createdAt: r.created_at,
      })),
    };
  },
};
