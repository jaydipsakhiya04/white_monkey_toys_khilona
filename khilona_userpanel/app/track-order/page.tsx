import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { TrackView } from "@/features/orders/track-view";
import { brandName } from "@/lib/brand";
import { getStore } from "@/services/catalog.server";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your order with your order number and mobile number.",
  alternates: { canonical: "/track-order" },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TrackOrderPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.orderNumber) ? sp.orderNumber[0] : sp.orderNumber;
  const orderNumber = (raw ?? "").slice(0, 40);
  const store = await getStore();
  return (
    <Container className="py-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Track order" }]} />
      <h1 className="mb-6 mt-4 text-3xl font-bold tracking-tight text-ink sm:mb-8 sm:text-[2.75rem]">Track Your Order</h1>
      <TrackView defaultOrderNumber={orderNumber} storeName={brandName(store)} />
    </Container>
  );
}
