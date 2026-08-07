import { PencilSquareIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { PackageTypeBadge } from './PackageTypeBadge';
import { formatTsh } from '@/utils/currency';
import { formatDuration, formatData } from '../utils/format';
import { usePackageMutations } from '../hooks/usePackages';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Package } from '../types/package';
import type { Column } from '@/components/data/dataTable.types';

interface PackageListProps {
  packages: Package[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
  onDuplicate?: (pkg: Package) => void;
  onToggle?: (pkg: Package) => void;
}

export function PackageList({ packages, isLoading, isError, onRetry, onEdit, onDelete, onDuplicate }: PackageListProps) {
  const { setActive } = usePackageMutations();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('package:manage');

  const columns: Column<Package>[] = [
    { key: 'name', header: 'Kifurushi', cell: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'type', header: 'Aina', cell: (p) => <PackageTypeBadge type={p.type} /> },
    { key: 'price', header: 'Bei', cell: (p) => formatTsh(p.price) },
    { key: 'duration', header: 'Muda', hideOnMobile: true, cell: (p) => formatDuration(p) },
    { key: 'data', header: 'Data', hideOnMobile: true, cell: (p) => formatData(p.dataLimitMb) },
    {
      key: 'active',
      header: 'Hai',
      cell: (p) =>
        canManage ? (
          <Switch checked={p.isActive} onChange={(v) => setActive.mutate({ id: p.id, isActive: v })} />
        ) : (
          <span>{p.isActive ? 'Ndiyo' : 'Hapana'}</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={packages}
      rowKey={(p) => p.id}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      emptyTitle="Hakuna vifurushi"
      emptyDescription="Ongeza kifurushi chako cha kwanza."
      actions={
        canManage
          ? (p) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(p)} aria-label="Hariri">
                  <PencilSquareIcon className="h-4 w-4" />
                </Button>
                {onDuplicate && (
                  <Button variant="ghost" size="sm" onClick={() => onDuplicate(p)} aria-label="Nakili">
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onDelete(p)} aria-label="Futa">
                  <TrashIcon className="h-4 w-4 text-danger-600" />
                </Button>
              </div>
            )
          : undefined
      }
    />
  );
}
