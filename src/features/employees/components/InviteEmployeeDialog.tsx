import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { inviteEmployeeSchema, ASSIGNABLE_ROLES, type InviteEmployeeFormInput } from '../schemas/employee.schema';
import { useEmployeeMutations } from '../hooks/useEmployees';
import { useBranches } from '@/features/companies/hooks/useCompany';
import { ROLE_DEFINITIONS } from '@/constants/rbac';

interface InviteEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InviteEmployeeDialog({ open, onClose }: InviteEmployeeDialogProps) {
  const { invite } = useEmployeeMutations();
  const { data: branches } = useBranches();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteEmployeeFormInput>({ resolver: zodResolver(inviteEmployeeSchema) });

  const roleOptions = ASSIGNABLE_ROLES.map((r) => ({ value: r, label: ROLE_DEFINITIONS[r].label }));
  const branchOptions = (branches ?? []).map((b) => ({ value: b.id, label: b.name }));

  const submit = handleSubmit((values) => {
    invite.mutate(values, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Alika mfanyakazi"
      description="Tutamtumia barua pepe ya mwaliko"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Ghairi
          </Button>
          <Button onClick={submit} isLoading={invite.isPending}>
            Tuma mwaliko
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {invite.isError && <Alert tone="danger">{(invite.error as Error)?.message ?? 'Imeshindikana'}</Alert>}
        <Input label="Jina kamili" placeholder="Asha Juma" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Barua pepe" type="email" placeholder="asha@mfano.com" error={errors.email?.message} {...register('email')} />
        <Select label="Jukumu" placeholder="Chagua jukumu" options={roleOptions} error={errors.role?.message} {...register('role')} />
        <Select label="Tawi" placeholder="Chagua tawi" options={branchOptions} error={errors.branchId?.message} {...register('branchId')} />
      </form>
    </Dialog>
  );
}
