import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-xl bg-[linear-gradient(90deg,var(--color-sand)_0%,var(--color-sand-deep)_50%,var(--color-sand)_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
