import { useState } from 'react';
import { BoltIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Alert } from '@/components/feedback/Alert';
import { useRouterCommand } from '../hooks/useAgents';

/** Triggers a lightweight 'identity' command to verify the agent path. */
export function RouterTestButton({ routerId }: { routerId: string }) {
  const { run, result, isRunning, phase } = useRouterCommand();
  const [open, setOpen] = useState(false);

  const test = async () => {
    setOpen(true);
    await run(routerId, 'identity');
  };

  const failed = result?.status === 'failed' || result?.status === 'timeout';

  return (
    <>
      <Button variant="secondary" size="sm" onClick={test} isLoading={isRunning}>
        <BoltIcon className="h-4 w-4" /> Jaribu
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Matokeo ya jaribio"
        size="sm"
        footer={<Button onClick={() => setOpen(false)}>Sawa</Button>}
      >
        {isRunning && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">{phase ?? 'Inatuma amri kwa agent...'}</p>
            <p className="text-xs text-slate-400">
              Inasubiri agent iitekeleze (hadi sekunde 30). Agent lazima IWE INAENDESHWA kwenye kifaa cha LAN.
            </p>
          </div>
        )}
        {!isRunning && !result && (
          <Alert tone="warning">Hakuna majibu. Hakikisha agent imeunganishwa na inaendeshwa.</Alert>
        )}
        {!isRunning && result && !failed && (
          <div className="space-y-2">
            <Alert tone="success">Muunganisho umefanikiwa! Agent imewasiliana na RouterOS.</Alert>
            <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        )}
        {!isRunning && result && failed && (
          <div className="space-y-2">
            <Alert tone="danger">{result.error ?? 'Muunganisho umeshindikana au umechelewa.'}</Alert>
            <p className="text-xs text-slate-400">
              Angalia console (F12) kwa maelezo zaidi ya kila hatua.
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}
