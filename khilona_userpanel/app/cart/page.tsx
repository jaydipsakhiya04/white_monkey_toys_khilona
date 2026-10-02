import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CartView } from "@/features/cart/cart-view";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return (
    <Container className="py-6 sm:py-10">
      <h1 className="mb-6 text-3xl font-extrabold text-ink sm:mb-8 sm:text-4xl">Your cart</h1>
      <CartView />
    </Container>
  );
}
