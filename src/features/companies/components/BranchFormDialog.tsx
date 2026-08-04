import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { branchSchema, type BranchFormInput } from '../schemas/company.schema';
import { useBranchMutations } from '../hooks/useCompany';
import type { Branch } from '../types/company';

interface BranchFormDialogProps {
  open: boolean;
  onClose: () => void;
  branch?: Branch | null;
}

export function BranchFormDialog({ open, onClose, branch }: BranchFormDialogProps) {
  const { create, update } = useBranchMutations();
  const isEdit = !!branch;
  const mutation = isEdit ? update : create;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormInput>({ resolver: zodResolver(branchSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: branch?.name ?? '',
        location: branch?.location ?? '',
        phone: branch?.phone ?? '',
      });
    }
  }, [open, branch, reset]);

  const submit = handleSubmit((values) => {
    const onDone = { onSuccess: onClose };
    if (isEdit && branch) {
      update.mutate({ id: branch.id, input: values }, onDone);
    } else {
      create.mutate(values, onDone);
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Hariri tawi' : 'Ongeza tawi'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Ghairi
          </Button>
          <Button onClick={submit} isLoading={mutation.isPending}>
            {isEdit ? 'Hifadhi' : 'Ongeza'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mutation.isError && <Alert tone="danger">Imeshindikana. Jaribu tena.</Alert>}
        <Input label="Jina la tawi" placeholder="Tawi la Geita" error={errors.name?.message} {...register('name')} />
        <Input label="Eneo" placeholder="Geita Mjini" error={errors.location?.message} {...register('location')} />
        <Input label="Simu" placeholder="0765 000 000" error={errors.phone?.message} {...register('phone')} />
      </form>
    </Dialog>
  );
}
