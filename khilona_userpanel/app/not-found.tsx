import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-display text-[5.5rem] font-extrabold leading-none tracking-tight text-coral sm:text-[8rem]" aria-hidden="true">
          4<span className="text-sun">0</span>4
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">This page went out to play</h1>
        <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back to the fun stuff.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 xs:flex-row">
          <ButtonLink href="/">Go to home</ButtonLink>
          <ButtonLink href="/products" variant="outline">
            Shop all products
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-muted">
          Need help?{" "}
          <Link href="/contact" className="font-semibold text-ink underline underline-offset-4">
            Contact the store
          </Link>
        </p>
      </div>
    </Container>
  );
}
