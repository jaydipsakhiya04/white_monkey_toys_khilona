import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type BadgeTone = "neutral" | "outline" | "accent" | "success" | "danger" | "ink";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sand text-ink",
  outline: "border border-line-strong bg-surface text-ink",
  accent: "bg-accent text-ink",
  success: "bg-success-tint text-success-700",
  danger: "bg-danger-tint text-danger-700",
  ink: "bg-ink text-white",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
