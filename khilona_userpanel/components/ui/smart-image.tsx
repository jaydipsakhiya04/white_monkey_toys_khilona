"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { canOptimize, resolveImageUrl } from "@/lib/images";
import { cn } from "@/utils/cn";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src: string | null | undefined;
  alt: string;
  /** classes for the fallback placeholder */
  fallbackClassName?: string;
};

/** next/image wrapper: resolves API URLs, handles unknown hosts and broken images. */
export function SmartImage({ src, alt, className, fallbackClassName, unoptimized, ...props }: Props) {
  const resolved = resolveImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!resolved || failedSrc === resolved) {
    return <ImagePlaceholder label={alt} className={cn(props.fill && "absolute inset-0", fallbackClassName)} />;
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      className={className}
      unoptimized={unoptimized ?? !canOptimize(resolved)}
      onError={() => setFailedSrc(resolved)}
      {...props}
    />
  );
}

export function ImagePlaceholder({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label ? `${label} (image unavailable)` : undefined}
      aria-hidden={label ? undefined : true}
      className={cn("flex size-full items-center justify-center bg-sand text-line-strong", className)}
    >
      <svg viewBox="0 0 64 64" className="size-1/3 max-h-20 max-w-20" fill="none" aria-hidden="true">
        <rect x="10" y="22" width="44" height="30" rx="8" stroke="currentColor" strokeWidth="4" />
        <circle cx="24" cy="37" r="4" fill="currentColor" />
        <circle cx="40" cy="37" r="4" fill="currentColor" />
        <path d="M22 22c0-6 4.5-10 10-10s10 4 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
