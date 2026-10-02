'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail, PackageCheck, ShoppingBag, Store } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BrandMark, FullScreenLoader } from '@/components/layout/brand';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { safeNextPath } from '@/utils/url';
import { useAuth } from './auth-provider';
import { OfflineScreen } from './auth-guard';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

export function LoginScreen() {
  const { status, login, retry } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, next, router]);

  if (status === 'loading') return <FullScreenLoader label="Checking your session…" />;
  if (status === 'offline') return <OfflineScreen onRetry={retry} />;
  if (status === 'authenticated') return <FullScreenLoader label="Opening dashboard…" />;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      if (isApiError(err) && err.status === 401) setFormError('Incorrect email or password. Please try again.');
      else if (isApiError(err) && err.status === 403) setFormError(err.message || 'This account has been deactivated.');
      else setFormError(getErrorMessage(err, 'Could not sign in. Please try again.'));
    }
  });

  return (
    <div className="grid min-h-dvh bg-page lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between border-r border-line bg-surface p-10 lg:flex">
        <BrandMark />
        <div className="max-w-md">
          <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Run the shop floor
            <br />
            from one quiet place.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Confirm orders, call customers, keep stock honest and update the storefront — built for the KHILONA team.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              { icon: ShoppingBag, title: 'Orders', text: 'Call, WhatsApp and update status in a tap.' },
              { icon: PackageCheck, title: 'Catalogue', text: 'Products, variants, stock and photos.' },
              { icon: Store, title: 'Storefront', text: 'Hours, contact details and policies.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-page text-brand">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium text-ink">{title}</span>
                  <span className="text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-stone-400">Authorised staff only</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-sm text-muted">Use your admin email and password.</p>

          {formError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-danger-tint px-3 py-2.5 text-[13px] text-red-800"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoFocus
                placeholder="you@khilona.in"
                leading={<Mail />}
                invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="[&_input]:h-11"
                {...register('email')}
              />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                leading={<Lock />}
                invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="[&_input]:h-11"
                trailing={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                }
                {...register('password')}
              />
            </Field>
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            Forgot your password? Ask a super admin to reset it from Settings → Admin users.
          </p>
        </div>
      </main>
    </div>
  );
}
