import type { PackageType, DurationUnit } from '../types/package';

export interface PackageTypeMeta {
  type: PackageType;
  label: string;
  description: string;
  tone: 'primary' | 'info' | 'success' | 'warning' | 'accent' | 'neutral';
  fields: {
    duration: boolean;
    data: boolean;
    speed: boolean;
    timeWindow: boolean;
  };
}

export const PACKAGE_TYPE_META: Record<PackageType, PackageTypeMeta> = {
  unlimited: {
    type: 'unlimited', label: 'Unlimited', description: 'Muda tu, hakuna kikomo cha data',
    tone: 'primary', fields: { duration: true, data: false, speed: true, timeWindow: false },
  },
  time: {
    type: 'time', label: 'Muda (Time)', description: 'Kikomo cha muda',
    tone: 'info', fields: { duration: true, data: false, speed: true, timeWindow: false },
  },
  data: {
    type: 'data', label: 'Data', description: 'Kikomo cha data (MB/GB)',
    tone: 'accent', fields: { duration: true, data: true, speed: true, timeWindow: false },
  },
  speed: {
    type: 'speed', label: 'Kasi (Speed)', description: 'Kasi maalum',
    tone: 'warning', fields: { duration: true, data: false, speed: true, timeWindow: false },
  },
  night: {
    type: 'night', label: 'Usiku (Night)', description: 'Masaa ya usiku tu',
    tone: 'neutral', fields: { duration: true, data: true, speed: true, timeWindow: true },
  },
  weekend: {
    type: 'weekend', label: 'Wikendi', description: 'Jumamosi/Jumapili tu',
    tone: 'success', fields: { duration: true, data: true, speed: true, timeWindow: true },
  },
  monthly: {
    type: 'monthly', label: 'Mwezi', description: 'Kifurushi cha mwezi',
    tone: 'primary', fields: { duration: true, data: true, speed: true, timeWindow: false },
  },
  custom: {
    type: 'custom', label: 'Custom', description: 'Mchanganyiko wa yote',
    tone: 'neutral', fields: { duration: true, data: true, speed: true, timeWindow: true },
  },
};

export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
  minute: 'Dakika',
  hour: 'Saa',
  day: 'Siku',
  week: 'Wiki',
  month: 'Mwezi',
};
