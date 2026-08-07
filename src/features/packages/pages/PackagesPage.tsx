import { useState } from 'react';
import { PlusIcon, TableCellsIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { PackageList } from '../components/PackageList';
import { PackageCard } from '../components/PackageCard';
import { PackageFormDialog } from '../components/PackageFormDialog';
import { PackageToolbar, filterPackages, type PackageFilters } from '../components/PackageToolbar';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { usePackages, usePackageMutations } from '../hooks/usePackages';
import { useBranches } from '@/features/companies/hooks/useCompany';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/utils/cn';
import type { Package } from '../types/package';

export function PackagesPage() {
  const { data, isLoading, isError, refetch } = usePackages();
  const { remove, setActive, duplicate } = usePackageMutations();
  const { data: branches } = useBranches();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('package:manage');

  const [view, setView] = useState<'table' | 'grid'>('table');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [deleting, setDeleting] = useState<Package | null>(null);
  const [filters, setFilters] = useState<PackageFilters>({ search: '', branchId: '', status: 'all' });

  const branchOptions = (branches ?? []).map((b) => ({ value: b.id, label: b.name }));
  const filtered = filterPackages(data ?? [], filters);

  return (
    <div>
      <PageHeader
        title="Vifurushi"
        subtitle="Simamia vifurushi vyako vya WiFi"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-700">
              <button
                onClick={() => setView('table')}
                className={cn('flex h-9 w-9 items-center justify-center rounded-lg', view === 'table' ? 'bg-primary-600 text-white' : 'text-slate-500')}
                aria-label="Jedwali"
              >
                <TableCellsIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={cn('flex h-9 w-9 items-center justify-center rounded-lg', view === 'grid' ? 'bg-primary-600 text-white' : 'text-slate-500')}
                aria-label="Gridi"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
            </div>
            {canManage && (
              <Button onClick={() => setCreating(true)}>
                <PlusIcon className="h-5 w-5" /> Ongeza
              </Button>
            )}
          </div>
        }
      />

      <PackageToolbar filters={filters} onChange={setFilters} branchOptions={branchOptions} />

      {view === 'table' ? (
        <PackageList
          packages={filtered}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          onEdit={setEditing}
          onDelete={setDeleting}
          onDuplicate={canManage ? (p) => duplicate.mutate(p) : undefined}
          onToggle={canManage ? (p) => setActive.mutate({ id: p.id, isActive: !p.isActive }) : undefined}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PackageCard key={p.id} pkg={p} onClick={canManage ? () => setEditing(p) : undefined} />
          ))}
        </div>
      )}

      <PackageFormDialog open={creating} onClose={() => setCreating(false)} />
      <PackageFormDialog open={!!editing} onClose={() => setEditing(null)} pkg={editing} />
      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isLoading={remove.isPending}
        message={`Una uhakika unataka kufuta kifurushi "${deleting?.name}"?`}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
