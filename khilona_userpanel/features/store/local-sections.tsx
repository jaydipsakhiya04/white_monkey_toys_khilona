import Link from "next/link";
import { ArrowRight, Building2, Check, Store, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SURAT_AREAS } from "@/lib/seo";
import type { CategorySummary, PublicStore } from "@/types/api";
import { Faq, type FaqItem } from "./faq";
import { storeAddressLines, storeHours } from "./store-utils";

/** The store supplies retailers and wholesalers only: two clear paths. */
export function WholesaleBand({ store, categoryCount }: { store: PublicStore | null; categoryCount: number }) {
  const city = store?.city || "Surat";
  const paths = [
    {
      Icon: Store,
      kicker: "Retailers",
      title: "For toy & gift shops",
      points: ["Retailer price list on WhatsApp", "Mix products across categories", "PAN India delivery from Surat"],
      cta: { href: "/products", label: "Browse catalogue" },
    },
    {
      Icon: Building2,
      kicker: "Wholesalers",
      title: "For distributors & bulk buyers",
      points: ["Wholesale price list", categoryCount > 0 ? `Bulk quantities across ${categoryCount} categories` : "Bulk quantities on request", "Quick quotes on WhatsApp"],
      cta: { href: "/wholesale#enquiry", label: "Get wholesale price" },
    },
  ];
  return (
    <section aria-labelledby="trade-title" className="bg-ink py-16 text-white sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div data-reveal>
          <p className="eyebrow !text-white/55">Retailers &amp; Wholesalers</p>
          <h2 id="trade-title" className="mt-3 text-[1.5rem] font-bold leading-[1.1] sm:text-[2rem] lg:text-[2.25rem]">
            Stock your shop with toys that sell.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            From {city}, we supply toy shops, retailers and wholesalers across India with RC cars, drones, construction RC and action
            figures.
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

/** Questions retailers and wholesalers ask, answered from the store's real details. */
export function localFaq(store: PublicStore | null): FaqItem[] {
  const name = store?.name || "White Monkey Toys";
  const city = store?.city || "Surat";
  const address = storeAddressLines(store).join(", ");
  const hours = storeHours(store);
  return [
    ...(address
      ? [{ q: `Where is ${name} in ${city}?`, a: `Our shop is at ${address}. Visit us to see the range, or order online for delivery anywhere in India.` }]
      : []),
    {
      q: "Who can buy from you?",
      a: "We sell only to retailers, toy and gift shops and wholesalers, not to individual consumers. Ask for our retailer or wholesale price list on WhatsApp.",
    },
    {
      q: "Do you deliver outside Surat?",
      a: "Yes, we deliver PAN India through courier and transport partners. Delivery charges are as per actual and are confirmed by our team before dispatch.",
    },
    {
      q: "Why are prices not shown on the website?",
      a: "Our prices depend on the quantity and on whether you buy as a retailer or a wholesaler. Tap “Ask for price” on any product, or WhatsApp us for the full price list.",
    },
    { q: "How do I pay?", a: "There is no online payment. Our team confirms the price and payment details with you on call or WhatsApp before your order is dispatched." },
    { q: "Do I need an account to order?", a: "Yes. Ordering and order tracking need a free business account. It takes a minute and keeps all your orders in one place." },
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
          <p className="eyebrow">Toy wholesaler in {city}</p>
          <h2 id="local-title" className="mt-3 text-[1.5rem] font-bold leading-[1.1] text-ink sm:text-[2rem] lg:text-[2.25rem]">
            {isSurat ? "Your toy wholesaler in Varachha, Surat" : `Your toy wholesaler in ${city}`}
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              {name} is a toy wholesaler and distributor
              {isSurat ? " on Varachha Main Road near Hirabaug" : ""}, supplying hobby-grade and premium RC cars, construction RC, drones and
              action figures to toy shops, retailers and wholesalers.
            </p>
            <p>
              We deliver PAN India. Order online with your business account, ask for prices on WhatsApp, or visit our shop to see the range
              in person.
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
                      {c.name} wholesale
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isSurat && (
            <div className="mt-8">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Truck className="size-4" strokeWidth={1.75} aria-hidden="true" />
                PAN India delivery from Surat
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Retailers across India order from us. Shops in Surat ({SURAT_AREAS.slice(0, 6).join(", ")} and more) can also pick up from our
                store.
              </p>
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
