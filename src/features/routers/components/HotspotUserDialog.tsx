import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouterCommand } from '../hooks/useRouterCommand';
import type { HotspotUser } from '../types/routeros';

interface Props {
  routerId: string;
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this user; otherwise it creates a new one. */
  user?: HotspotUser | null;
}

export function HotspotUserDialog({ routerId, open, onClose, user }: Props) {
  const { send, sending } = useRouterCommand();
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? '');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState(user?.profile ?? '');

  const submit = async () => {
    // Create or re-create the hotspot user with the given profile/password.
    // (RouterOS keys users by name; editing name isn't supported, so name is
    // read-only in edit mode.)
    await send(routerId, 'hotspot.create_user', {
      name: name.trim(),
      password: password.trim() || name.trim(),
      profile: profile.trim() || 'default',
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Hariri mtumiaji' : 'Ongeza mtumiaji'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ghairi</Button>
          <Button isLoading={sending === 'hotspot.create_user'} onClick={submit} disabled={!name.trim()}>
            {isEdit ? 'Hifadhi' : 'Ongeza'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Jina la mtumiaji" value={name} onChange={(e) => setName(e.target.value)} disabled={isEdit} />
        <Input label={isEdit ? 'Nywila mpya (hiari)' : 'Nywila'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ikiachwa tupu, jina litatumika" />
        <Input label="Profile (package)" value={profile} onChange={(e) => setProfile(e.target.value)} placeholder="default" />
        <p className="text-xs text-slate-400">
          Mabadiliko yatatumwa kwa agent na kuonekana kwenye MikroTik papo hapo baada ya sync.
        </p>
      </div>
    </Dialog>
  );
}
