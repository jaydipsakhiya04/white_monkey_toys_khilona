"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useAuth } from "@/features/auth/auth-provider";
import { FormAlert, PasswordField, PasswordStrength, passwordSchema } from "@/features/auth/auth-ui";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/auth/session";
import { accountService, customerAuth } from "@/services/account";
import { isValidIndianMobile, normalizeIndianMobile } from "@/utils/phone";
import { AccountHeading } from "./account-shell";
import { useState } from "react";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80, "Name must be at most 80 characters"),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address").max(160),
  phone: z.string().trim().refine(isValidIndianMobile, "Enter a valid 10-digit Indian mobile number"),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordFormSchema = z
  .object({ currentPassword: z.string().min(1, "Current password is required"), newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });
type PasswordValues = z.infer<typeof passwordFormSchema>;

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ProfileForm() {
  const { customer } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: customer?.name ?? "", email: customer?.email ?? "", phone: customer?.phone ?? "" },
  });
  const { register, handleSubmit, formState, setError: setFieldError } = form;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const updated = await accountService.updateProfile({ name: v.name.trim(), email: v.email.trim().toLowerCase(), phone: normalizeIndianMobile(v.phone) });
      useSession.getState().setCustomer(updated);
      toast.success("Profile updated");
    } catch (e) {
      if (isApiError(e) && e.errors.length) {
        for (const fe of e.errors) if (fe.field && fe.field in v) setFieldError(fe.field as keyof ProfileValues, { message: fe.message });
      } else setError(errorMessage(e));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      {error && (
        <div className="sm:col-span-2">
          <FormAlert>{error}</FormAlert>
        </div>
      )}
      <TextField label="Full name" autoComplete="name" wrapperClassName="sm:col-span-2" error={formState.errors.name?.message} {...register("name")} />
      <TextField label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
      <TextField label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" error={formState.errors.phone?.message} {...register("phone")} />
      <div className="sm:col-span-2">
        <Button type="submit" loading={formState.isSubmitting} loadingText="Saving…" disabled={!formState.isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, reset, watch, setError: setFieldError } = useForm<PasswordValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await customerAuth.changePassword(v.currentPassword, v.newPassword);
      reset();
      toast.success("Password changed. Other devices have been signed out.");
    } catch (e) {
      if (isApiError(e) && e.errors.length) {
        for (const fe of e.errors) if (fe.field && fe.field in v) setFieldError(fe.field as keyof PasswordValues, { message: fe.message });
      } else setError(errorMessage(e));
    }
  });
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:max-w-md">
      {error && <FormAlert>{error}</FormAlert>}
      <PasswordField label="Current password" autoComplete="current-password" error={formState.errors.currentPassword?.message} {...register("currentPassword")} />
      <div>
        <PasswordField label="New password" autoComplete="new-password" error={formState.errors.newPassword?.message} {...register("newPassword")} />
        <PasswordStrength value={watch("newPassword")} />
      </div>
      <PasswordField label="Confirm new password" autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register("confirmPassword")} />
      <div>
        <Button type="submit" variant="dark" loading={formState.isSubmitting} loadingText="Updating…">
          Change password
        </Button>
      </div>
    </form>
  );
}

export function ProfileView() {
  return (
    <>
      <AccountHeading title="Profile" description="Manage your details and password." />
      <div className="space-y-6">
        <Card title="Your details" description="Used to sign in and to prefill checkout. Delivery addresses are entered per order.">
          <ProfileForm />
        </Card>
        <Card title="Password" description="Changing your password signs you out on other devices.">
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
