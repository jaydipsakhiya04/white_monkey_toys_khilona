import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CheckoutView } from "@/features/checkout/checkout-view";
import { getStore } from "@/services/catalog.server";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default async function CheckoutPage() {
  const store = await getStore();
  return (
    <Container className="py-6 sm:py-10">
      <h1 className="mb-6 text-3xl font-extrabold text-ink sm:text-4xl">Checkout</h1>
      <CheckoutView storeOpen={store?.isOpen ?? true} closedMessage={store?.closedMessage ?? null} />
    </Container>
  );
}
