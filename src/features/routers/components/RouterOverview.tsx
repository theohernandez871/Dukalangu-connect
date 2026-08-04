import { CpuChipIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { PendingAgentState } from './PendingAgentState';
import { RouterStatusBadge } from './RouterStatusBadge';
import { useRouterQuery } from '../hooks/useRouterQuery';
import type { Router } from '../types/router';
import type { RouterResource } from '../types/routeros';

function Stat({ icon: Icon, label, value }: { icon: typeof CpuChipIcon; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
      </div>
    </Card>
  );
}

export function RouterOverview({ router }: { router: Router }) {
  const { data, isLoading, pending, refetch } = useRouterQuery<RouterResource>(router.id, 'resource');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Hali</p>
            <div className="mt-1"><RouterStatusBadge status={router.status} /></div>
          </div>
        </Card>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[76px]" />)
        ) : pending ? null : (
          <>
            <Stat icon={CpuChipIcon} label="CPU" value={data?.['cpu-load'] ? `${data['cpu-load']}%` : '—'} />
            <Stat icon={ClockIcon} label="Uptime" value={data?.uptime ?? '—'} />
            <Stat icon={TagIcon} label="RouterOS" value={data?.version ?? router.osVersion ?? '—'} />
          </>
        )}
      </div>

      {pending && <PendingAgentState onRetry={refetch} />}

      <Card>
        <p className="text-sm text-slate-500">Muunganisho</p>
        <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
          {router.connectionType === 'agent' ? 'Kupitia Agent' : `${router.host}:${router.apiPort}`}
        </p>
        {router.branchName && (
          <p className="mt-2 text-sm text-slate-500">Tawi: <span className="font-medium">{router.branchName}</span></p>
        )}
      </Card>
    </div>
  );
}
