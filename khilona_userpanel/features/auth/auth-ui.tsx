"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { z } from "zod";
import { TextField } from "@/components/ui/field";
import { Wordmark } from "@/components/layout/logo";
import { cn } from "@/utils/cn";

/** Mirrors the API rule (8–72 chars, at least one letter and one number). */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNext(raw: string | null | undefined, fallback = "/account") {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[64rem] gap-6 px-4 py-10 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:items-stretch">
      <div className="mx-auto flex w-full max-w-[28rem] flex-col lg:max-w-none">
        <div className="flex-1 animate-rise rounded-[2rem] border border-line bg-surface p-6 shadow-soft sm:p-10">
          <Wordmark compact markClassName="size-7" />
          <h1 className="mt-7 text-[1.875rem] font-bold leading-tight tracking-tight text-ink sm:text-[2.125rem]">{title}</h1>
          {subtitle && <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
      <aside
        aria-hidden="true"
        className="relative isolate hidden animate-rise overflow-hidden rounded-[2rem] bg-midnight p-10 text-white [animation-delay:120ms] lg:flex lg:flex-col lg:justify-between"
      >
        <div className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-accent/30 blur-[100px]" />
        <div className="absolute -bottom-28 -left-16 -z-10 size-80 rounded-full bg-[#6d5dfc]/25 blur-[100px]" />
        <div className="bg-grain absolute inset-0 -z-10 opacity-60" />
        <p className="eyebrow !text-accent">Your toy-shop account</p>
        <div>
          <p className="font-display text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.035em]">
            Every order, <span className="text-gradient-accent">tracked</span> from shop to doorstep.
          </p>
          <ul className="mt-8 space-y-3.5 text-[0.9375rem] text-white/75">
            {["Live status for every order", "Invoices & receipts as PDF", "Review the toys you received", "Guest checkout always available"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-accent text-[0.75rem] font-bold text-midnight">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/50">Pay on delivery · No card details needed</p>
      </aside>
    </div>
  );
}

export const PasswordField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode; trailingLink?: ReactNode }
>(function PasswordField({ label, error, hint, trailingLink, className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {trailingLink && <div className="absolute right-0 top-0 z-10 text-sm">{trailingLink}</div>}
      <TextField
        ref={ref}
        label={label}
        type={visible ? "text" : "password"}
        error={error}
        hint={hint}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-[1.875rem] grid size-10 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink"
      >
        {visible ? <EyeOff className="size-[1.125rem]" aria-hidden="true" /> : <Eye className="size-[1.125rem]" aria-hidden="true" />}
      </button>
    </div>
  );
});

/** Lightweight strength hint (the API enforces the actual rule). */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) || (/[a-z]/.test(value) && /[A-Z]/.test(value))) score++;
  const label = ["Too weak", "Weak", "Fair", "Good", "Strong"][score];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < score ? (score >= 3 ? "bg-success-700" : "bg-ink") : "bg-line")} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">
        Password strength: <span className="font-semibold text-ink">{label}</span>
      </p>
    </div>
  );
}

export function FormAlert({ children, tone = "danger" }: { children: ReactNode; tone?: "danger" | "success" | "neutral" }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm font-medium",
        tone === "danger" && "bg-danger-tint text-danger-700",
        tone === "success" && "bg-success-tint text-success-700",
        tone === "neutral" && "bg-sand text-ink",
      )}
    >
      {children}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-ink underline underline-offset-4 hover:no-underline">
      {children}
    </Link>
  );
}
