import { useState } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmployeeTable } from '../components/EmployeeTable';
import { InviteEmployeeDialog } from '../components/InviteEmployeeDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function EmployeesPage() {
  const [inviting, setInviting] = useState(false);
  const { hasPermission } = useAuth();
  const canManage = hasPermission('employee:manage');

  return (
    <div>
      <PageHeader
        title="Wafanyakazi"
        subtitle="Simamia timu yako na majukumu yao"
        actions={
          canManage && (
            <Button onClick={() => setInviting(true)}>
              <UserPlusIcon className="h-5 w-5" /> Alika mfanyakazi
            </Button>
          )
        }
      />
      <EmployeeTable />
      <InviteEmployeeDialog open={inviting} onClose={() => setInviting(false)} />
    </div>
  );
}
