import { useEffect, useState } from 'react';
import { KeyIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { CopyButton } from '@/components/ui/CopyButton';
import { useAgentMutations } from '../hooks/useAgents';
import { useRouters } from '../hooks/useRouters';
import type { CreatedAgent } from '../types/agent';

interface AgentCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AgentCreateDialog({ open, onClose }: AgentCreateDialogProps) {
  const { create } = useAgentMutations();
  const { data: routers } = useRouters();
  const [name, setName] = useState('');
  const [routerId, setRouterId] = useState('');
  const [created, setCreated] = useState<CreatedAgent | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setRouterId('');
      setCreated(null);
    }
  }, [open]);

  const routerOptions = (routers ?? []).map((r) => ({ value: r.id, label: r.name }));

  const submit = () => {
    create.mutate(
      { name: name || 'Agent', routerId: routerId || null },
      { onSuccess: setCreated },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={created ? 'Agent imetengenezwa' : 'Tengeneza agent'}
      description={created ? undefined : 'Agent huunganisha router yako na mfumo'}
      footer={
        created ? (
          <Button onClick={onClose}>Nimehifadhi token</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Ghairi</Button>
            <Button onClick={submit} isLoading={create.isPending}>Tengeneza</Button>
          </>
        )
      }
    >
      {created ? (
        <div className="space-y-4">
          <Alert tone="warning">
            Nakili token hii sasa — <strong>haitaonyeshwa tena</strong>. Iweke kwenye agent yako.
          </Alert>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <KeyIcon className="h-5 w-5 shrink-0 text-slate-400" />
            <code className="flex-1 break-all font-mono text-xs text-slate-700 dark:text-slate-200">
              {created.rawToken}
            </code>
            <CopyButton value={created.rawToken} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {create.isError && <Alert tone="danger">Imeshindikana kutengeneza agent.</Alert>}
          <Input label="Jina la agent" placeholder="Agent ya Geita" value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label="Router (hiari)"
            placeholder="Unganisha na router"
            options={routerOptions}
            value={routerId}
            onChange={(e) => setRouterId(e.target.value)}
          />
        </div>
      )}
    </Dialog>
  );
}
