import type { PublicStore } from "@/types/api";
import { cn } from "@/utils/cn";

export function OpenNowBadge({ store, className }: { store: PublicStore; className?: string }) {
  const open = store.isOpenNow;
  const label = open ? "Open now" : store.isOpen ? "Closed now" : "Temporarily closed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        open ? "bg-success-tint text-success-700" : "bg-danger-tint text-danger-700",
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", open ? "bg-success" : "bg-danger")} aria-hidden="true" />
      {label}
    </span>
  );
}
