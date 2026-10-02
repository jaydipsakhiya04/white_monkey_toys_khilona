'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'md';
  /** Accessible label when no visible label is associated */
  label?: string;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, size = 'md', label, className, disabled, ...props },
  ref,
) {
  const sm = size === 'sm';
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50',
        sm ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-brand' : 'bg-stone-300',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-150',
          sm ? 'size-4' : 'size-5',
          checked ? (sm ? 'translate-x-[18px]' : 'translate-x-[21px]') : 'translate-x-0.5',
        )}
      />
    </button>
  );
});

export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  id,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} label={label} />
    </div>
  );
}
