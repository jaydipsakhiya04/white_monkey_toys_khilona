'use client';

import {
  forwardRef,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/utils/cn';
import { Combobox, optionsFromChildren } from './combobox';

export const controlBase =
  'w-full rounded-[10px] border border-line bg-surface text-sm text-ink placeholder:text-stone-400 shadow-xs ' +
  'transition-[border-color,box-shadow] duration-150 hover:border-line-strong ' +
  'focus:outline-none focus:border-brand/70 focus:ring-4 focus:ring-brand/12 ' +
  'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  inputClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leading, trailing, className, inputClassName, ...props },
  ref,
) {
  if (!leading && !trailing) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, 'h-9 px-3', className, inputClassName)}
        {...props}
      />
    );
  }
  return (
    <div className={cn('relative flex items-center', className)}>
      {leading && (
        <span className="pointer-events-none absolute left-3 flex items-center text-muted [&_svg]:size-4">{leading}</span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(controlBase, 'h-9', leading ? 'pl-9' : 'pl-3', trailing ? 'pr-10' : 'pr-3', inputClassName)}
        {...props}
      />
      {trailing && <span className="absolute right-1.5 flex items-center">{trailing}</span>}
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, 'min-h-[80px] px-3 py-2 leading-relaxed', className)}
      {...props}
    />
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
  wrapperClassName?: string;
  searchPlaceholder?: string;
  placeholder?: string;
};

/**
 * Drop-in replacement for <select> (same API: <option>/<optgroup> children, value/defaultValue,
 * onChange, react-hook-form `register`) rendered as a searchable dropdown. A hidden native
 * <select> keeps the value, name and ref so forms behave exactly as before.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    invalid,
    className,
    wrapperClassName,
    children,
    value,
    defaultValue,
    onChange,
    onBlur,
    id,
    disabled,
    placeholder,
    searchPlaceholder,
    'aria-label': ariaLabel,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => String(defaultValue ?? options[0]?.value ?? ''));
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  // uncontrolled (react-hook-form register / reset): pick up the value the form wrote
  useLayoutEffect(() => {
    if (!controlled && selectRef.current) setInner(selectRef.current.value);
  }, [controlled]);

  const current = controlled ? String(value ?? '') : (selectRef.current?.value ?? inner);

  const setRefs = (el: HTMLSelectElement | null) => {
    selectRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  const change = (next: string) => {
    const el = selectRef.current;
    if (el) {
      // set through the native setter so React sees a real change event
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(el, next);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (!controlled) setInner(next);
    rerender();
  };

  const emptyLabel = options.find((o) => o.value === '')?.label;

  return (
    <div className={cn('relative min-w-0', wrapperClassName)}>
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
        options={options}
        placeholder={placeholder ?? emptyLabel ?? 'Select…'}
        searchPlaceholder={searchPlaceholder}
        invalid={invalid}
        disabled={disabled}
        className={className}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        onBlur={() => selectRef.current?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))}
      />
    </div>
  );
});
