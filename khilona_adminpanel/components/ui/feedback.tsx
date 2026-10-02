import { AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './button';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-stone-200/70', className)} {...props} />;
}

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center">
      <Loader2 className={cn('size-5 animate-spin text-muted', className)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-line bg-subtle text-muted">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-red-200 bg-danger-tint text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-[13px] text-muted">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-line bg-surface', className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function Thumb({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('shrink-0 overflow-hidden rounded-lg border border-line bg-subtle', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} width={size} height={size} loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-[10px] font-medium uppercase text-stone-400" aria-hidden>
          {alt.slice(0, 2)}
        </div>
      )}
    </div>
  );
}
