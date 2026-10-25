import Link from "next/link";
import { ArrowRight, Banknote, BadgeCheck, Gift, PackageSearch, Sparkles, Star, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import type { CategorySummary, PublicStore } from "@/types/api";
import { pluralize } from "@/utils/format";

/** Scrolling strip of store promises right under the hero. */
export function PromiseMarquee() {
  const items = [
    { Icon: Banknote, label: "Pay on delivery" },
    { Icon: Truck, label: "Fast local delivery" },
    { Icon: BadgeCheck, label: "Genuine, quality-checked toys" },
    { Icon: PackageSearch, label: "Live order tracking" },
    { Icon: Star, label: "Verified customer reviews" },
    { Icon: Gift, label: "Gift-ready packing" },
  ];
  const row = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map(({ Icon, label }) => (
        <li key={label} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-midnight">
          <Icon className="size-[1.125rem]" aria-hidden="true" />
          {label}
          <span className="ml-8 size-1.5 rounded-full bg-midnight/40" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="mask-fade-x overflow-hidden bg-accent py-3.5" aria-label="Store promises">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {row()}
        {row(true)}
      </div>
    </div>
  );
}

function flatten(categories: CategorySummary[]): CategorySummary[] {
  return categories.flatMap((c) => [c, ...flatten(c.children ?? [])]);
}

/**
 * Two large editorial banners that deep-link into real categories. Categories are picked by
 * keyword (RC / remote, then games), falling back to the biggest categories, so the banners keep
 * working when the catalogue changes.
 */
export function PromoBanners({ categories }: { categories: CategorySummary[] }) {
  const all = flatten(categories).filter((c) => c.productCount > 0);
  if (all.length < 2) return null;
  const pick = (re: RegExp, exclude?: string) => all.find((c) => re.test(`${c.name} ${c.slug}`) && c.id !== exclude);
  const bySize = [...all].sort((a, b) => b.productCount - a.productCount);
  const first = pick(/\b(rc|remote|drone|car)/i) ?? bySize[0];
  const second = pick(/\b(board|card|game)/i, first.id) ?? bySize.find((c) => c.id !== first.id)!;

  const banners = [
    {
      category: first,
      eyebrow: "Race-ready",
      title: "Speed, stunts & full control",
      body: "Hobby-grade RC cars, drones and more — charged up and ready for the driveway.",
      dark: true,
    },
    {
      category: second,
      eyebrow: "Game night",
      title: "Bring everyone to the table",
      body: "Strategy, party and classic games the whole family will want to play again.",
      dark: false,
    },
  ];

  return (
    <section aria-label="Featured collections" className="py-10 sm:py-14">
      <Container className="grid gap-4 md:grid-cols-2 md:gap-5">
        {banners.map(({ category, eyebrow, title, body, dark }, i) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            data-reveal
            style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
            className={`group relative isolate flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-[2rem] p-7 sm:min-h-[26rem] sm:p-10 ${
              dark ? "bg-midnight text-white" : "bg-[#ffe7d6] text-ink"
            }`}
          >
            <div className="relative z-10 max-w-[17rem] sm:max-w-xs">
              <p className={`eyebrow ${dark ? "!text-accent" : ""}`}>{eyebrow}</p>
              <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.05] sm:text-[2.25rem]">{title}</h2>
              <p className={`mt-3 text-[0.9375rem] leading-relaxed ${dark ? "text-white/70" : "text-ink/70"}`}>{body}</p>
            </div>
            <span
              className={`relative z-10 inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform group-hover:-translate-y-0.5 ${
                dark ? "bg-accent text-midnight" : "bg-ink text-white"
              }`}
            >
              Shop {category.name}
              <span className="font-normal opacity-70">· {pluralize(category.productCount, "toy")}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
            {category.imageUrl && (
              <div className="absolute -bottom-6 -right-6 -z-0 aspect-square w-[62%] max-w-[22rem] overflow-hidden rounded-[1.75rem] shadow-lift transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:rotate-[-2deg] sm:-bottom-8 sm:-right-8">
                <SmartImage src={category.imageUrl} alt="" fill sizes="(min-width: 768px) 22rem, 60vw" className="object-cover" />
              </div>
            )}
            {dark && (
              <span aria-hidden="true" className="absolute -left-24 -top-24 -z-10 size-72 rounded-full bg-accent/20 blur-3xl" />
            )}
          </Link>
        ))}
      </Container>
    </section>
  );
}

/** "Why White Monkey Toys" — only claims the platform actually backs up. */
export function WhySection({ storeName }: { storeName: string }) {
  const points = [
    {
      icon: Sparkles,
      title: "Thoughtfully chosen",
      body: "A curated range of RC toys, games and building sets — picked for play value, not shelf filler.",
      tint: "bg-[#fff1e9] text-accent-deep",
    },
    {
      icon: Banknote,
      title: "Pay on delivery",
      body: "No online payment needed. Place your order, we confirm it, and you pay when it arrives.",
      tint: "bg-[#e8f6ef] text-success-700",
    },
    {
      icon: PackageSearch,
      title: "Track every order",
      body: "Follow each step from confirmation to your doorstep — with or without an account.",
      tint: "bg-[#ecebff] text-[#4338ca]",
    },
    {
      icon: BadgeCheck,
      title: "Honest, verified reviews",
      body: "Only customers who received a product can review it, so every rating is a real purchase.",
      tint: "bg-[#fff6dc] text-[#8a5a00]",
    },
  ];
  return (
    <section aria-labelledby="why-title" className="py-16 sm:py-24">
      <Container>
        <div className="max-w-2xl" data-reveal>
          <p className="eyebrow">Why {storeName}</p>
          <h2 id="why-title" className="mt-3 text-[1.75rem] font-bold leading-[1.05] text-ink sm:text-4xl lg:text-[2.75rem]">
            Simple to shop. Made for families.
          </h2>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {points.map((p, i) => (
            <li
              key={p.title}
              data-reveal
              style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
              className="group rounded-[1.75rem] border border-line bg-surface p-6 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7"
            >
              <span className={`grid size-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg] ${p.tint}`}>
                <p.icon className="size-[1.375rem]" aria-hidden="true" strokeWidth={1.9} />
              </span>
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">{p.title}</h3>
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
    <section aria-labelledby="how-title" className="relative isolate overflow-hidden bg-midnight py-16 text-white sm:py-24">
      <div aria-hidden="true" className="bg-grain absolute inset-0 -z-10 opacity-60" />
      <div aria-hidden="true" className="absolute -right-40 top-1/2 -z-10 size-[30rem] -translate-y-1/2 rounded-full bg-accent/15 blur-[120px]" />
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <div data-reveal>
          <p className="eyebrow !text-accent">Ordering</p>
          <h2 id="how-title" className="mt-3 text-[1.75rem] font-bold leading-[1.05] sm:text-4xl lg:text-[2.75rem]">
            How it works
          </h2>
          <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-white/65">
            {store?.isOpen === false && store.closedMessage
              ? store.closedMessage
              : "No card details, no online payment. Your order is confirmed by a real person before it ships."}
          </p>
        </div>
        <ol className="relative grid gap-4 sm:grid-cols-3">
          <span aria-hidden="true" className="absolute left-6 right-6 top-[2.65rem] hidden h-px bg-gradient-to-r from-accent/70 via-white/20 to-white/5 sm:block" />
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
              className="relative rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:border-white/25 hover:bg-white/[0.07]"
            >
              <span
                className={`relative grid size-11 place-items-center rounded-full text-sm font-bold ${
                  i === 0 ? "bg-accent text-midnight" : "bg-white text-midnight"
                }`}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 font-display text-lg font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
