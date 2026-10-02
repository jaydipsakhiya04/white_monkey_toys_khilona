import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { TrackView } from "@/features/orders/track-view";

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
  return (
    <Container className="py-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Track order" }]} />
      <h1 className="mb-6 mt-4 text-3xl font-extrabold text-ink sm:mb-8 sm:text-4xl">Track your order</h1>
      <TrackView defaultOrderNumber={orderNumber} />
    </Container>
  );
}
