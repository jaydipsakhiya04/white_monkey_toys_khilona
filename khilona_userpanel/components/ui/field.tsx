"use client";

import {
  forwardRef,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/utils/cn";
import { Combobox, optionsFromChildren } from "./combobox";

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

export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & CommonProps & { searchPlaceholder?: string }>(function SelectField(
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

type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
  searchPlaceholder?: string;
  placeholder?: string;
  /** Leading content inside the trigger, e.g. "Sort by" */
  prefix?: ReactNode;
};

/**
 * Drop-in replacement for <select>: same API (children <option>s, value/defaultValue, onChange,
 * react-hook-form `register`), rendered as a searchable dropdown. A hidden native <select> keeps
 * the value, name and ref so forms behave exactly as before.
 */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
  {
    className,
    invalid,
    children,
    value,
    defaultValue,
    onChange,
    onBlur,
    id,
    disabled,
    placeholder,
    searchPlaceholder,
    prefix,
    "aria-label": ariaLabel,
    "aria-describedby": describedBy,
    ...props
  },
  ref,
) {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => String(defaultValue ?? options[0]?.value ?? ""));

  // uncontrolled (react-hook-form register): pick up the value the form wrote into the <select>
  useLayoutEffect(() => {
    if (!controlled && selectRef.current) setInner(selectRef.current.value);
  }, [controlled]);

  const current = controlled ? String(value ?? "") : (selectRef.current?.value ?? inner);

  const setRefs = (el: HTMLSelectElement | null) => {
    selectRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  const change = (next: string) => {
    const el = selectRef.current;
    if (el) {
      // set through the native setter so React sees a real change event
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(el, next);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (!controlled) setInner(next);
  };

  return (
    <>
      <select
        ref={setRefs}
        value={controlled ? value : undefined}
        defaultValue={controlled ? undefined : defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        {...props}
      >
        {children}
      </select>
      <Combobox
        id={id}
        value={current}
        onValueChange={change}
        options={options.filter((o) => o.value !== "" || !placeholder)}
        placeholder={placeholder ?? options.find((o) => o.value === "")?.label}
        searchPlaceholder={searchPlaceholder}
        invalid={invalid}
        disabled={disabled}
        className={className}
        prefix={prefix}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        onBlur={() => {
          const el = selectRef.current;
          if (el) el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
        }}
      />
    </>
  );
});

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
