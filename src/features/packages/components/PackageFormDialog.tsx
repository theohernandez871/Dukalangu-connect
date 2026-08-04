import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { PackageDynamicFields } from './PackageDynamicFields';
import { packageSchema, type PackageFormInput } from '../schemas/package.schema';
import { usePackageMutations } from '../hooks/usePackages';
import { useBranches } from '@/features/companies/hooks/useCompany';
import { PACKAGE_TYPES } from '../types/package';
import { PACKAGE_TYPE_META } from '../constants/packageMeta';
import type { Package } from '../types/package';

interface PackageFormDialogProps {
  open: boolean;
  onClose: () => void;
  pkg?: Package | null;
}

const typeOptions = PACKAGE_TYPES.map((t) => ({ value: t, label: PACKAGE_TYPE_META[t].label }));

export function PackageFormDialog({ open, onClose, pkg }: PackageFormDialogProps) {
  const { create, update } = usePackageMutations();
  const { data: branches } = useBranches();
  const isEdit = !!pkg;
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PackageFormInput>({
    resolver: zodResolver(packageSchema),
    defaultValues: { type: 'time', isActive: true },
  });

  const type = watch('type');

  useEffect(() => {
    if (open) {
      reset({
        type: pkg?.type ?? 'time',
        name: pkg?.name ?? '',
        description: pkg?.description ?? '',
        price: pkg?.price ?? 0,
        branchId: pkg?.branchId ?? '',
        durationValue: pkg?.durationValue ?? undefined,
        durationUnit: pkg?.durationUnit ?? undefined,
        dataLimitMb: pkg?.dataLimitMb ?? undefined,
        speedDownKbps: pkg?.speedDownKbps ?? undefined,
        speedUpKbps: pkg?.speedUpKbps ?? undefined,
        routerProfile: pkg?.routerProfile ?? '',
        isActive: pkg?.isActive ?? true,
      });
    }
  }, [open, pkg, reset]);

  const branchOptions = (branches ?? []).map((b) => ({ value: b.id, label: b.name }));

  const submit = handleSubmit((values) => {
    const done = { onSuccess: onClose };
    if (isEdit && pkg) update.mutate({ id: pkg.id, input: values }, done);
    else create.mutate(values, done);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Hariri kifurushi' : 'Ongeza kifurushi'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} isLoading={mutation.isPending}>{isEdit ? 'Hifadhi' : 'Ongeza'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mutation.isError && <Alert tone="danger">Imeshindikana. Angalia taarifa.</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Aina ya kifurushi" options={typeOptions} error={errors.type?.message} {...register('type')} />
          <Input label="Jina" placeholder="Saa 1" error={errors.name?.message} {...register('name')} />
        </div>
        <p className="-mt-2 text-xs text-slate-400">{PACKAGE_TYPE_META[type].description}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Bei (TSH)" type="number" placeholder="1000" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
          <Select label="Tawi (hiari)" placeholder="Kampuni nzima" options={branchOptions} error={errors.branchId?.message} {...register('branchId')} />
        </div>

        <PackageDynamicFields type={type} register={register} errors={errors} />

        <Input label="RouterOS/Omada profile (hiari)" placeholder="1hour-profile" error={errors.routerProfile?.message} {...register('routerProfile')} />
        <Input label="Maelezo (hiari)" placeholder="Kifurushi cha saa moja" error={errors.description?.message} {...register('description')} />
      </form>
    </Dialog>
  );
}
