import type { Metadata } from "next";
import { AccountShell } from "@/features/account/account-shell";
import { storePhoneUrl, storeWhatsappUrl } from "@/features/store/store-utils";
import { brandName } from "@/lib/brand";
import { getStore } from "@/services/catalog.server";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  return (
    <AccountShell storeName={brandName(store)} phoneUrl={storePhoneUrl(store)} whatsappUrl={storeWhatsappUrl(store)}>
      {children}
    </AccountShell>
  );
}
