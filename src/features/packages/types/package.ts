export const PACKAGE_TYPES = [
  'unlimited',
  'time',
  'data',
  'speed',
  'night',
  'weekend',
  'monthly',
  'custom',
] as const;

export type PackageType = (typeof PACKAGE_TYPES)[number];

export const DURATION_UNITS = ['minute', 'hour', 'day', 'week', 'month'] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number];

export interface TimeWindow {
  start?: string; // "22:00"
  end?: string;   // "06:00"
  days?: number[]; // 0=Sun..6=Sat
}

export interface Package {
  id: string;
  companyId: string;
  branchId: string | null;
  branchName: string | null;
  type: PackageType;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  durationValue: number | null;
  durationUnit: DurationUnit | null;
  dataLimitMb: number | null;
  speedDownKbps: number | null;
  speedUpKbps: number | null;
  timeWindow: TimeWindow | null;
  routerProfile: string | null;
  validityDays: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PackageInput {
  type: PackageType;
  name: string;
  description?: string | null;
  price: number;
  branchId?: string | null;
  durationValue?: number | null;
  durationUnit?: DurationUnit | null;
  dataLimitMb?: number | null;
  speedDownKbps?: number | null;
  speedUpKbps?: number | null;
  timeWindow?: TimeWindow | null;
  routerProfile?: string | null;
  validityDays?: number | null;
  isActive?: boolean;
}
