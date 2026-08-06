import { useState } from 'react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { HotspotActiveTab } from './HotspotActiveTab';
import { HotspotUsersTab } from './HotspotUsersTab';
import { HotspotServersTab } from './HotspotServersTab';
import { IpBindingsTab } from './IpBindingsTab';

const SUB_TABS: TabItem[] = [
  { id: 'active', label: 'Hai sasa' },
  { id: 'users', label: 'Watumiaji' },
  { id: 'servers', label: 'Servers' },
  { id: 'bindings', label: 'IP Bindings' },
];

export function HotspotTab({ routerId }: { routerId: string }) {
  const [sub, setSub] = useState('active');
  return (
    <div className="space-y-4">
      <Tabs tabs={SUB_TABS} active={sub} onChange={setSub} />
      {sub === 'active' && <HotspotActiveTab routerId={routerId} />}
      {sub === 'users' && <HotspotUsersTab routerId={routerId} />}
      {sub === 'servers' && <HotspotServersTab routerId={routerId} />}
      {sub === 'bindings' && <IpBindingsTab routerId={routerId} />}
    </div>
  );
}
