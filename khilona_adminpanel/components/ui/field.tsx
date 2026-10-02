import { AlertCircle } from 'lucide-react';
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type FieldProps = {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  /** Right side of the label row (e.g. char counter) */
  aside?: ReactNode;
  children: ReactNode;
};

/**
 * Label + control + hint/error. If `children` is a single element and no `htmlFor`
 * is given, an id is generated and wired up with aria-describedby.
 */
export function Field({ label, htmlFor, required, hint, error, className, aside, children }: FieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  let control = children;
  if (!htmlFor && isValidElement(children)) {
    const el = children as ReactElement<Record<string, unknown>>;
    const extra: Record<string, unknown> = {
      id: (el.props.id as string | undefined) ?? id,
      'aria-describedby': describedBy,
    };
    if (typeof el.type === 'string') {
      if (error) extra['aria-invalid'] = true;
    } else {
      extra.invalid = el.props.invalid ?? (error ? true : undefined);
    }
    control = cloneElement(el, extra);
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={id} className="text-[13px] font-medium text-ink">
              {label}
              {required && (
                <span className="ml-0.5 text-brand" aria-hidden>
                  *
                </span>
              )}
              {required && <span className="sr-only"> (required)</span>}
            </label>
          )}
          {aside && <div className="text-xs text-muted tabular">{aside}</div>}
        </div>
      )}
      {control}
      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-1 text-xs text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CharCount({ value, max }: { value: string | null | undefined; max: number }) {
  const len = value?.length ?? 0;
  return <span className={cn(len > max ? 'text-danger' : 'text-muted')}>{`${len}/${max}`}</span>;
}
