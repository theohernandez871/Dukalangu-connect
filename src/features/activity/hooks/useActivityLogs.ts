import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { activityService } from '../services/activity.service';

const PAGE_SIZE = 15;

export function useActivityLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string>('');

  const query = useQuery({
    queryKey: ['activity', page, action],
    queryFn: () => activityService.list({ page, pageSize: PAGE_SIZE, action: action || undefined }),
    placeholderData: keepPreviousData,
  });

  const changeFilter = (next: string) => {
    setAction(next);
    setPage(1);
  };

  return { ...query, page, setPage, action, changeFilter, pageSize: PAGE_SIZE };
}
