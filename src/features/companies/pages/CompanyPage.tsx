import { useState } from 'react';
import { BuildingOffice2Icon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { CompanyProfileForm } from '../components/CompanyProfileForm';
import { BranchList } from '../components/BranchList';

const TABS: TabItem[] = [
  { id: 'profile', label: 'Kampuni', icon: <BuildingOffice2Icon className="h-4 w-4" /> },
  { id: 'branches', label: 'Matawi', icon: <BuildingStorefrontIcon className="h-4 w-4" /> },
];

export function CompanyPage() {
  const [tab, setTab] = useState('profile');

  return (
    <div>
      <PageHeader title="Kampuni & Matawi" subtitle="Simamia taarifa za kampuni na matawi yako" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === 'profile' && <div className="max-w-xl"><CompanyProfileForm /></div>}
        {tab === 'branches' && <BranchList />}
      </div>
    </div>
  );
}
