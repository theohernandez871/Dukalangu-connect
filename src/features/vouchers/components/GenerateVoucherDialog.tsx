import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { generateSchema, type GenerateFormInput } from '../schemas/voucher.schema';
import { useVoucherMutations } from '../hooks/useVouchers';
import { usePackages } from '@/features/packages/hooks/usePackages';
import { useBranches } from '@/features/companies/hooks/useCompany';
import { useRouters } from '@/features/routers/hooks/useRouters';

interface GenerateVoucherDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (batchId: string) => void;
}

export function GenerateVoucherDialog({ open, onClose, onGenerated }: GenerateVoucherDialogProps) {
  const { generate } = useVoucherMutations();
  const { data: packages } = usePackages();
  const { data: branches } = useBranches();
  const { data: routers } = useRouters();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GenerateFormInput>({
    resolver: zodResolver(generateSchema),
    defaultValues: { count: 50, length: 8 },
  });

  const pkgOptions = (packages ?? []).filter((p) => p.isActive).map((p) => ({ value: p.id, label: p.name }));
  const branchOptions = (branches ?? []).map((b) => ({ value: b.id, label: b.name }));
  const routerOptions = (routers ?? []).map((r) => ({ value: r.id, label: r.name }));

  // When a package is chosen, prefill the RouterOS profile from the package's
  // routerProfile (the real MikroTik profile NAME), so a UUID can never be sent
  // as the profile. The user can still override the text if needed.
  const selectedPackageId = watch('packageId');
  useEffect(() => {
    const pkg = (packages ?? []).find((p) => p.id === selectedPackageId);
    if (pkg?.routerProfile) setValue('routerProfile', pkg.routerProfile);
  }, [selectedPackageId, packages, setValue]);

  const submit = handleSubmit((values) => {
    generate.mutate(values, {
      onSuccess: (result) => {
        reset({ count: 50, length: 8 });
        onGenerated(result.batchId);
        onClose();
      },
    });
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tengeneza vocha"
      description="Vocha za numeric (rahisi kwa simu)"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} isLoading={generate.isPending}>Tengeneza</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3" noValidate>
        {generate.isError && (
          <Alert tone="danger">
            {generate.error instanceof Error ? generate.error.message : 'Imeshindikana kutengeneza vocha.'}
          </Alert>
        )}
        <Select label="Kifurushi" placeholder="Chagua kifurushi" options={pkgOptions} error={errors.packageId?.message} {...register('packageId')} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Idadi ya vocha" type="number" placeholder="50" error={errors.count?.message} {...register('count', { valueAsNumber: true })} />
          <Input label="Urefu wa namba" type="number" placeholder="8" error={errors.length?.message} {...register('length', { valueAsNumber: true })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Prefix (hiari)" placeholder="URM" error={errors.prefix?.message} {...register('prefix')} />
          <Input label="Uhalali (siku, hiari)" type="number" placeholder="30" error={errors.validDays?.message} {...register('validDays', { valueAsNumber: true })} />
        </div>
        <Select label="Tawi (hiari)" placeholder="Kampuni nzima" options={branchOptions} error={errors.branchId?.message} {...register('branchId')} />

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Peleka MikroTik (hiari)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Router" placeholder="Usipeleke" options={routerOptions} error={errors.routerId?.message} {...register('routerId')} />
            <Input label="Profile ya RouterOS" placeholder="default" error={errors.routerProfile?.message} {...register('routerProfile')} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Ukichagua router, vocha zitaundwa kama hotspot users kwenye MikroTik moja kwa moja.
            Profile lazima iwepo kwenye router (mfano "default" au jina la package yako).
          </p>
        </div>

        <Input label="Maelezo (hiari)" placeholder="Vocha za Desemba" error={errors.notes?.message} {...register('notes')} />
      </form>
    </Dialog>
  );
}
