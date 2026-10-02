'use client';

import { useEffect, useRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { indeterminate?: boolean };

export function Checkbox({ indeterminate, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'size-4 shrink-0 cursor-pointer rounded border-line-strong accent-[#E4572E]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        className,
      )}
      {...props}
    />
  );
}
