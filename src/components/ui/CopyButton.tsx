import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/20/solid';
import { cn } from '@/utils/cn';

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Nakili"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus-ring dark:hover:bg-slate-800',
        className,
      )}
    >
      {copied ? <CheckIcon className="h-4 w-4 text-success-600" /> : <ClipboardIcon className="h-4 w-4" />}
    </button>
  );
}
