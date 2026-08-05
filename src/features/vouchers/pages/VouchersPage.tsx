import { useState } from 'react';
import { PlusIcon, RectangleStackIcon, TicketIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { VoucherBatchList } from '../components/VoucherBatchList';
import { VoucherTable } from '../components/VoucherTable';
import { GenerateVoucherDialog } from '../components/GenerateVoucherDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

const TABS: TabItem[] = [
  { id: 'batches', label: 'Makundi (Batches)', icon: <RectangleStackIcon className="h-4 w-4" /> },
  { id: 'all', label: 'Vocha zote', icon: <TicketIcon className="h-4 w-4" /> },
];

export function VouchersPage() {
  const [tab, setTab] = useState('batches');
  const [generating, setGenerating] = useState(false);
  const [viewBatch, setViewBatch] = useState<string | null>(null);
  const { hasPermission } = useAuth();
  const canManage = hasPermission('voucher:manage');

  const openBatch = (batchId: string) => {
    setViewBatch(batchId);
    setTab('all');
  };

  return (
    <div>
      <PageHeader
        title="Vocha"
        subtitle="Tengeneza, chapisha, na fuatilia vocha"
        actions={
          canManage && (
            <Button onClick={() => setGenerating(true)}>
              <PlusIcon className="h-5 w-5" /> Tengeneza vocha
            </Button>
          )
        }
      />

      <Tabs tabs={TABS} active={tab} onChange={(t) => { setTab(t); if (t === 'batches') setViewBatch(null); }} />
      <div className="mt-6">
        {tab === 'batches' && <VoucherBatchList onView={openBatch} />}
        {tab === 'all' && <VoucherTable batchId={viewBatch ?? undefined} />}
      </div>

      <GenerateVoucherDialog
        open={generating}
        onClose={() => setGenerating(false)}
        onGenerated={openBatch}
      />
    </div>
  );
}
