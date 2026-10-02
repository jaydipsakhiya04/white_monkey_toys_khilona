import { brandName } from "@/lib/brand";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { storePhoneUrl, storeWhatsappUrl } from "@/features/store/store-utils";
import { SuccessView } from "@/features/orders/success-view";
import { getStore } from "@/services/catalog.server";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderSuccessPage({ params }: Props) {
  const { orderNumber } = await params;
  const store = await getStore();
  return (
    <Container className="py-8 sm:py-14">
      <SuccessView
        orderNumber={decodeURIComponent(orderNumber)}
        storeName={brandName(store)}
        phoneUrl={storePhoneUrl(store)}
        whatsapp={storeWhatsappUrl(store)}
      />
    </Container>
  );
}
