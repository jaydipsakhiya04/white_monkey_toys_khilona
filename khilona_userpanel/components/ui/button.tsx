import Link from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { cn } from "@/utils/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "dark" | "whatsapp" | "danger";
export type ButtonSize = "sm" | "card" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-coral-600 text-white hover:bg-coral-700",
  dark: "bg-ink text-white hover:bg-ink/90",
  secondary: "bg-coral-tint text-coral-700 hover:bg-[#fbe1d6]",
  outline: "border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-sand/60",
  ghost: "text-ink hover:bg-sand",
  whatsapp: "bg-success-700 text-white hover:bg-[#106437]",
  danger: "bg-danger-700 text-white hover:bg-[#9a1f1f]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  /** compact product-card CTA, tighter on very small screens */
  card: "h-9 px-2 text-[0.8125rem] sm:px-3.5 sm:text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-base",
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
