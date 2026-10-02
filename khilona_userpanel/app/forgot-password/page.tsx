import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/password-reset";
import { storePhoneUrl, storeWhatsappUrl } from "@/features/store/store-utils";
import { getStore } from "@/services/catalog.server";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage() {
  const store = await getStore();
  return (
    <ForgotPasswordForm
      phoneUrl={storePhoneUrl(store)}
      whatsappUrl={storeWhatsappUrl(store, "Hi, I need help resetting the password of my account.")}
    />
  );
}
