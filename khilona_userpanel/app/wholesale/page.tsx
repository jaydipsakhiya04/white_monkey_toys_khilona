import type { Metadata } from "next";
import { ArrowRight, Boxes, MapPin, MessageCircle, Tags } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/ui/json-ld";
import { CategoryCard } from "@/features/catalog/category-card";
import { Faq, type FaqItem } from "@/features/store/faq";
import { storeJsonLd } from "@/features/store/store-info";
import { storeAddressLines, storeHours, storeWhatsappUrl } from "@/features/store/store-utils";
import { WholesaleEnquiry } from "@/features/wholesale/wholesale-enquiry";
import { brandName } from "@/lib/brand";
import { WHOLESALE_KEYWORDS } from "@/lib/seo";
import { getCategoryTree, getStore } from "@/services/catalog.server";
import type { PublicStore } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  const name = brandName(store);
  const city = store?.city || "Surat";
  const title = `Wholesale Toys in ${city} – Retailer & Bulk Prices`;
  const description = `${name} is a toy wholesaler in ${city}: RC cars, drones, construction RC, action figures, die-cast cars and dioramas at retailer and wholesale prices for shops and resellers.`;
  return {
    title,
    description,
    keywords: WHOLESALE_KEYWORDS,
    alternates: { canonical: "/wholesale" },
    openGraph: { url: "/wholesale", title, description },
  };
}

function wholesaleFaq(store: PublicStore | null): FaqItem[] {
  const city = store?.city || "Surat";
  const address = storeAddressLines(store).join(", ");
  return [
    {
      q: "Who can buy at wholesale or retailer prices?",
      a: "Toy shops, gift stores, resellers, event and corporate buyers, and anyone buying in bulk. Choose “Retailer price” if you stock a shop, or “Wholesale price” for larger quantities and distribution.",
    },
    {
      q: "Which toys are available wholesale?",
      a: "Our full range: hobby-grade and premium RC cars, construction RC vehicles, drones and RC aircraft, action figures, licensed die-cast cars and 1:64 dioramas. Ask about specific models in your enquiry.",
    },
    {
      q: "How do I get the price list?",
      a: "Log in, fill in the enquiry form on this page and send it to us on WhatsApp. Our team replies with prices and availability for the quantities you need.",
    },
    {
      q: `Can I pick up from your store in ${city}?`,
      a: address
        ? `Yes — collect from our store at ${address}, or we can arrange delivery. Delivery within ${city} is free.`
        : `Yes — collect from our store or we can arrange delivery. Delivery within ${city} is free.`,
    },
    { q: "Do you supply outside Surat?", a: "Yes, we can arrange supply to other cities. Mention your city in the enquiry and we'll share delivery options and charges." },
  ];
}

export default async function WholesalePage() {
  const [store, categories] = await Promise.all([getStore(), getCategoryTree()]);
  const name = brandName(store);
  const city = store?.city || "Surat";
  const live = (categories ?? []).filter((c) => c.productCount > 0);
  const products = live.reduce((s, c) => s + c.productCount, 0);
  const hours = storeHours(store);
  const address = storeAddressLines(store);

  const benefits = [
    { Icon: Tags, title: "Retailer & wholesale prices", body: "Two price lists: one for shops and resellers, one for bulk buyers and distributors." },
    { Icon: Boxes, title: "One supplier, full range", body: "RC cars, drones, construction RC, action figures, die-cast cars and dioramas." },
    { Icon: MapPin, title: `Pickup or delivery in ${city}`, body: `Collect from our store or get it delivered — free anywhere in ${city}.` },
    { Icon: MessageCircle, title: "Quick WhatsApp quotes", body: "Send your requirement and get prices and availability from a real person." },
  ];
  const steps = [
    { title: "Send your requirement", body: "Choose retailer or wholesale pricing, the categories you want and an approximate quantity." },
    { title: "Get your price list", body: "Our team replies on WhatsApp with prices, availability and delivery or pickup options." },
    { title: "Confirm & receive", body: "Confirm your order and pay as agreed — collect from the store or receive delivery." },
  ];

  return (
    <>
      {store && <JsonLd data={storeJsonLd(store)} />}
      <Container className="py-6 sm:py-10">
        <Breadcrumbs items={[{ name: "Wholesale" }]} />

        {/* hero */}
        <header className="relative mt-4 overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_70%_at_80%_40%,#000,transparent)]"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <p className="eyebrow !text-white/60">Wholesale toys in {city}</p>
              <h1 className="mt-5 text-[2.4rem] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-[3.25rem] lg:text-[3.75rem]">
                Retailer &amp; wholesale prices on toys.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-[1.0625rem]">
                {name} supplies toy shops and resellers across {city} and beyond — RC cars, drones, action figures and collectibles at
                prices that work for your business.
              </p>
              <div className="mt-8 flex flex-col gap-3 xs:flex-row">
                <ButtonLink href="#enquiry" size="lg" variant="inverse" className="group">
                  Request pricing
                  <ArrowRight className="size-[1.125rem] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/products" size="lg" variant="outline-inverse">
                  Browse the range
                </ButtonLink>
              </div>
            </div>
            {live.length > 0 && (
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10">
                {[
                  { value: String(live.length), label: "Categories" },
                  { value: `${products}+`, label: "Products" },
                  { value: "2", label: "Price lists" },
                  { value: "Free", label: `Delivery in ${city}` },
                ].map((s) => (
                  <div key={s.label} className="bg-ink p-5 sm:p-6">
                    <dt className="text-xs text-white/50">{s.label}</dt>
                    <dd className="mt-1 font-display text-2xl font-bold sm:text-3xl">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </header>

        {/* benefits */}
        <section aria-labelledby="why-wholesale" className="py-14 sm:py-20">
          <h2 id="why-wholesale" className="sr-only">
            Why buy wholesale from {name}
          </h2>
          <ul className="grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ Icon, title, body }) => (
              <li key={title} className="bg-white p-7">
                <span className="grid size-11 place-items-center rounded-full border border-line-strong text-ink">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-[1.0625rem] font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* enquiry */}
        <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-28 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="eyebrow">Get a quote</p>
            <h2 id="enquiry-title" className="mt-4 text-[1.875rem] font-bold leading-[1.08] text-ink sm:text-[2.5rem]">
              Request retailer or wholesale pricing
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Tell us what you’d like to stock. Your enquiry opens in WhatsApp, ready to send, and our team replies with prices and
              availability.
            </p>
            <ol className="mt-8 space-y-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-semibold text-white">{i + 1}</span>
                  <span>
                    <span className="block font-semibold text-ink">{s.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            {(address.length > 0 || hours) && (
              <div className="mt-8 rounded-[1.5rem] bg-sand p-5 text-sm leading-relaxed text-ink">
                <p className="font-semibold">Visit the store</p>
                {address.map((l) => (
                  <p key={l} className="text-muted">
                    {l}
                  </p>
                ))}
                {hours && <p className="mt-1 text-muted">{hours}</p>}
              </div>
            )}
          </div>
          <div className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-soft sm:p-8">
            <WholesaleEnquiry
              storeName={name}
              whatsapp={storeWhatsappUrl(store)}
              defaultCity={city}
              categories={live.map((c) => c.name)}
            />
          </div>
        </section>

        {/* categories */}
        {live.length > 0 && (
          <section aria-labelledby="stock-title" className="pt-16 sm:pt-24">
            <p className="eyebrow">Stock your shelves</p>
            <h2 id="stock-title" className="mb-8 mt-4 text-[1.875rem] font-bold leading-[1.08] text-ink sm:text-[2.25rem]">
              Categories available wholesale
            </h2>
            <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-5 sm:overflow-visible sm:px-0 xl:grid-cols-7">
              {live.map((c, i) => (
                <li key={c.id} className="w-[42vw] shrink-0 snap-start sm:w-auto">
                  <CategoryCard category={c} index={i} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ */}
        <section aria-labelledby="wholesale-faq" className="mx-auto max-w-3xl pt-16 sm:pt-24">
          <h2 id="wholesale-faq" className="mb-6 text-center text-[1.75rem] font-bold leading-[1.1] text-ink sm:text-[2.25rem]">
            Wholesale FAQs
          </h2>
          <Faq items={wholesaleFaq(store)} />
        </section>
      </Container>
    </>
  );
}
