import { useState } from 'react';
import { PlusIcon, ServerStackIcon, SignalIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { RouterList } from '../components/RouterList';
import { RouterFormDialog } from '../components/RouterFormDialog';
import { AgentList } from '../components/AgentList';
import { useAuth } from '@/features/auth/hooks/useAuth';

const TABS: TabItem[] = [
  { id: 'routers', label: 'Routers', icon: <ServerStackIcon className="h-4 w-4" /> },
  { id: 'agents', label: 'Agents', icon: <SignalIcon className="h-4 w-4" /> },
];

export function RoutersPage() {
  const [tab, setTab] = useState('routers');
  const [creating, setCreating] = useState(false);
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');

  return (
    <div>
      <PageHeader
        title="Routers"
        subtitle="Simamia router zako za MikroTik na agents"
        actions={
          canManage && tab === 'routers' ? (
            <Button onClick={() => setCreating(true)}>
              <PlusIcon className="h-5 w-5" /> Ongeza router
            </Button>
          ) : undefined
        }
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === 'routers' && <RouterList />}
        {tab === 'agents' && <AgentList />}
      </div>

      <RouterFormDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
