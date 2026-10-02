import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersView } from "@/features/account/orders-view";

export const metadata: Metadata = { title: "My Orders" };

export default function AccountOrdersPage() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
