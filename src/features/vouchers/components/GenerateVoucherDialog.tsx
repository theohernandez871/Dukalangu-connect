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

interface GenerateVoucherDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (batchId: string) => void;
}

export function GenerateVoucherDialog({ open, onClose, onGenerated }: GenerateVoucherDialogProps) {
  const { generate } = useVoucherMutations();
  const { data: packages } = usePackages();
  const { data: branches } = useBranches();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerateFormInput>({
    resolver: zodResolver(generateSchema),
    defaultValues: { count: 50, length: 8 },
  });

  const pkgOptions = (packages ?? []).filter((p) => p.isActive).map((p) => ({ value: p.id, label: p.name }));
  const branchOptions = (branches ?? []).map((b) => ({ value: b.id, label: b.name }));

  const submit = handleSubmit((values) => {
    generate.mutate(values, {
      onSuccess: (batchId) => {
        reset({ count: 50, length: 8 });
        onGenerated(batchId);
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
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} isLoading={generate.isPending}>Tengeneza</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {generate.isError && <Alert tone="danger">Imeshindikana kutengeneza vocha.</Alert>}
        <Select label="Kifurushi" placeholder="Chagua kifurushi" options={pkgOptions} error={errors.packageId?.message} {...register('packageId')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Idadi ya vocha" type="number" placeholder="50" error={errors.count?.message} {...register('count', { valueAsNumber: true })} />
          <Input label="Urefu wa namba" type="number" placeholder="8" error={errors.length?.message} {...register('length', { valueAsNumber: true })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Prefix (hiari)" placeholder="URM" error={errors.prefix?.message} {...register('prefix')} />
          <Input label="Uhalali (siku, hiari)" type="number" placeholder="30" error={errors.validDays?.message} {...register('validDays', { valueAsNumber: true })} />
        </div>
        <Select label="Tawi (hiari)" placeholder="Kampuni nzima" options={branchOptions} error={errors.branchId?.message} {...register('branchId')} />
        <Input label="Maelezo (hiari)" placeholder="Vocha za Desemba" error={errors.notes?.message} {...register('notes')} />
      </form>
    </Dialog>
  );
}
