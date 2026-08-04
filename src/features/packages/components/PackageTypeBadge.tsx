import { Badge } from '@/components/ui/Badge';
import { PACKAGE_TYPE_META } from '../constants/packageMeta';
import type { PackageType } from '../types/package';

export function PackageTypeBadge({ type }: { type: PackageType }) {
  const meta = PACKAGE_TYPE_META[type];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
