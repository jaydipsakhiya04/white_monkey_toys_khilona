import { brandName } from "@/lib/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { ErrorState } from "@/components/ui/error-state";
import { JsonLd } from "@/components/ui/json-ld";
import { StoreInfoCard, storeJsonLd } from "@/features/store/store-info";
import { getStore } from "@/services/catalog.server";

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  const name = brandName(store);
  return {
    title: "Contact us",
    description: `Call, WhatsApp or visit ${name}. Store address, opening hours and directions.`,
    alternates: { canonical: "/contact" },
    openGraph: { url: "/contact" },
  };
}

export default async function ContactPage() {
  const store = await getStore();
  return (
    <Container className="py-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Contact" }]} />
      <h1 className="mb-6 mt-4 text-3xl font-extrabold text-ink sm:mb-8 sm:text-4xl lg:text-5xl">Contact us</h1>
      {!store ? (
        <ErrorState />
      ) : (
        <>
          <JsonLd data={storeJsonLd(store)} />
          <StoreInfoCard store={store} headingLevel="h2" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {store.email && (
              <a href={`mailto:${store.email}`} className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 hover:border-line-strong">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand text-ink">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-ink">Email us</span>
                  <span className="block break-all text-sm text-muted">{store.email}</span>
                </span>
              </a>
            )}
            <Link href="/track-order" className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 hover:border-line-strong">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand text-ink">
                <Truck className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold text-ink">Track an order</span>
                <span className="block text-sm text-muted">Use your order number and mobile number.</span>
              </span>
            </Link>
          </div>
        </>
      )}
    </Container>
  );
}
