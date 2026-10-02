"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, ButtonLink } from "./button";
import { EmptyState } from "./empty-state";

/** Recoverable error block used when the API is unreachable. */
export function ErrorState({
  title = "We couldn't load this right now",
  description = "The store is having trouble connecting. Please check your connection and try again.",
  onRetry,
  showHome = true,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showHome?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <EmptyState icon={<WifiOff />} title={title} description={description} className={className}>
      <Button
        onClick={() => (onRetry ? onRetry() : start(() => router.refresh()))}
        loading={pending}
        loadingText="Retrying…"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </Button>
      {showHome && (
        <ButtonLink href="/" variant="outline">
          Go to home
        </ButtonLink>
      )}
    </EmptyState>
  );
}
