export interface ActivityLog {
  id: number;
  action: string;
  actorName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityQuery {
  page: number;
  pageSize: number;
  action?: string;
}

export interface ActivityPage {
  rows: ActivityLog[];
  total: number;
}
