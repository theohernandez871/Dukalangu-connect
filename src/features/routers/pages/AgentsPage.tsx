import { useState } from 'react';
import { SignalIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { AgentList } from '../components/AgentList';
import { AgentInstallGuide } from '../components/AgentInstallGuide';

const TABS = [
  { id: 'agents', label: 'Agents', icon: <SignalIcon className="h-4 w-4" /> },
  { id: 'guide', label: 'Jinsi ya Kusakinisha', icon: <BookOpenIcon className="h-4 w-4" /> },
];

export function AgentsPage() {
  const [tab, setTab] = useState('agents');

  return (
    <div>
      <PageHeader title="Agents" subtitle="Simamia agents zinazounganisha MikroTik na mfumo" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === 'agents' && <AgentList />}
        {tab === 'guide' && <AgentInstallGuide />}
      </div>
    </div>
  );
}
