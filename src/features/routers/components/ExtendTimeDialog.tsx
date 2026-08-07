import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useRouterCommand } from '../hooks/useRouterCommand';
import type { HotspotActive } from '../types/routeros';

interface Props {
  routerId: string;
  active: HotspotActive | null;
  onClose: () => void;
}

const DURATIONS = [
  { value: '1h', label: 'Saa 1' },
  { value: '3h', label: 'Saa 3' },
  { value: '6h', label: 'Saa 6' },
  { value: '12h', label: 'Saa 12' },
  { value: '1d', label: 'Siku 1' },
  { value: '7d', label: 'Siku 7' },
  { value: '30d', label: 'Siku 30' },
];

/** Extend an active user's allowed time by setting a new limit-uptime. Sends
 *  the username so the agent resolves the underlying hotspot user record. */
export function ExtendTimeDialog({ routerId, active, onClose }: Props) {
  const { send, sending } = useRouterCommand();
  const [duration, setDuration] = useState('1h');

  const submit = async () => {
    if (!active?.user) return;
    await send(routerId, 'hotspot.extend_user', { user: active.user, limitUptime: duration });
    onClose();
  };

  return (
    <Dialog
      open={!!active}
      onClose={onClose}
      title="Ongeza muda"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ghairi</Button>
          <Button isLoading={sending === 'hotspot.extend_user'} onClick={submit}>Ongeza</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Ongeza muda wa <span className="font-semibold">{active?.user}</span> kwa kuweka kikomo kipya cha muda (limit-uptime).
        </p>
        <Select
          label="Muda wa kuongeza"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          options={DURATIONS}
        />
        <p className="text-xs text-slate-400">
          Kikomo kipya kitawekwa kwenye akaunti ya mtumiaji kwenye MikroTik.
        </p>
      </div>
    </Dialog>
  );
}
