import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { useRouters } from '@/features/routers/hooks/useRouters';
import { voucherService } from '../services/voucher.service';

interface Props {
  batchId: string | null;
  onClose: () => void;
}

/** Pushes an already-generated batch to a router as hotspot users. Useful when
 *  the batch was created without a router, or a previous push failed. */
export function PushBatchDialog({ batchId, onClose }: Props) {
  const { data: routers } = useRouters();
  const [routerId, setRouterId] = useState('');
  const [profile, setProfile] = useState('default');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const routerOptions = (routers ?? []).map((r) => ({ value: r.id, label: r.name }));

  const push = async () => {
    if (!batchId || !routerId) {
      setError('Chagua router.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const agents = await voucherService.countAgents(routerId);
      if (agents === 0) {
        setError('Hakuna agent inayoendesha kwa router hii. Endesha agent kwanza.');
        return;
      }
      const count = await voucherService.pushBatchToRouter(batchId, routerId, profile.trim() || 'default');
      setDone(count);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Imeshindikana kupeleka.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={!!batchId}
      onClose={onClose}
      title="Peleka batch kwenye MikroTik"
      footer={
        done != null ? (
          <Button onClick={onClose}>Sawa</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Ghairi</Button>
            <Button isLoading={busy} onClick={push} disabled={!routerId}>Peleka</Button>
          </>
        )
      }
    >
      {done != null ? (
        <Alert tone="success">
          Commands {done} zimetumwa kwa agent. Vocha zitaonekana Router → Hotspot → Watumiaji baada ya sekunde chache (Sync sasa).
        </Alert>
      ) : (
        <div className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Select label="Router" placeholder="Chagua router" options={routerOptions} value={routerId} onChange={(e) => setRouterId(e.target.value)} />
          <Input label="Profile ya RouterOS" value={profile} onChange={(e) => setProfile(e.target.value)} placeholder="default" />
          <p className="text-xs text-slate-400">
            Kila code kwenye batch itaundwa kama hotspot user. Profile lazima iwepo kwenye router.
          </p>
        </div>
      )}
    </Dialog>
  );
}
