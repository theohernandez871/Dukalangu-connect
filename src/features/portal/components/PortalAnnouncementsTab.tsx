import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAnnouncements, usePortalResource } from '../hooks/usePortalAdmin';
import type { PortalAnnouncement } from '../types/portal';

const LEVEL_OPTIONS = [
  { value: 'info', label: 'Taarifa' },
  { value: 'warning', label: 'Onyo' },
  { value: 'success', label: 'Mafanikio' },
];
const LEVEL_TONE: Record<string, 'info' | 'warning' | 'success'> = { info: 'info', warning: 'warning', success: 'success' };

export function PortalAnnouncementsTab() {
  const { data, isLoading } = useAnnouncements();
  const { save, remove } = usePortalResource('announcements');
  const [editing, setEditing] = useState<Partial<PortalAnnouncement> | null>(null);
  const [deleting, setDeleting] = useState<PortalAnnouncement | null>(null);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ level: 'info' })}><PlusIcon className="h-5 w-5" /> Ongeza tangazo</Button>
      </div>

      {(data ?? []).length === 0 ? (
        <EmptyState title="Hakuna matangazo" description="Ongeza tangazo la kwanza." />
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((a) => (
            <Card key={a.id} className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  <Badge tone={LEVEL_TONE[a.level]}>{LEVEL_OPTIONS.find((l) => l.value === a.level)?.label}</Badge>
                </div>
                {a.body && <p className="mt-0.5 text-sm text-slate-500">{a.body}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(a)} aria-label="Hariri"><PencilSquareIcon className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(a)} aria-label="Futa"><TrashIcon className="h-4 w-4 text-danger-600" /></Button>
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
            <Input label="Kichwa" value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input label="Maelezo (hiari)" value={editing.body ?? ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
            <Select label="Aina" options={LEVEL_OPTIONS} value={editing.level ?? 'info'} onChange={(e) => setEditing({ ...editing, level: e.target.value as PortalAnnouncement['level'] })} />
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
