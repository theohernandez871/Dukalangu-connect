import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Alert } from '@/components/feedback/Alert';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { OmadaStatusBadge } from '../components/OmadaStatusBadge';
import { DevicesTab } from '../components/DevicesTab';
import { ClientsTab } from '../components/ClientsTab';
import { useController } from '../hooks/useOmada';
import { ROUTES } from '@/constants/routes';

const TABS: TabItem[] = [
  { id: 'devices', label: 'Vifaa vyote' },
  { id: 'aps', label: 'Access Points' },
  { id: 'clients', label: 'Wateja / Signal' },
];

export function OmadaDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: ctrl, isLoading, isError, refetch } = useController(id);
  const [tab, setTab] = useState('devices');

  if (isLoading) return <FullPageLoader />;
  if (isError || !ctrl) return <ErrorState onRetry={() => refetch()} />;

  const isLocal = ctrl.connectionType === 'local';

  return (
    <div>
      <button
        onClick={() => navigate(ROUTES.tplink)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Rudi kwa TP-Link
      </button>

      <PageHeader
        title={ctrl.name}
        subtitle={ctrl.baseUrl ?? 'Agent (local)'}
        actions={<OmadaStatusBadge status={ctrl.status} />}
      />

      {isLocal && (
        <div className="mb-4">
          <Alert tone="info">
            Controller hii inatumia muunganisho wa ndani (agent). Usomaji wa moja kwa moja wa data
            utawezeshwa agent itakapopanuliwa kushughulikia Omada.
          </Alert>
        </div>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {isLocal ? (
          <Alert tone="warning">Data ya Omada ya local haipatikani bado kwenye toleo hili.</Alert>
        ) : (
          <>
            {tab === 'devices' && <DevicesTab controllerId={ctrl.id} />}
            {tab === 'aps' && <DevicesTab controllerId={ctrl.id} apOnly />}
            {tab === 'clients' && <ClientsTab controllerId={ctrl.id} />}
          </>
        )}
      </div>
    </div>
  );
}
