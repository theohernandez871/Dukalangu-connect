import { useState } from 'react';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Alert } from '@/components/feedback/Alert';
import { useRouterCommand } from '../hooks/useAgents';

interface Diagnosis {
  routerOsVersion?: string | null;
  servers?: { name?: string; interface?: string; invalid?: string; disabled?: string }[];
  usersCount?: number;
  activeCount?: number;
  ipPools?: unknown[];
  loginMethods?: string[];
  interfaces?: string[];
  problems?: string[];
  testUser?: { name?: string; profile?: string } | null;
}

export function HotspotDiagnoseButton({ routerId }: { routerId: string }) {
  const { run, result, isRunning } = useRouterCommand();
  const [open, setOpen] = useState(false);

  const diagnose = async () => {
    setOpen(true);
    await run(routerId, 'hotspot.diagnose');
  };

  const d = result?.result as Diagnosis | undefined;
  const problems = d?.problems ?? [];

  return (
    <>
      <Button variant="secondary" size="sm" onClick={diagnose} isLoading={isRunning}>
        <BeakerIcon className="h-4 w-4" /> Chunguza Hotspot
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Uchunguzi wa Hotspot" size="md" footer={<Button onClick={() => setOpen(false)}>Sawa</Button>}>
        {isRunning && <p className="text-sm text-slate-500">Inachunguza configuration ya router... subiri.</p>}
        {!isRunning && result?.status === 'done' && d && (
          <div className="space-y-4">
            {problems.length > 0 ? (
              <Alert tone="danger">
                Matatizo {problems.length} yamegunduliwa (angalia chini). Haya ndiyo yanayozuia login.
              </Alert>
            ) : (
              <Alert tone="success">
                Hakuna tatizo kubwa lililogunduliwa. Test user test123/test123 imeundwa — jaribu kuingia nayo.
              </Alert>
            )}

            {problems.length > 0 && (
              <div className="space-y-2">
                {problems.map((p, i) => (
                  <div key={i} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300">
                    {p}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="RouterOS" value={d.routerOsVersion ?? '?'} />
              <Info label="Servers" value={String(d.servers?.length ?? 0)} />
              <Info label="Watumiaji" value={String(d.usersCount ?? 0)} />
              <Info label="Hai sasa" value={String(d.activeCount ?? 0)} />
              <Info label="IP Pools" value={String(d.ipPools?.length ?? 0)} />
              <Info label="Login methods" value={(d.loginMethods ?? []).join(', ') || '?'} />
            </div>

            {(d.servers ?? []).map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800">
                <p className="font-medium">{s.name ?? '(bila jina)'} {s.invalid === 'true' && <span className="text-red-600">· INVALID</span>}</p>
                <p className="text-slate-500">Interface: {s.interface ?? '?'} · Disabled: {s.disabled ?? '?'}</p>
              </div>
            ))}

            <p className="text-xs text-slate-400">
              Jaribu kuingia hotspot na <span className="font-mono">test123 / test123</span>.
              Ikishindikana pia, tatizo ni configuration ya MikroTik (angalia matatizo hapo juu).
            </p>
          </div>
        )}
        {!isRunning && result?.status && result.status !== 'done' && (
          <Alert tone="danger">{result.error ?? 'Uchunguzi umeshindikana. Hakikisha agent mpya inaendesha.'}</Alert>
        )}
      </Dialog>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
