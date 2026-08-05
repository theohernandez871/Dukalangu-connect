import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOffers, usePortalResource } from '../hooks/usePortalAdmin';
import { usePackages } from '@/features/packages/hooks/usePackages';
import { formatTsh } from '@/utils/currency';
import type { PortalOffer } from '../types/portal';

export function PortalOffersTab() {
  const { data, isLoading } = useOffers();
  const { save, remove } = usePortalResource('offers');
  const { data: packages } = usePackages();
  const [editing, setEditing] = useState<Partial<PortalOffer> | null>(null);
  const [deleting, setDeleting] = useState<PortalOffer | null>(null);

  if (isLoading) return <Skeleton className="h-64" />;

  const pkgOptions = [{ value: '', label: 'Hakuna' }, ...(packages ?? []).map((p) => ({ value: p.id, label: p.name }))];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({})}><PlusIcon className="h-5 w-5" /> Ongeza ofa</Button>
      </div>

      {(data ?? []).length === 0 ? (
        <EmptyState title="Hakuna ofa" description="Ongeza ofa ya kwanza." />
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((o) => (
            <Card key={o.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{o.title}</p>
                  {o.badge && <span className="rounded-full bg-primary-600/10 px-2 py-0.5 text-xs text-primary-600">{o.badge}</span>}
                </div>
                {o.description && <p className="text-sm text-slate-500">{o.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {o.promo_price != null && <span className="font-semibold text-primary-600">{formatTsh(o.promo_price)}</span>}
                <Button variant="ghost" size="sm" onClick={() => setEditing(o)} aria-label="Hariri"><PencilSquareIcon className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(o)} aria-label="Futa"><TrashIcon className="h-4 w-4 text-danger-600" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Hariri ofa' : 'Ongeza ofa'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Ghairi</Button>
            <Button isLoading={save.isPending} onClick={() => editing && save.mutate(editing, { onSuccess: () => setEditing(null) })}>Hifadhi</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input label="Kichwa" value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input label="Maelezo (hiari)" value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Bei ya promo (hiari)" type="number" value={editing.promo_price ?? ''} onChange={(e) => setEditing({ ...editing, promo_price: e.target.value ? Number(e.target.value) : null })} />
              <Input label="Badge (hiari)" placeholder="Punguzo" value={editing.badge ?? ''} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} />
            </div>
            <Select label="Kifurushi (hiari)" options={pkgOptions} value={editing.package_id ?? ''} onChange={(e) => setEditing({ ...editing, package_id: e.target.value || null })} />
          </div>
        )}
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isLoading={remove.isPending}
        message="Futa ofa hii?"
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
