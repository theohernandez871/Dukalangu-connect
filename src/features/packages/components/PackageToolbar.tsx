import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export interface PackageFilters {
  search: string;
  branchId: string;
  status: 'all' | 'active' | 'inactive';
}

interface Props {
  filters: PackageFilters;
  onChange: (f: PackageFilters) => void;
  branchOptions: { value: string; label: string }[];
}

/** Search box + branch/status filters for the package list. Presentational —
 *  filtering itself happens in the page via filterPackages(). */
export function PackageToolbar({ filters, onChange, branchOptions }: Props) {
  const set = (patch: Partial<PackageFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-10"
          placeholder="Tafuta kifurushi kwa jina..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
        />
      </div>
      <Select
        className="sm:w-44"
        value={filters.branchId}
        onChange={(e) => set({ branchId: e.target.value })}
        options={[{ value: '', label: 'Matawi yote' }, ...branchOptions]}
      />
      <Select
        className="sm:w-40"
        value={filters.status}
        onChange={(e) => set({ status: e.target.value as PackageFilters['status'] })}
        options={[
          { value: 'all', label: 'Zote' },
          { value: 'active', label: 'Zinazotumika' },
          { value: 'inactive', label: 'Zilizozimwa' },
        ]}
      />
    </div>
  );
}

/** Pure filter — no side effects, easy to test. */
export function filterPackages<T extends { name: string; branchId: string | null; isActive: boolean }>(
  packages: T[],
  f: PackageFilters,
): T[] {
  const q = f.search.trim().toLowerCase();
  return packages.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (f.branchId && p.branchId !== f.branchId) return false;
    if (f.status === 'active' && !p.isActive) return false;
    if (f.status === 'inactive' && p.isActive) return false;
    return true;
  });
}
