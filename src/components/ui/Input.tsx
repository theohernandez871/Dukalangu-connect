import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightSlot, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            className={cn(
              'h-11 w-full rounded-xl border bg-white/80 px-3.5 text-sm text-slate-900 shadow-sm transition focus-ring placeholder:text-slate-400',
              'dark:bg-slate-900/60 dark:text-slate-100',
              leftIcon && 'pl-10',
              rightSlot && 'pr-11',
              error
                ? 'border-danger-500 focus-visible:ring-danger-500/50'
                : 'border-slate-200 dark:border-slate-700',
              className,
            )}
            {...props}
          />
          {rightSlot && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">{rightSlot}</span>
          )}
        </div>
        {error && <p className="text-xs font-medium text-danger-600">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
