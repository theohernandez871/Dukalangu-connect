import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { omadaSchema, type OmadaFormInput } from '../schemas/omada.schema';
import { useControllerMutations } from '../hooks/useOmada';
import { useBranches } from '@/features/companies/hooks/useCompany';
import type { OmadaController } from '../types/omada';

interface OmadaFormDialogProps {
  open: boolean;
  onClose: () => void;
  controller?: OmadaController | null;
}

const CONN_OPTIONS = [
  { value: 'cloud', label: 'Cloud / Public URL (Edge Function)' },
  { value: 'local', label: 'Ndani / CGNAT (Agent)' },
];

export function OmadaFormDialog({ open, onClose, controller }: OmadaFormDialogProps) {
  const { create, update } = useControllerMutations();
  const { data: branches } = useBranches();
  const isEdit = !!controller;
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<OmadaFormInput>({
    resolver: zodResolver(omadaSchema),
    defaultValues: { connectionType: 'cloud' },
  });

  const connType = watch('connectionType');

  useEffect(() => {
    if (open) {
      reset({
        name: controller?.name ?? '',
        connectionType: controller?.connectionType ?? 'cloud',
        branchId: controller?.branchId ?? '',
        baseUrl: controller?.baseUrl ?? '',
        omadacId: controller?.omadacId ?? '',
        siteId: controller?.siteId ?? '',
        username: controller?.username ?? '',
        password: '',
      });
    }
  }, [open, controller, reset]);

  const branchOptions = (branches ?? []).map((b) => ({ value: b.id, label: b.name }));

  const submit = handleSubmit((values) => {
    const done = { onSuccess: onClose };
    if (isEdit && controller) update.mutate({ id: controller.id, input: values }, done);
    else create.mutate(values, done);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Hariri controller' : 'Ongeza Omada controller'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} isLoading={mutation.isPending}>{isEdit ? 'Hifadhi' : 'Ongeza'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mutation.isError && <Alert tone="danger">Imeshindikana. Jaribu tena.</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Jina" placeholder="Omada ya Geita" error={errors.name?.message} {...register('name')} />
          <Select label="Aina ya muunganisho" options={CONN_OPTIONS} error={errors.connectionType?.message} {...register('connectionType')} />
        </div>
        <Select label="Tawi" placeholder="Chagua tawi" options={branchOptions} error={errors.branchId?.message} {...register('branchId')} />

        {connType === 'cloud' && (
          <Input label="Base URL" placeholder="https://omada.mfano.com:8043" error={errors.baseUrl?.message} {...register('baseUrl')} />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Omada Controller ID (omadacId)" placeholder="hex..." error={errors.omadacId?.message} {...register('omadacId')} />
          <Input label="Site ID" placeholder="Default" error={errors.siteId?.message} {...register('siteId')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Jina la mtumiaji" placeholder="admin" error={errors.username?.message} {...register('username')} />
          <PasswordInput label={isEdit ? 'Nywila mpya (hiari)' : 'Nywila'} placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        </div>
        <p className="text-xs text-slate-400">
          Nywila huhifadhiwa kwa usalama (Vault) na haionekani tena baada ya kuhifadhi.
        </p>
      </form>
    </Dialog>
  );
}
