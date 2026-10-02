"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/utils/cn";

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function QuantityStepper({ value, min = 1, max, onChange, size = "md", label = "Quantity", disabled, className }: Props) {
  const safeMax = Math.max(min, max);
  const clamp = (n: number) => Math.max(min, Math.min(safeMax, n));
  const btn = size === "sm" ? "size-9" : "size-11";
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-xl border border-line-strong bg-surface", disabled && "opacity-60", className)}
    >
      <button
        type="button"
        className={cn(btn, "grid place-items-center rounded-l-xl text-ink hover:bg-sand disabled:text-muted/40 disabled:hover:bg-transparent")}
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className={cn(
          "w-10 bg-transparent text-center font-semibold tabular-nums text-ink focus:outline-none",
          size === "sm" ? "h-9 text-sm" : "h-11",
        )}
        value={value}
        min={min}
        max={safeMax}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
      />
      <button
        type="button"
        className={cn(btn, "grid place-items-center rounded-r-xl text-ink hover:bg-sand disabled:text-muted/40 disabled:hover:bg-transparent")}
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= safeMax}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
