import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { PortalSettingsTab } from '../components/PortalSettingsTab';
import { PortalAdsTab } from '../components/PortalAdsTab';
import { PortalOffersTab } from '../components/PortalOffersTab';
import { PortalAnnouncementsTab } from '../components/PortalAnnouncementsTab';

const TABS: TabItem[] = [
  { id: 'settings', label: 'Mipangilio' },
  { id: 'ads', label: 'Matangazo (Ads)' },
  { id: 'offers', label: 'Ofa' },
  { id: 'announcements', label: 'Matangazo' },
];

export function PortalAdminPage() {
  const [tab, setTab] = useState('settings');

  return (
    <div>
      <PageHeader title="Portal ya Wateja" subtitle="Simamia captive portal: branding, matangazo, ofa" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === 'settings' && <PortalSettingsTab />}
        {tab === 'ads' && <PortalAdsTab />}
        {tab === 'offers' && <PortalOffersTab />}
        {tab === 'announcements' && <PortalAnnouncementsTab />}
      </div>
    </div>
  );
}
