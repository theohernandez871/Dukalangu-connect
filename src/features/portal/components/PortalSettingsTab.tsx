import { useEffect, useState } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { CopyButton } from '@/components/ui/CopyButton';
import { Alert } from '@/components/feedback/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePortalSettings, usePortalSettingsMutation } from '../hooks/usePortalAdmin';
import type { PortalSettings } from '../types/portal';

export function PortalSettingsTab() {
  const { data, isLoading } = usePortalSettings();
  const update = usePortalSettingsMutation();
  const [form, setForm] = useState<Partial<PortalSettings>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading) return <Skeleton className="h-96" />;

  const set = (k: keyof PortalSettings, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const portalUrl = form.slug ? `${window.location.origin}/portal/${form.slug}` : '';

  return (
    <div className="space-y-4">
      {portalUrl && (
        <Card className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <LinkIcon className="h-5 w-5 shrink-0 text-primary-600" />
            <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="truncate text-sm text-primary-600 hover:underline">
              {portalUrl}
            </a>
          </div>
          <CopyButton value={portalUrl} />
        </Card>
      )}

      {update.isSuccess && <Alert tone="success">Mabadiliko yamehifadhiwa.</Alert>}

      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Jina la biashara" value={form.brand_name ?? ''} onChange={(e) => set('brand_name', e.target.value)} />
          <Input label="Slug (anwani ya portal)" value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Logo URL" placeholder="https://..." value={form.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Rangi kuu</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color ?? '#059669'} onChange={(e) => set('primary_color', e.target.value)} className="h-10 w-14 rounded-lg border border-slate-200" />
              <Input value={form.primary_color ?? ''} onChange={(e) => set('primary_color', e.target.value)} />
            </div>
          </div>
        </div>
        <Input label="Kichwa cha karibu" value={form.welcome_title ?? ''} onChange={(e) => set('welcome_title', e.target.value)} />
        <Input label="Ujumbe wa karibu" value={form.welcome_message ?? ''} onChange={(e) => set('welcome_message', e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Simu ya msaada" value={form.support_phone ?? ''} onChange={(e) => set('support_phone', e.target.value)} />
          <div className="flex items-end gap-3 pb-1">
            <Switch checked={form.is_enabled ?? true} onChange={(v) => set('is_enabled', v)} />
            <span className="text-sm text-slate-600 dark:text-slate-300">Portal imewashwa</span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => update.mutate(form)} isLoading={update.isPending}>Hifadhi</Button>
        </div>
      </Card>
    </div>
  );
}
