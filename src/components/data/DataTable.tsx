import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/utils/cn';
import type { Column, DataTableProps, SortState } from './dataTable.types';

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' };

function SortIcon({ col, sort }: { col: Column<unknown>; sort?: SortState }) {
  if (!col.sortable) return null;
  if (sort?.key !== col.key) return <ChevronUpDownIcon className="h-4 w-4 text-slate-400" />;
  return sort.direction === 'asc' ? (
    <ChevronUpIcon className="h-4 w-4 text-primary-600" />
  ) : (
    <ChevronDownIcon className="h-4 w-4 text-primary-600" />
  );
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  isError,
  onRetry,
  emptyTitle = 'Hakuna data',
  emptyDescription,
  sort,
  onSortChange,
  actions,
}: DataTableProps<T>) {
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    const dir = sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ key, direction: dir });
  };

  if (isError) {
    return (
      <Card padded={false} className="p-6">
        <ErrorState onRetry={onRetry} />
      </Card>
    );
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 font-semibold text-slate-500 dark:text-slate-400',
                    alignClass[col.align ?? 'left'],
                    col.hideOnMobile && 'hidden sm:table-cell',
                  )}
                >
                  <button
                    type="button"
                    disabled={!col.sortable}
                    onClick={() => toggleSort(col.key)}
                    className={cn('inline-flex items-center gap-1', col.sortable && 'hover:text-slate-800')}
                  >
                    {col.header}
                    <SortIcon col={col as Column<unknown>} sort={sort} />
                  </button>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right" />}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3.5', col.hideOnMobile && 'hidden sm:table-cell')}>
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3.5" />}
                </tr>
              ))}

            {!isLoading &&
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-slate-50 transition hover:bg-slate-50/60 dark:border-slate-800/50 dark:hover:bg-slate-800/30"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 text-slate-700 dark:text-slate-200',
                        alignClass[col.align ?? 'left'],
                        col.hideOnMobile && 'hidden sm:table-cell',
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3.5 text-right">{actions(row)}</td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && data.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </Card>
  );
}
