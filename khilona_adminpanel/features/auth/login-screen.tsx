'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail, PackageCheck, ShieldCheck, ShoppingBag, Sparkles, Store } from 'lucide-react';
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
    <div className="grid min-h-dvh bg-page lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-night p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-dots" aria-hidden />
        <div className="pointer-events-none absolute -left-40 -top-40 size-[520px] rounded-full bg-brand/30 blur-[120px]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-48 right-[-10%] size-[440px] rounded-full bg-[#7C5CFF]/20 blur-[120px]" aria-hidden />

        <div className="relative animate-enter">
          <BrandMark tone="dark" />
        </div>

        <div className="relative max-w-lg stagger">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/70">
            <Sparkles className="size-3.5 text-[#FF8A55]" aria-hidden />
            Store management console
          </p>
          <h2 className="mt-5 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.035em]">
            Run the toy shop
            <br />
            <span className="bg-gradient-to-r from-[#FFB088] via-[#FF7A3D] to-brand bg-clip-text text-transparent">
              from one calm place.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
            Confirm orders, call customers, keep stock honest and update the storefront — built for the White Monkey Toys team.
          </p>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {[
              { icon: ShoppingBag, title: 'Orders', text: 'Call, WhatsApp & update in a tap' },
              { icon: PackageCheck, title: 'Catalogue', text: 'Products, variants & photos' },
              { icon: Store, title: 'Storefront', text: 'Hours, contact & policies' },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-4 backdrop-blur-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand/20 text-[#FF8A55]">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-xs text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden />
            Authorised staff only
          </span>
          <span>© {new Date().getFullYear()} White Monkey Toys</span>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-10 sm:px-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand/[0.06] to-transparent lg:hidden"
          aria-hidden
        />
        <div className="relative w-full max-w-[400px] animate-enter">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>
          <h1 className="font-display text-[30px] font-bold tracking-[-0.03em]">Sign in</h1>
          <p className="mt-2 text-[15px] text-muted">Welcome back — use your admin email and password.</p>

          {formError && (
            <div
              role="alert"
              className="mt-6 flex animate-pop items-start gap-2 rounded-xl border border-red-200 bg-danger-tint px-3.5 py-3 text-[13px] text-red-800"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoFocus
                placeholder="you@whitemonkeytoys.in"
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
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 h-12 w-full rounded-xl">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-xs leading-relaxed text-muted shadow-card">
            <Lock className="mt-px size-4 shrink-0 text-stone-400" aria-hidden />
            <p>Forgot your password? Ask a super admin to reset it from Settings → Admin users.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
