import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAds, usePortalResource } from '../hooks/usePortalAdmin';
import type { PortalAd } from '../types/portal';

export function PortalAdsTab() {
  const { data, isLoading } = useAds();
  const { save, remove } = usePortalResource('ads');
  const [editing, setEditing] = useState<Partial<PortalAd> | null>(null);
  const [deleting, setDeleting] = useState<PortalAd | null>(null);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({})}>
          <PlusIcon className="h-5 w-5" /> Ongeza tangazo
        </Button>
      </div>

      {(data ?? []).length === 0 ? (
        <EmptyState title="Hakuna matangazo" description="Ongeza banner ya kwanza." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((ad) => (
            <Card key={ad.id} className="space-y-2">
              <div className="aspect-[16/6] overflow-hidden rounded-xl bg-slate-100">
                <img src={ad.image_url} alt={ad.title ?? ''} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium">{ad.title ?? 'Bila kichwa'}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(ad)} aria-label="Hariri"><PencilSquareIcon className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(ad)} aria-label="Futa"><TrashIcon className="h-4 w-4 text-danger-600" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Hariri tangazo' : 'Ongeza tangazo'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Ghairi</Button>
            <Button isLoading={save.isPending} onClick={() => editing && save.mutate(editing, { onSuccess: () => setEditing(null) })}>Hifadhi</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input label="Kichwa (hiari)" value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input label="Picha URL" placeholder="https://..." value={editing.image_url ?? ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
            <Input label="Link (hiari)" placeholder="https://..." value={editing.link_url ?? ''} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} />
          </div>
        )}
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isLoading={remove.isPending}
        message="Futa tangazo hili?"
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
