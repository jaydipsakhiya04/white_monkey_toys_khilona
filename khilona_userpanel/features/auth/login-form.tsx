"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { isApiError } from "@/lib/api/errors";
import { firstName, useAuth } from "./auth-provider";
import { AuthShell, FormAlert, PasswordField, safeNext, TextLink } from "./auth-ui";

const schema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or mobile number")
    .refine((v) => (v.includes("@") ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : /^[+\d\s-]{10,16}$/.test(v)), "Enter a valid email or 10-digit mobile number"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { login, status } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { identifier: "", password: "" } });

  // already signed in → go straight to the destination
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const customer = await login(v.identifier.trim(), v.password);
      toast.success(`Welcome back, ${firstName(customer.name)}!`);
      router.replace(next);
    } catch (e) {
      if (isApiError(e) && e.status === 401) setError(e.message.includes("deactivated") ? e.message : "Email or password is incorrect.");
      else if (isApiError(e) && e.status === 429) setError("Too many attempts. Please wait a minute and try again.");
      else if (isApiError(e) && e.isNetworkError) setError("We couldn't reach the store. Check your connection and try again.");
      else setError("Something went wrong. Please try again.");
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to track orders, download invoices and review your toys."
      footer={
        <>
          New here? <TextLink href={`/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</TextLink>
          <span className="mx-2" aria-hidden="true">·</span>
          <TextLink href="/track-order">Track an order as a guest</TextLink>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {params.get("expired") === "1" && !error && <FormAlert tone="neutral">Your session has expired. Please log in again.</FormAlert>}
        {error && <FormAlert>{error}</FormAlert>}
        <TextField
          label="Email or mobile number"
          autoComplete="username"
          inputMode="email"
          autoFocus
          error={formState.errors.identifier?.message}
          {...register("identifier")}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={formState.errors.password?.message}
          trailingLink={
            <Link href="/forgot-password" className="font-semibold text-ink underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          }
          {...register("password")}
        />
        <Button type="submit" size="lg" block loading={formState.isSubmitting} loadingText="Logging in…">
          <LogIn className="size-4" aria-hidden="true" />
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
