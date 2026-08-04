import type { ReactNode } from 'react';

export interface Column<T> {
  /** Unique key; also used for sorting if `sortable`. */
  key: string;
  header: string;
  /** Render cell content. */
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  /** Hide on mobile (< sm). */
  hideOnMobile?: boolean;
  align?: 'left' | 'right' | 'center';
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** Optional row actions rendered in the last column. */
  actions?: (row: T) => ReactNode;
}
