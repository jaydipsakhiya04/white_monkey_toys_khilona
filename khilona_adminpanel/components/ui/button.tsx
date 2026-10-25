import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium select-none ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
  'disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-[#F7692F] to-brand text-white shadow-brand ring-1 ring-inset ring-white/15 ' +
    'hover:from-brand hover:to-brand-hover',
  secondary:
    'bg-surface text-ink border border-line shadow-xs hover:bg-stone-50 hover:border-line-strong',
  ghost: 'text-ink-soft hover:bg-stone-100 hover:text-ink',
  subtle: 'bg-stone-100 text-ink hover:bg-stone-200',
  danger: 'bg-danger text-white shadow-xs ring-1 ring-inset ring-white/10 hover:bg-danger-hover',
  link: 'text-brand hover:text-brand-hover underline-offset-4 hover:underline px-0 active:scale-100',
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
