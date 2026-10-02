"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { isApiError } from "@/lib/api/errors";
import { isValidIndianMobile, normalizeIndianMobile } from "@/utils/phone";
import { firstName, useAuth } from "./auth-provider";
import { AuthShell, FormAlert, PasswordField, PasswordStrength, passwordSchema, safeNext, TextLink } from "./auth-ui";

const schema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(80, "Name must be at most 80 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .max(160, "Email is too long")
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address"),
    phone: z.string().trim().min(1, "Mobile number is required").refine(isValidIndianMobile, "Enter a valid 10-digit Indian mobile number"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });
type Values = z.infer<typeof schema>;

const FIELDS = ["name", "email", "phone", "password"] as const;

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { signup, status } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError: setFieldError, control } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    if (status === "authenticated" && !formState.isSubmitting) router.replace(next);
  }, [status, next, router, formState.isSubmitting]);

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const customer = await signup({ name: v.name.trim(), email: v.email.trim().toLowerCase(), phone: normalizeIndianMobile(v.phone), password: v.password });
      toast.success(`Welcome to White Monkey Toys, ${firstName(customer.name)}!`);
      router.replace(next);
    } catch (e) {
      if (isApiError(e) && (e.status === 409 || e.status === 422) && e.errors.length) {
        let mapped = false;
        for (const fe of e.errors) {
          const field = fe.field as (typeof FIELDS)[number] | undefined;
          if (field && FIELDS.includes(field)) {
            setFieldError(field, { type: "server", message: fe.message });
            mapped = true;
          }
        }
        if (!mapped) setError(e.message);
      } else if (isApiError(e) && e.status === 429) setError("Too many attempts. Please wait a minute and try again.");
      else if (isApiError(e) && e.isNetworkError) setError("We couldn't reach the store. Check your connection and try again.");
      else setError("Something went wrong. Please try again.");
    }
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track every order, download invoices and review the toys you receive. Checkout as a guest is always available too."
      footer={
        <>
          Already have an account? <TextLink href={`/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}>Log in</TextLink>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && <FormAlert>{error}</FormAlert>}
        <TextField label="Full name" autoComplete="name" autoFocus error={formState.errors.name?.message} {...register("name")} />
        <TextField label="Email" type="email" inputMode="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
        <TextField
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          hint="10-digit mobile. Used for delivery updates and to sign in."
          error={formState.errors.phone?.message}
          {...register("phone")}
        />
        <div>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            hint="At least 8 characters with a letter and a number."
            error={formState.errors.password?.message}
            {...register("password")}
          />
          <PasswordStrength value={password} />
        </div>
        <PasswordField label="Confirm password" autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Button type="submit" size="lg" block loading={formState.isSubmitting} loadingText="Creating account…">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
