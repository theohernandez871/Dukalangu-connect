import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { routerSchema, type RouterFormInput } from '../schemas/router.schema';
import { useRouterMutations } from '../hooks/useRouters';
import { useBranches } from '@/features/companies/hooks/useCompany';
import type { Router } from '../types/router';

interface RouterFormDialogProps {
  open: boolean;
  onClose: () => void;
  router?: Router | null;
}

export function RouterFormDialog({ open, onClose, router }: RouterFormDialogProps) {
  const { create, update } = useRouterMutations();
  const { data: branches } = useBranches();
  const isEdit = !!router;
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RouterFormInput>({
    resolver: zodResolver(routerSchema),
    defaultValues: { connectionType: 'agent', apiPort: 8728 },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: router?.name ?? '',
        connectionType: 'agent',
        branchId: router?.branchId ?? '',
        host: router?.host ?? '',
        apiPort: router?.apiPort ?? 8728,
        username: router?.username ?? '',
        password: '',
      });
    }
  }, [open, router, reset]);

  const branchOptions = (branches ?? []).map((b) => ({ value: b.id, label: b.name }));

  const submit = handleSubmit((values) => {
    const done = { onSuccess: onClose };
    if (isEdit && router) update.mutate({ id: router.id, input: values }, done);
    else create.mutate(values, done);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Hariri router' : 'Ongeza router'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} isLoading={mutation.isPending}>
            {isEdit ? 'Hifadhi' : 'Ongeza'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mutation.isError && <Alert tone="danger">Imeshindikana. Jaribu tena.</Alert>}
        <Input label="Jina la router" placeholder="Router ya Geita" error={errors.name?.message} {...register('name')} />
        <Select label="Tawi" placeholder="Chagua tawi" options={branchOptions} error={errors.branchId?.message} {...register('branchId')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Jina la mtumiaji (RouterOS)" placeholder="admin" error={errors.username?.message} {...register('username')} />
          <PasswordInput label={isEdit ? 'Nywila mpya (hiari)' : 'Nywila ya RouterOS'} placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        </div>
        <p className="text-xs text-slate-400">
          Router huunganishwa kupitia Agent (salama, inafanya kazi hata nyuma ya CGNAT). Nywila huhifadhiwa encrypted.
        </p>
      </form>
    </Dialog>
  );
}
