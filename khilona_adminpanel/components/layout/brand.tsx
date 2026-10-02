import { cn } from '@/utils/cn';

export function BrandMark({ className, showAdmin = true }: { className?: string; showAdmin?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="size-3 rounded-[3px] bg-brand" aria-hidden />
      <span className="text-[15px] font-bold tracking-[0.14em] text-ink">KHILONA</span>
      {showAdmin && (
        <span className="rounded border border-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-muted">
          Admin
        </span>
      )}
    </span>
  );
}

export function FullScreenLoader({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-page">
      <BrandMark />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full w-1/3 animate-[loader_1.1s_ease-in-out_infinite] rounded-full bg-brand" />
      </div>
      <p className="text-xs text-muted">{label}</p>
      <style>{`@keyframes loader{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}
