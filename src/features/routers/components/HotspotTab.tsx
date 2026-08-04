import { useState } from 'react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { HotspotActiveTab } from './HotspotActiveTab';
import { HotspotUsersTab } from './HotspotUsersTab';

const SUB_TABS: TabItem[] = [
  { id: 'active', label: 'Hai sasa' },
  { id: 'users', label: 'Watumiaji wote' },
];

export function HotspotTab({ routerId }: { routerId: string }) {
  const [sub, setSub] = useState('active');
  return (
    <div className="space-y-4">
      <Tabs tabs={SUB_TABS} active={sub} onChange={setSub} />
      {sub === 'active' ? <HotspotActiveTab routerId={routerId} /> : <HotspotUsersTab routerId={routerId} />}
    </div>
  );
}
