import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePayoutActions } from '../hooks/usePayouts';

interface Props {
  open: boolean;
  onClose: () => void;
  remaining: number;
}

/** Records a payout the owner has ALREADY made from Snippe. This does not move
 *  money — it only logs it for tracking. */
export function AddPayoutDialog({ open, onClose, remaining }: Props) {
  const { create } = usePayoutActions();
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const amt = Number(amount);
    if (!Number.isInteger(amt) || amt <= 0) {
      setError('Weka kiasi sahihi (namba kamili).');
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({ amount: amt, destination: destination.trim() || undefined, note: note.trim() || undefined });
      setAmount(''); setDestination(''); setNote('');
      onClose();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Rekodi utoaji wa fedha"
      description="Rekodi pesa ulizotoa Snippe. Hii ni kwa kumbukumbu tu — haitoi pesa halisi."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Inahifadhi...' : 'Hifadhi'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Input
            label="Kiasi (TSH)"
            type="number"
            placeholder="100000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            Zilizobaki Snippe (kadirio): TSH {remaining.toLocaleString()}
          </p>
        </div>
        <Input
          label="Kwenda wapi (hiari)"
          placeholder="M-Pesa 0712..., Benki..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <Input
          label="Maelezo (hiari)"
          placeholder="Mfano: mtaji, mishahara"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Dialog>
  );
}
