import type { Metadata } from "next";
import { OrderDetailView } from "@/features/account/order-detail-view";

type Props = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${decodeURIComponent(orderNumber)}` };
}

export default async function AccountOrderPage({ params }: Props) {
  const { orderNumber } = await params;
  return <OrderDetailView orderNumber={decodeURIComponent(orderNumber).toUpperCase()} />;
}
