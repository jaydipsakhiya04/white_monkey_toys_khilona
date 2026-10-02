import { Banknote, BadgeCheck, PackageSearch, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { PublicStore } from "@/types/api";

/** "Why White Monkey Toys" — only claims the platform actually backs up. */
export function WhySection({ storeName }: { storeName: string }) {
  const points = [
    {
      icon: Sparkles,
      title: "Thoughtfully chosen",
      body: "A curated range of toys, games and learning kits — picked for play value, not shelf filler.",
    },
    {
      icon: Banknote,
      title: "Pay on delivery",
      body: "No online payment needed. Place your order, we confirm it, and you pay when it arrives.",
    },
    {
      icon: PackageSearch,
      title: "Track every order",
      body: "Follow each step from confirmation to your doorstep — with or without an account.",
    },
    {
      icon: BadgeCheck,
      title: "Honest, verified reviews",
      body: "Only customers who received a product can review it, so every rating is a real purchase.",
    },
  ];
  return (
    <section aria-labelledby="why-title" className="py-16 sm:py-24">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow">Why {storeName}</p>
          <h2 id="why-title" className="mt-3 text-3xl font-bold text-ink sm:text-[2.5rem] sm:leading-[1.1]">
            Simple to shop. Made for families.
          </h2>
        </div>
        <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <li key={p.title} className="border-t border-ink pt-6">
              <p.icon className="size-6 text-ink" aria-hidden="true" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** How ordering works (pay on delivery). */
export function HowOrderingWorks({ store }: { store: PublicStore | null }) {
  const steps = [
    { title: "Choose your toys", body: "Browse by category or search, then add favourites to your cart." },
    { title: "Place your order", body: "Share your delivery address — sign in for faster checkout, or continue as a guest." },
    { title: "We confirm & deliver", body: "Our team confirms your order and delivers it. You pay in cash or UPI on delivery." },
  ];
  return (
    <section aria-labelledby="how-title" className="bg-sand py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <p className="eyebrow">Ordering</p>
          <h2 id="how-title" className="mt-3 text-3xl font-bold text-ink sm:text-[2.5rem] sm:leading-[1.1]">
            How it works
          </h2>
          <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-muted">
            {store?.isOpen === false && store.closedMessage
              ? store.closedMessage
              : "No card details, no online payment. Your order is confirmed by a real person before it ships."}
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-3xl bg-surface p-6">
              <span className="grid size-9 place-items-center rounded-full bg-ink text-sm font-semibold text-white" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
