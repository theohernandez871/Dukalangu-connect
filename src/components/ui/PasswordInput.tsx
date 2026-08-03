import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        rightSlot={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ficha nywila' : 'Onyesha nywila'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 focus-ring"
          >
            {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
