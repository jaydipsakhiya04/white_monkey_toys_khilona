import Link from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { cn } from "@/utils/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "dark" | "whatsapp" | "danger" | "inverse" | "outline-inverse";
export type ButtonSize = "sm" | "card" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.005em] whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white shadow-[0_1px_0_rgb(255_255_255/0.08)_inset] hover:bg-ink-soft hover:shadow-lift",
  /** signature tangerine CTA — dark text keeps it AA on the bright fill */
  accent: "bg-accent text-midnight shadow-glow hover:bg-[#ff6d36] hover:-translate-y-px",
  dark: "bg-ink text-white hover:bg-ink-soft",
  secondary: "bg-sand text-ink hover:bg-sand-deep",
  outline: "border border-line-strong bg-surface text-ink hover:border-ink hover:shadow-soft",
  ghost: "text-ink hover:bg-sand",
  whatsapp: "bg-success-700 text-white hover:bg-[#12522a]",
  danger: "bg-danger-700 text-white hover:bg-[#991b1b]",
  /** on dark backgrounds */
  inverse: "bg-white text-ink hover:bg-white/90",
  "outline-inverse": "border border-white/25 bg-white/5 text-white backdrop-blur hover:border-white/60 hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  /** compact product-card CTA, tighter on very small screens */
  card: "h-9 px-2 text-[0.8125rem] sm:px-3.5 sm:text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-[3.25rem] px-7 text-base",
  icon: "h-11 w-11",
  "icon-sm": "h-9 w-9",
};

export function buttonClasses(opts: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  const { variant = "primary", size = "md", block, className } = opts;
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  loadingText?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, loading, loadingText, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="size-4" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

export function ButtonLink({ variant, size, block, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, block, className })} {...props} />;
}

type ButtonAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

/** For external links (tel:, wa.me, maps). */
export function ButtonAnchor({ variant, size, block, className, ...props }: ButtonAnchorProps) {
  return <a className={buttonClasses({ variant, size, block, className })} {...props} />;
}
