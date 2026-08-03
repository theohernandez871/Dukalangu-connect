export interface DashboardStats {
  /** Data available now (Phase 1–3). */
  totalUsers: number;
  activeUsers: number;
  /** Placeholders — wired in later phases. -1 means "not available yet". */
  onlineUsers: number;
  offlineUsers: number;
  revenueToday: number;
  revenueMonth: number;
  routersTotal: number;
  routersOnline: number;
}

export interface ActivityEntry {
  id: number;
  action: string;
  actorName: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface RevenuePoint {
  date: string;
  amount: number;
}
