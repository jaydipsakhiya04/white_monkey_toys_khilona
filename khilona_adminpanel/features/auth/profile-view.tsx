'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { passwordSchema, PasswordRules } from '@/features/admins/password';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { authService } from '@/services';
import { formatDateTime } from '@/utils/format';
import { useAuth } from './auth-provider';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Too long'),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\+?[\d\s-]{10,16}$/.test(v), 'Enter a valid phone number'),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm the new password'),
  })
  .superRefine((v, ctx) => {
    if (v.newPassword !== v.confirmPassword)
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: "Passwords don't match" });
    if (v.currentPassword && v.newPassword === v.currentPassword)
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'Choose a password different from the current one' });
  });

export function ProfileView() {
  const { admin, setAdmin } = useAuth();
  const [show, setShow] = useState(false);

  const profile = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: admin?.name ?? '', phone: admin?.phone ?? '' },
  });
  const pwd = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const saveProfile = profile.handleSubmit(async (v) => {
    try {
      const updated = await authService.updateMe({ name: v.name.trim(), phone: v.phone.trim() || null });
      setAdmin(updated);
      profile.reset({ name: updated.name, phone: updated.phone ?? '' });
      toast.success('Profile updated');
    } catch (err) {
      const applied = applyApiFieldErrors(err, profile.setError, { knownFields: ['name', 'phone'] });
      if (!applied) toast.error(getErrorMessage(err, 'Could not update your profile'));
    }
  });

  const changePassword = pwd.handleSubmit(async (v) => {
    try {
      await authService.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword });
      pwd.reset();
      toast.success('Password changed. Other devices have been signed out.');
    } catch (err) {
      if (isApiError(err) && (err.status === 400 || err.status === 401 || err.status === 403) && /current|incorrect|wrong|invalid/i.test(err.message)) {
        pwd.setError('currentPassword', { type: 'server', message: 'Current password is incorrect' });
        return;
      }
      const applied = applyApiFieldErrors(err, pwd.setError, { knownFields: ['currentPassword', 'newPassword'] });
      if (!applied) toast.error(getErrorMessage(err, 'Could not change your password'));
    }
  });

  return (
    <>
      <PageHeader title="Profile" description="Your account details and password." breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Profile' }]} />
      <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" />
          <form onSubmit={saveProfile} noValidate>
            <div className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="text-muted">Email</span>
                <span className="font-medium">{admin?.email}</span>
                <Badge tone={admin?.role === 'SUPER_ADMIN' ? 'brand' : 'neutral'}>
                  <ShieldCheck className="size-3" aria-hidden />
                  {admin?.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}
                </Badge>
              </div>
              <Field label="Full name" required error={profile.formState.errors.name?.message}>
                <Input {...profile.register('name')} autoComplete="name" />
              </Field>
              <Field label="Phone" error={profile.formState.errors.phone?.message}>
                <Input {...profile.register('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" />
              </Field>
              {admin?.lastLoginAt && <p className="text-xs text-muted">Last sign-in {formatDateTime(admin.lastLoginAt)}</p>}
            </div>
            <div className="flex justify-end border-t border-line px-4 py-3 sm:px-5">
              <Button type="submit" size="sm" loading={profile.formState.isSubmitting} disabled={!profile.formState.isDirty}>
                Save profile
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Change password" description="You'll stay signed in here; other devices are signed out." />
          <form onSubmit={changePassword} noValidate>
            <div className="flex flex-col gap-4 p-4 sm:p-5">
              <Field label="Current password" required error={pwd.formState.errors.currentPassword?.message}>
                <Input {...pwd.register('currentPassword')} type={show ? 'text' : 'password'} autoComplete="current-password" />
              </Field>
              <Field label="New password" required error={pwd.formState.errors.newPassword?.message}>
                <Input
                  {...pwd.register('newPassword')}
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  trailing={
                    <Button variant="ghost" size="icon-sm" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide passwords' : 'Show passwords'} aria-pressed={show}>
                      {show ? <EyeOff /> : <Eye />}
                    </Button>
                  }
                />
              </Field>
              <PasswordRules value={pwd.watch('newPassword')} />
              <Field label="Confirm new password" required error={pwd.formState.errors.confirmPassword?.message}>
                <Input {...pwd.register('confirmPassword')} type={show ? 'text' : 'password'} autoComplete="new-password" />
              </Field>
            </div>
            <div className="flex justify-end border-t border-line px-4 py-3 sm:px-5">
              <Button type="submit" size="sm" loading={pwd.formState.isSubmitting}>
                Change password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
