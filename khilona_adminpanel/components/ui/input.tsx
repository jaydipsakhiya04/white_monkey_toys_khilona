import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export const controlBase =
  'w-full rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-stone-400 shadow-xs ' +
  'transition-colors duration-150 hover:border-line-strong ' +
  'focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand/15 ' +
  'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  inputClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leading, trailing, className, inputClassName, ...props },
  ref,
) {
  if (!leading && !trailing) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, 'h-9 px-3', className, inputClassName)}
        {...props}
      />
    );
  }
  return (
    <div className={cn('relative flex items-center', className)}>
      {leading && (
        <span className="pointer-events-none absolute left-3 flex items-center text-muted [&_svg]:size-4">{leading}</span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, 'h-9', leading ? 'pl-9' : 'pl-3', trailing ? 'pr-10' : 'pr-3', inputClassName)}
        {...props}
      />
      {trailing && <span className="absolute right-1.5 flex items-center">{trailing}</span>}
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, 'min-h-[80px] px-3 py-2 leading-relaxed', className)}
      {...props}
    />
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; wrapperClassName?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, wrapperClassName, children, ...props },
  ref,
) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, 'h-9 appearance-none pl-3 pr-9 truncate', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
});
