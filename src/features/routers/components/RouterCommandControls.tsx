import { useState } from 'react';
import { ArrowPathIcon, PowerIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmDialog } from '@/components/feedback/DeleteConfirmDialog';
import { useRouterCommand } from '../hooks/useRouterCommand';
import { useAuth } from '@/features/auth/hooks/useAuth';

/** Live control buttons for a router: force a full sync, or restart the agent. */
export function RouterCommandControls({ routerId }: { routerId: string }) {
  const { send, sending } = useRouterCommand();
  const { hasPermission } = useAuth();
  const [restarting, setRestarting] = useState(false);

  if (!hasPermission('router:manage')) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" isLoading={sending === 'sync.all'} onClick={() => send(routerId, 'sync.all')}>
        <ArrowPathIcon className="h-4 w-4" /> Sync sasa
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setRestarting(true)}>
        <PowerIcon className="h-4 w-4" /> Restart Agent
      </Button>

      <DeleteConfirmDialog
        open={restarting}
        onClose={() => setRestarting(false)}
        isLoading={sending === 'agent.restart'}
        title="Restart Agent"
        message="Agent itaanzishwa upya. Muunganisho utakatika kwa muda mfupi. Endelea?"
        confirmLabel="Restart"
        onConfirm={async () => {
          await send(routerId, 'agent.restart');
          setRestarting(false);
        }}
      />
    </div>
  );
}
