import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { RouterList } from '../components/RouterList';
import { RouterFormDialog } from '../components/RouterFormDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function RoutersPage() {
  const [creating, setCreating] = useState(false);
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');

  return (
    <div>
      <PageHeader
        title="Routers"
        subtitle="Simamia router zako za MikroTik"
        actions={
          canManage && (
            <Button onClick={() => setCreating(true)}>
              <PlusIcon className="h-5 w-5" /> Ongeza router
            </Button>
          )
        }
      />

      <div className="mb-4">
        <Alert tone="info">
          Muunganisho halisi (test, hali ya moja kwa moja, na hotspot) utawezeshwa hatua ijayo (4b) pamoja na agent.
        </Alert>
      </div>

      <RouterList />
      <RouterFormDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
