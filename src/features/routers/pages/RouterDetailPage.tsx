import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RouterStatusBadge } from '../components/RouterStatusBadge';
import { RouterOverview } from '../components/RouterOverview';
import { HotspotTab } from '../components/HotspotTab';
import { PppoeTab } from '../components/PppoeTab';
import { DhcpTab } from '../components/DhcpTab';
import { QueuesTab } from '../components/QueuesTab';
import { FirewallTab } from '../components/FirewallTab';
import { ProfilesTab } from '../components/ProfilesTab';
import { useRouter } from '../hooks/useRouters';
import { ROUTES } from '@/constants/routes';

const TABS: TabItem[] = [
  { id: 'overview', label: 'Muhtasari' },
  { id: 'hotspot', label: 'Hotspot' },
  { id: 'pppoe', label: 'PPPoE' },
  { id: 'dhcp', label: 'DHCP' },
  { id: 'queues', label: 'Queues' },
  { id: 'firewall', label: 'Firewall' },
  { id: 'profiles', label: 'Profiles' },
];

export function RouterDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: router, isLoading, isError, refetch } = useRouter(id);
  const [tab, setTab] = useState('overview');

  if (isLoading) return <FullPageLoader />;
  if (isError || !router) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <button
        onClick={() => navigate(ROUTES.routers)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Rudi kwa routers
      </button>

      <PageHeader
        title={router.name}
        subtitle={router.connectionType === 'agent' ? 'Kupitia Agent' : `${router.host}:${router.apiPort}`}
        actions={<RouterStatusBadge status={router.status} />}
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === 'overview' && <RouterOverview router={router} />}
        {tab === 'hotspot' && <HotspotTab routerId={router.id} />}
        {tab === 'pppoe' && <PppoeTab routerId={router.id} />}
        {tab === 'dhcp' && <DhcpTab routerId={router.id} />}
        {tab === 'queues' && <QueuesTab routerId={router.id} />}
        {tab === 'firewall' && <FirewallTab routerId={router.id} />}
        {tab === 'profiles' && <ProfilesTab routerId={router.id} />}
      </div>
    </div>
  );
}
