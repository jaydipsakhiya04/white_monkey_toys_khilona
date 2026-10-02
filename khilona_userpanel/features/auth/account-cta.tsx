"use client";

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { firstName, useAuth } from "./auth-provider";

/** Closing call-to-action; adapts to signed-in customers. */
export function AccountCta() {
  const { status, customer } = useAuth();
  const signedIn = status === "authenticated" && !!customer;

  return (
    <section aria-labelledby="cta-title" className="pt-16 sm:pt-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <span aria-hidden="true" className="absolute -right-16 -top-16 size-56 rounded-full bg-white/[0.04]" />
          <span aria-hidden="true" className="absolute -bottom-24 right-24 size-48 rounded-full bg-accent/15" />
          <div className="relative max-w-xl">
            <h2 id="cta-title" className="text-3xl font-bold leading-tight sm:text-[2.5rem]">
              {signedIn ? `Welcome back, ${firstName(customer?.name)}.` : "Your orders, all in one place."}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              {signedIn
                ? "Track deliveries, download invoices and review the toys you've received from your account."
                : "Create a free account to track every order, download invoices and receipts, and review the toys you love. Guest checkout always stays available."}
            </p>
          </div>
          <div className="relative mt-8 flex flex-col gap-3 xs:flex-row lg:mt-0 lg:shrink-0">
            {signedIn ? (
              <ButtonLink href="/account/orders" size="lg" variant="inverse">
                View my orders
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/signup" size="lg" variant="inverse">
                  Create an account
                </ButtonLink>
                <ButtonLink href="/products" size="lg" variant="outline-inverse">
                  Start shopping
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
