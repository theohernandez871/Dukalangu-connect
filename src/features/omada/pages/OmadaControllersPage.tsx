import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { OmadaList } from '../components/OmadaList';
import { OmadaFormDialog } from '../components/OmadaFormDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function OmadaControllersPage() {
  const [creating, setCreating] = useState(false);
  const { hasPermission } = useAuth();
  const canManage = hasPermission('router:manage');

  return (
    <div>
      <PageHeader
        title="TP-Link Omada"
        subtitle="Simamia Omada controllers, access points, na wateja"
        actions={
          canManage && (
            <Button onClick={() => setCreating(true)}>
              <PlusIcon className="h-5 w-5" /> Ongeza controller
            </Button>
          )
        }
      />
      <OmadaList />
      <OmadaFormDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
