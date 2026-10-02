"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { cn } from "@/utils/cn";

export function SearchForm({
  className,
  autoFocus,
  onSubmitted,
  inputClassName,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
  inputClassName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname === "/products" ? (params.get("search") ?? "") : "";
  const [value, setValue] = useState(current);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // keep in sync when navigating between searches
  useEffect(() => {
    setValue(current);
  }, [current]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
    inputRef.current?.blur();
    onSubmitted?.();
  }

  return (
    <form role="search" onSubmit={submit} className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        ref={inputRef}
        id={id}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? "" : undefined}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search toys, games, brands…"
        maxLength={100}
        className={cn(
          "h-11 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-10 text-[0.9375rem] text-ink placeholder:text-muted/80 hover:border-ink/30 focus:border-coral-600 focus:outline-none focus:ring-2 focus:ring-coral-600/25 [&::-webkit-search-cancel-button]:hidden",
          inputClassName,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink"
          aria-label="Clear search"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
