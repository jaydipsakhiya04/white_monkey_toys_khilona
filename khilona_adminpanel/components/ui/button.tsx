import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 select-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
  'disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-hover shadow-xs',
  secondary: 'bg-surface text-ink border border-line hover:bg-subtle hover:border-line-strong shadow-xs',
  ghost: 'text-ink-soft hover:bg-subtle hover:text-ink',
  subtle: 'bg-subtle text-ink hover:bg-stone-200',
  danger: 'bg-danger text-white hover:bg-danger-hover shadow-xs',
  link: 'text-brand hover:text-brand-hover underline-offset-4 hover:underline px-0',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-xs [&_svg]:size-3.5',
  sm: 'h-8 px-3 text-[13px] [&_svg]:size-4',
  md: 'h-9 px-3.5 text-sm [&_svg]:size-4',
  lg: 'h-11 px-5 text-[15px] [&_svg]:size-[18px]',
  icon: 'size-9 [&_svg]:size-[18px]',
  'icon-sm': 'size-8 [&_svg]:size-4',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], variant === 'link' ? '' : sizes[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
