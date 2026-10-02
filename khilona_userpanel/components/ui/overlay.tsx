"use client";

import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/utils/cn";

type BaseProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

function Panel({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  kind,
}: BaseProps & { kind: "dialog" | "sheet-bottom" | "sheet-left" | "sheet-right" | "sheet-responsive" }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const mounted = useMounted();
  useFocusTrap(ref, open, onClose);

  if (!mounted || !open) return null;

  const position = {
    dialog: "inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md rounded-2xl",
    "sheet-bottom": "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-3xl",
    "sheet-left": "inset-y-0 left-0 h-dvh w-[min(22rem,88vw)] rounded-r-3xl",
    "sheet-right": "inset-y-0 right-0 h-dvh w-[min(24rem,92vw)] rounded-l-3xl",
    "sheet-responsive":
      "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-3xl md:inset-x-auto md:inset-y-0 md:right-0 md:bottom-auto md:h-dvh md:max-h-none md:w-[26rem] md:rounded-none md:rounded-l-3xl",
  }[kind];

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-ink/45" aria-hidden="true" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn("absolute flex flex-col overflow-hidden bg-surface shadow-lift focus:outline-none", position, className)}
      >
        {kind === "sheet-bottom" || kind === "sheet-responsive" ? (
          <div className={cn("flex justify-center pt-2.5", kind === "sheet-responsive" && "md:hidden")} aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-line-strong" />
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-sand hover:text-ink"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Dialog(props: BaseProps) {
  return <Panel {...props} kind="dialog" />;
}

export function Sheet({ side = "bottom", ...props }: BaseProps & { side?: "bottom" | "left" | "right" | "responsive" }) {
  return <Panel {...props} kind={`sheet-${side}` as const} />;
}
