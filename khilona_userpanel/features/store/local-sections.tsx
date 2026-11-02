import Link from "next/link";
import { ArrowRight, Building2, Check, MapPin, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SURAT_AREAS } from "@/lib/seo";
import type { CategorySummary, PublicStore } from "@/types/api";
import { Faq, type FaqItem } from "./faq";
import { storeAddressLines, storeHours } from "./store-utils";

/** "Retail & Wholesale": the store serves families and shops — two clear paths. */
export function WholesaleBand({ store, categoryCount }: { store: PublicStore | null; categoryCount: number }) {
  const city = store?.city || "Surat";
  const paths = [
    {
      Icon: ShoppingBag,
      kicker: "Retail",
      title: "For families & collectors",
      points: [`Free delivery across ${city}`, "Cash on delivery — cash or UPI", "Track every order online"],
      cta: { href: "/products", label: "Shop retail" },
    },
    {
      Icon: Building2,
      kicker: "Wholesale",
      title: "For shops & resellers",
      points: ["Retailer & wholesale price lists", categoryCount > 0 ? `Bulk quantities across ${categoryCount} categories` : "Bulk quantities on request", "Quick quotes on WhatsApp"],
      cta: { href: "/wholesale#enquiry", label: "Get wholesale price" },
    },
  ];
  return (
    <section aria-labelledby="trade-title" className="bg-ink py-16 text-white sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div data-reveal>
          <p className="eyebrow !text-white/55">Retail &amp; Wholesale</p>
          <h2 id="trade-title" className="mt-4 text-[1.875rem] font-bold leading-[1.08] sm:text-[2.5rem]">
            Toys for your home — and for your shop.
          </h2>
          <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/60">
            Shop for your family with free delivery in {city}, or stock your store with RC cars, drones, action figures and collectibles at
            retailer and wholesale prices.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {paths.map(({ Icon, kicker, title, points, cta }, i) => (
            <li
              key={kicker}
              data-reveal
              style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
              className="flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-white/25 sm:p-7"
            >
              <span className="grid size-11 place-items-center rounded-full bg-white text-ink">
                <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className="mt-6 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-white/45">{kicker}</p>
              <h3 className="mt-1.5 font-display text-xl font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-white" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <ButtonLink href={cta.href} variant={i === 1 ? "inverse" : "outline-inverse"} className="group mt-7 w-full">
                {cta.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </ButtonLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Questions local shoppers and shop owners ask, answered from the store's real details. */
export function localFaq(store: PublicStore | null): FaqItem[] {
  const name = store?.name || "White Monkey Toys";
  const city = store?.city || "Surat";
  const address = storeAddressLines(store).join(", ");
  const hours = storeHours(store);
  return [
    ...(address
      ? [{ q: `Where is ${name} in ${city}?`, a: `Our toy shop is at ${address}. Visit us in store, or order online for free delivery anywhere in ${city}.` }]
      : []),
    {
      q: `Do you offer free delivery in ${city}?`,
      a: `Yes — delivery is free everywhere in ${city}, including ${SURAT_AREAS.slice(0, 6).join(", ")} and more. Orders are usually delivered within 1–3 working days after our team confirms them.`,
    },
    {
      q: "Do you sell toys wholesale?",
      a: `Yes. Toy shops, resellers and bulk buyers can request retailer or wholesale pricing on RC cars, drones, construction RC, action figures, die-cast cars and dioramas. Send an enquiry from our wholesale page or visit the store in ${city}.`,
    },
    { q: "How do I pay?", a: "Pay on delivery in cash or UPI. There is no online payment — our team confirms every order by phone or WhatsApp before it ships." },
    { q: "Do I need an account to order?", a: "Yes. Ordering, enquiries and order tracking in your account need a free customer account — it takes a minute and keeps all your orders in one place." },
    ...(hours ? [{ q: "What are your store timings?", a: `We're open ${hours}.` }] : []),
  ];
}

/** Local SEO content: who we are, where we are, what we stock, which areas we deliver to — plus FAQs. */
export function LocalSection({ store, categories }: { store: PublicStore | null; categories: CategorySummary[] }) {
  const name = store?.name || "White Monkey Toys";
  const city = store?.city || "Surat";
  const isSurat = city.toLowerCase() === "surat";
  const live = categories.filter((c) => c.productCount > 0);
  return (
    <section aria-labelledby="local-title" className="py-16 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div data-reveal>
          <p className="eyebrow">Toy shop in {city}</p>
          <h2 id="local-title" className="mt-4 text-[1.875rem] font-bold leading-[1.08] text-ink sm:text-[2.5rem]">
            {isSurat ? "Your toy shop in Varachha, Surat" : `Your toy shop in ${city}`}
          </h2>
          <div className="mt-5 space-y-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            <p>
              Looking for the best toys in {city}? {name} is a local toy store
              {isSurat ? " on Varachha Main Road near Hirabaug" : ""} for hobby-grade RC cars, drones, construction RC vehicles, action
              figures, licensed die-cast cars and display dioramas — for kids, teens and collectors.
            </p>
            <p>
              Order online with free delivery across {city} and pay on delivery, or visit the shop to see the collection in person. Shop
              owners and resellers can also buy wholesale toys from us at retailer and wholesale prices.
            </p>
          </div>

          {live.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-ink">Popular in {city}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {live.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-3.5 text-sm font-medium text-ink transition-colors hover:border-ink"
                    >
                      {c.name} in {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isSurat && (
            <div className="mt-8">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <MapPin className="size-4" strokeWidth={1.75} aria-hidden="true" />
                Free delivery across Surat
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{SURAT_AREAS.join(" · ")} and every other area of Surat.</p>
            </div>
          )}
        </div>

        <div data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
          <h3 className="mb-5 font-display text-xl font-semibold text-ink">Frequently asked questions</h3>
          <Faq items={localFaq(store)} />
        </div>
      </Container>
    </section>
  );
}
