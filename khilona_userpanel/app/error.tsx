"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center" role="alert">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral-tint font-display text-3xl font-extrabold text-coral-700" aria-hidden="true">
          !
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink sm:text-4xl">Oops, something went wrong</h1>
        <p className="mt-3 text-muted">
          We couldn&apos;t load this page. This is usually temporary — please try again in a moment.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 xs:flex-row">
          <Button onClick={reset}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <ButtonLink href="/" variant="outline">
            Go to home
          </ButtonLink>
        </div>
        {error.digest && <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>}
      </div>
    </Container>
  );
}
