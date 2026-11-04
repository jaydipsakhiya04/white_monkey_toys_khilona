'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail, PackageCheck, ShieldCheck, ShoppingBag, Store } from 'lucide-react';
import Image from 'next/image';
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

/** The storefront's hero scene (transparent cut-outs in /public/hero), so staff and customers see one brand. */
const SCENE = [
  { src: '/hero/scene-helicopter.webp', w: 800, h: 622, style: { left: '4%', top: '4%', width: '46%' } },
  { src: '/hero/scene-jimny.webp', w: 722, h: 464, style: { left: '1%', top: '45%', width: '42%' } },
  { src: '/hero/scene-excavator.webp', w: 912, h: 921, style: { right: '2%', top: '15%', width: '55%' } },
  { src: '/hero/scene-supra.webp', w: 502, h: 239, style: { left: '30%', bottom: '5%', width: '42%' } },
];

function Scene() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[26rem]" aria-hidden>
      <div className="absolute left-1/2 top-1/2 aspect-square w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_40px_80px_-40px_rgb(17_17_17/0.3)]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-full -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.06]" />
      {SCENE.map((item, i) => (
        <div key={item.src} className="absolute animate-enter" style={{ ...item.style, animationDelay: `${150 + i * 80}ms` }}>
          <Image src={item.src} alt="" width={item.w} height={item.h} priority={i < 2} sizes="16rem" className="h-auto w-full" />
        </div>
      ))}
    </div>
  );
}

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
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-subtle p-12 text-ink lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(17_17_17/0.05)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]"
          aria-hidden
        />

        <div className="relative animate-enter">
          <BrandMark />
        </div>

        <div className="relative grid items-center gap-8 xl:grid-cols-[1.1fr_1fr]">
          <div className="max-w-md stagger">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              Store management
            </p>
            <h2 className="mt-5 font-display text-[42px] font-extrabold leading-[1.02] tracking-[-0.045em]">
              Run the toy shop from one <span className="text-accent">calm place.</span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Confirm orders, call customers, keep stock honest and update the storefront — built for the White Monkey Toys team.
            </p>
          </div>
          <div className="hidden xl:block">
            <Scene />
          </div>
        </div>

        <div className="relative">
          <div className="grid max-w-2xl grid-cols-3 gap-3">
            {[
              { icon: ShoppingBag, title: 'Orders', text: 'Call, WhatsApp & update in a tap' },
              { icon: PackageCheck, title: 'Catalogue', text: 'Products, variants & photos' },
              { icon: Store, title: 'Storefront', text: 'Hours, contact & policies' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <span className="flex size-9 items-center justify-center rounded-full border border-line-strong text-ink">
                  <Icon className="size-[17px]" strokeWidth={1.6} aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" aria-hidden />
              Authorised staff only
            </span>
            <span>© {new Date().getFullYear()} White Monkey Toys</span>
          </div>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="relative w-full max-w-[400px] animate-enter">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">Admin console</p>
          <h1 className="mt-3 font-display text-[32px] font-extrabold tracking-[-0.04em]">Sign in</h1>
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
            <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 h-12 w-full rounded-full">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-8 flex items-start gap-3 rounded-xl bg-subtle p-3.5 text-xs leading-relaxed text-muted">
            <Lock className="mt-px size-4 shrink-0 text-stone-400" aria-hidden />
            <p>Forgot your password? Ask a super admin to reset it from Settings → Admin users.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
