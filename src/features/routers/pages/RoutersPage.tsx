import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { RouterList } from '../components/RouterList';
import { RouterFormDialog } from '../components/RouterFormDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouterRealtime } from '../hooks/useRouterRealtime';

export function RoutersPage() {
  const [creating, setCreating] = useState(false);
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');
  useRouterRealtime();

  return (
    <div>
      <PageHeader
        title="Routers"
        subtitle="Simamia router zako za MikroTik"
        actions={
          canManage ? (
            <Button onClick={() => setCreating(true)}>
              <PlusIcon className="h-5 w-5" /> Ongeza router
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6">
        <RouterList />
      </div>

      <RouterFormDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
