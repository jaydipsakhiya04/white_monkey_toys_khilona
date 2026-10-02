"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

const control =
  "block w-full rounded-xl border bg-surface px-3.5 text-[0.9375rem] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-ink/30 disabled:bg-sand disabled:text-muted";

function stateClasses(invalid?: boolean) {
  return invalid ? "border-danger focus:border-danger" : "border-line-strong hover:border-ink/30 focus:border-ink";
}

type FieldWrapProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

export function FieldWrap({ id, label, hint, error, optional, className, children }: FieldWrapProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type CommonProps = { label: ReactNode; hint?: ReactNode; error?: string; optional?: boolean; wrapperClassName?: string };

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & CommonProps>(function TextField(
  { label, hint, error, optional, wrapperClassName, className, id, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap id={fid} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <input
        ref={ref}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={cn(control, "h-12", stateClasses(!!error), className)}
        {...props}
      />
    </FieldWrap>
  );
});

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & CommonProps>(
  function TextAreaField({ label, hint, error, optional, wrapperClassName, className, id, rows = 3, ...props }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldWrap id={fid} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
        <textarea
          ref={ref}
          id={fid}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={cn(control, "min-h-24 py-3 leading-relaxed", stateClasses(!!error), className)}
          {...props}
        />
      </FieldWrap>
    );
  },
);

export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & CommonProps>(function SelectField(
  { label, hint, error, optional, wrapperClassName, className, id, children, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap id={fid} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <NativeSelect ref={ref} id={fid} invalid={!!error} className={className} {...props}>
        {children}
      </NativeSelect>
    </FieldWrap>
  );
});

export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function NativeSelect({ className, invalid, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(control, "h-11 appearance-none pr-10 font-medium", stateClasses(invalid), className)}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" />
        </svg>
      </div>
    );
  },
);

export function Checkbox({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 rounded-md border-line-strong accent-ink"
        {...props}
      />
      <label htmlFor={id} className="min-w-0 text-sm leading-6 text-ink">
        {label}
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
    </div>
  );
}
