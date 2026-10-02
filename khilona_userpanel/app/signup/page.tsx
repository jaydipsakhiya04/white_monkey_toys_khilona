import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/features/auth/signup-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free account to track orders, download invoices and review the toys you love.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
