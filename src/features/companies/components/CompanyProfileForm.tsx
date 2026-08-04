import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { companySchema, type CompanyInput } from '../schemas/company.schema';
import { useCompany, useUpdateCompany } from '../hooks/useCompany';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function CompanyProfileForm() {
  const { data, isLoading } = useCompany();
  const update = useUpdateCompany();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('company:manage');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyInput>({ resolver: zodResolver(companySchema) });

  useEffect(() => {
    if (data) reset({ name: data.name });
  }, [data, reset]);

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-11 w-full" />
      </Card>
    );
  }

  const submit = handleSubmit((values) => update.mutate(values.name));

  return (
    <Card>
      <CardHeader title="Taarifa za kampuni" subtitle="Jina litakaloonekana kwenye risiti na portal" />
      <form onSubmit={submit} className="space-y-4" noValidate>
        {update.isSuccess && <Alert tone="success">Taarifa zimehifadhiwa.</Alert>}
        {update.isError && <Alert tone="danger">Imeshindikana kuhifadhi.</Alert>}
        <Input label="Jina la kampuni" disabled={!canManage} error={errors.name?.message} {...register('name')} />
        {data && (
          <p className="text-xs text-slate-400">
            Kitambulisho (slug): <span className="font-mono">{data.slug}</span>
          </p>
        )}
        {canManage && (
          <div className="flex justify-end">
            <Button type="submit" isLoading={update.isPending} disabled={!isDirty}>
              Hifadhi
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
