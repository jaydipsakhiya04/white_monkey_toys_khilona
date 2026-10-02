"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, MailCheck, Phone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/icons/brand";
import { Button, ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { customerAuth } from "@/services/account";
import { AuthShell, FormAlert, PasswordField, PasswordStrength, passwordSchema, TextLink } from "./auth-ui";

const forgotSchema = z.object({ identifier: z.string().trim().min(1, "Enter your email or mobile number") });

/**
 * Step 1: request a reset link. When no email/SMS channel is configured on the server, the page
 * says so honestly and points to the store instead of claiming a message was sent.
 */
export function ForgotPasswordForm({ phoneUrl, whatsappUrl }: { phoneUrl: string | null; whatsappUrl: string | null }) {
  const [result, setResult] = useState<{ deliveryAvailable: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema), defaultValues: { identifier: "" } });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      setResult(await customerAuth.forgotPassword(v.identifier.trim()));
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  if (result) {
    return (
      <AuthShell
        title={result.deliveryAvailable ? "Check your inbox" : "Let's get you back in"}
        footer={<TextLink href="/login">Back to log in</TextLink>}
      >
        {result.deliveryAvailable ? (
          <div className="space-y-4 text-[0.9375rem] text-muted">
            <MailCheck className="size-10 text-ink" aria-hidden="true" />
            <p>If an account matches those details, we&apos;ve sent a link to reset your password. It expires in 30 minutes.</p>
          </div>
        ) : (
          <div className="space-y-4 text-[0.9375rem] text-muted">
            <p>
              Password reset by email or SMS isn&apos;t available on our store yet. Please contact us and we&apos;ll help you regain access to
              your account.
            </p>
            <div className="flex flex-col gap-3 xs:flex-row">
              {phoneUrl && (
                <ButtonAnchor href={phoneUrl} variant="dark">
                  <Phone className="size-4" aria-hidden="true" /> Call the store
                </ButtonAnchor>
              )}
              {whatsappUrl && (
                <ButtonAnchor href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="outline">
                  <WhatsAppIcon className="size-4" /> WhatsApp
                </ButtonAnchor>
              )}
              {!phoneUrl && !whatsappUrl && <ButtonLink href="/contact">Contact us</ButtonLink>}
            </div>
            <p className="text-sm">You can still place orders as a guest and track them with your order number and mobile number.</p>
          </div>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email or mobile number on your account and we'll help you reset it."
      footer={
        <>
          Remembered it? <TextLink href="/login">Log in</TextLink>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && <FormAlert>{error}</FormAlert>}
        <TextField label="Email or mobile number" autoComplete="username" autoFocus error={formState.errors.identifier?.message} {...register("identifier")} />
        <Button type="submit" size="lg" block loading={formState.isSubmitting} loadingText="Sending…">
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}

const resetSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string().min(1, "Please confirm your password") })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

/** Step 2: choose a new password using the token from the link. */
export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, watch } = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <AuthShell title="Reset link missing" subtitle="This page needs the link from your password reset message." footer={<TextLink href="/forgot-password">Request a new link</TextLink>}>
        <ButtonLink href="/login" block>
          Back to log in
        </ButtonLink>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="Your new password is ready. For your security, all devices were signed out.">
        <CheckCircle2 className="mb-6 size-10 text-success-700" aria-hidden="true" />
        <Button size="lg" block onClick={() => router.replace("/login")}>
          Log in
        </Button>
      </AuthShell>
    );
  }

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await customerAuth.resetPassword(token, v.password);
      setDone(true);
    } catch (e) {
      setError(isApiError(e) && e.status === 400 ? e.message : errorMessage(e));
    }
  });

  return (
    <AuthShell title="Create a new password" footer={<Link href="/forgot-password" className="font-semibold text-ink underline underline-offset-4">Need a new link?</Link>}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && <FormAlert>{error}</FormAlert>}
        <div>
          <PasswordField label="New password" autoComplete="new-password" autoFocus error={formState.errors.password?.message} {...register("password")} />
          <PasswordStrength value={watch("password")} />
        </div>
        <PasswordField label="Confirm new password" autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Button type="submit" size="lg" block loading={formState.isSubmitting} loadingText="Updating…">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
