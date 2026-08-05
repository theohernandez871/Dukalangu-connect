import { CpuChipIcon, ClockIcon, TagIcon, CircleStackIcon, UsersIcon, SignalIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { RouterStatusBadge } from './RouterStatusBadge';
import type { Router } from '../types/router';

function Stat({ icon: Icon, label, value }: { icon: typeof CpuChipIcon; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="truncate font-semibold text-slate-900 dark:text-white">{value}</p>
      </div>
    </Card>
  );
}

function memText(used: number | null, total: number | null): string {
  if (used == null) return '—';
  const mb = (b: number) => `${Math.round(b / 1048576)}MB`;
  return total ? `${mb(used)} / ${mb(total)}` : mb(used);
}

/** Live router metrics, updated in real time by the agent heartbeat. */
export function RouterOverview({ router }: { router: Router }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Hali</p>
            <div className="mt-1"><RouterStatusBadge status={router.status} /></div>
          </div>
        </Card>
        <Stat icon={CpuChipIcon} label="CPU" value={router.cpuLoad != null ? `${router.cpuLoad}%` : '—'} />
        <Stat icon={CircleStackIcon} label="Memory" value={memText(router.memUsed, router.memTotal)} />
        <Stat icon={ClockIcon} label="Uptime" value={router.uptime ?? '—'} />
        <Stat icon={TagIcon} label="RouterOS" value={router.osVersion ?? '—'} />
        <Stat icon={UsersIcon} label="Watumiaji" value={router.connectedUsers != null ? String(router.connectedUsers) : '—'} />
        <Stat icon={SignalIcon} label="Ping" value={router.pingMs != null ? `${router.pingMs} ms` : '—'} />
        <Stat icon={SignalIcon} label="Response" value={router.responseMs != null ? `${router.responseMs} ms` : '—'} />
      </div>

      <Card>
        <p className="text-sm text-slate-500">Kifaa</p>
        <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
          {router.boardName ?? router.model ?? '—'} · Agent
        </p>
        {router.branchName && (
          <p className="mt-2 text-sm text-slate-500">Tawi: <span className="font-medium">{router.branchName}</span></p>
        )}
        {router.lastSeen && (
          <p className="mt-1 text-xs text-slate-400">Iliyoonekana: {new Date(router.lastSeen).toLocaleString('sw-TZ')}</p>
        )}
      </Card>
    </div>
  );
}
