import { useState } from 'react';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Alert } from '@/components/feedback/Alert';
import { useRouterCommand } from '../hooks/useAgents';

interface ServerInfo {
  name?: string;
  interface?: string;
  profile?: string;
  disabled?: string;
  invalid?: string;
}

/** Runs hotspot.diagnose and shows whether the hotspot server is valid + a
 *  test user (test123/test123) to isolate credential vs config problems. */
export function HotspotDiagnoseButton({ routerId }: { routerId: string }) {
  const { run, result, isRunning } = useRouterCommand();
  const [open, setOpen] = useState(false);

  const diagnose = async () => {
    setOpen(true);
    await run(routerId, 'hotspot.diagnose');
  };

  const data = result?.result as { servers?: ServerInfo[]; serverProfiles?: unknown[]; testUser?: unknown } | undefined;
  const servers = data?.servers ?? [];
  const anyInvalid = servers.some((s) => s.invalid === 'true');

  return (
    <>
      <Button variant="secondary" size="sm" onClick={diagnose} isLoading={isRunning}>
        <BeakerIcon className="h-4 w-4" /> Chunguza Hotspot
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Uchunguzi wa Hotspot" size="md" footer={<Button onClick={() => setOpen(false)}>Sawa</Button>}>
        {isRunning && <p className="text-sm text-slate-500">Inachunguza... subiri.</p>}
        {!isRunning && result?.status === 'done' && (
          <div className="space-y-4">
            {anyInvalid ? (
              <Alert tone="danger">
                Hotspot server ni INVALID. Hii ndiyo sababu login inashindwa — hakuna user atakayeweza kuingia
                hadi server irekebishwe (mara nyingi ni interface au profile mbaya kwenye MikroTik).
              </Alert>
            ) : servers.length === 0 ? (
              <Alert tone="warning">Hakuna hotspot server iliyowekwa kwenye router hii.</Alert>
            ) : (
              <Alert tone="success">Hotspot server(s) ni sahihi (si INVALID). Test user test123/test123 imeundwa — jaribu kuingia nayo.</Alert>
            )}

            {servers.map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800">
                <p className="font-medium">{s.name ?? '(bila jina)'}</p>
                <p className="text-slate-500">Interface: {s.interface ?? '?'} · Profile: {s.profile ?? '?'}</p>
                <p className="text-slate-500">Disabled: {s.disabled ?? '?'} · Invalid: {s.invalid ?? '?'}</p>
              </div>
            ))}

            <p className="text-xs text-slate-400">
              Jaribu kuingia hotspot na <span className="font-mono">test123 / test123</span>.
              Kama hii pia inashindikana, tatizo ni configuration ya Hotspot (si mfumo).
            </p>
          </div>
        )}
        {!isRunning && result?.status && result.status !== 'done' && (
          <Alert tone="danger">{result.error ?? 'Uchunguzi umeshindikana.'}</Alert>
        )}
      </Dialog>
    </>
  );
}
