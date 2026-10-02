'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, ExternalLink, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Controller, useForm, useWatch, type UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, ErrorState, Skeleton } from '@/components/ui/feedback';
import { CharCount, Field } from '@/components/ui/field';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Input, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SwitchField } from '@/components/ui/switch';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes';
import { getErrorMessage } from '@/lib/api-client';
import { applyApiFieldErrors } from '@/lib/form-errors';
import type { Store } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatPhone } from '@/utils/format';
import { isHttpUrl } from '@/utils/url';
import { nn, normalizeStoreInput, useStoreSettings, useUpdateStore } from './hooks';

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || isHttpUrl(v), 'Enter a full link starting with https://');
const time = z
  .string()
  .trim()
  .refine((v) => v === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), 'Use HH:mm (24-hour)');

const schema = z
  .object({
    name: z.string().trim().min(2, 'Store name is required').max(80, 'Too long'),
    tagline: z.string().max(120, 'Keep it under 120 characters'),
    description: z.string().max(1000, 'Too long'),
    logoUrl: z.string(),
    coverImageUrl: z.string(),
    phone: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\+?[\d\s-]{10,16}$/.test(v), 'Enter a valid phone number'),
    whatsapp: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\d{11,15}$/.test(v.replace(/[\s+-]/g, '')), 'Digits with country code, e.g. 919876543210'),
    email: z
      .string()
      .trim()
      .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email'),
    address: z.string().max(300, 'Too long'),
    city: z.string().max(60, 'Too long'),
    state: z.string().max(60, 'Too long'),
    pincode: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\d{6}$/.test(v), 'Pincode must be 6 digits'),
    googleMapLink: optionalUrl,
    instagram: optionalUrl,
    facebook: optionalUrl,
    youtube: optionalUrl,
    website: optionalUrl,
    openingTime: time,
    closingTime: time,
    workingDays: z.string().max(80, 'Too long'),
    isOpen: z.boolean(),
    closedMessage: z.string().max(300, 'Too long'),
  })
  .superRefine((v, ctx) => {
    if ((v.openingTime === '') !== (v.closingTime === '')) {
      ctx.addIssue({
        code: 'custom',
        path: [v.openingTime === '' ? 'openingTime' : 'closingTime'],
        message: 'Set both opening and closing time',
      });
    }
  });
type Values = z.infer<typeof schema>;

function toValues(s: Store): Values {
  return {
    name: s.name,
    tagline: nn(s.tagline),
    description: nn(s.description),
    logoUrl: nn(s.logoUrl),
    coverImageUrl: nn(s.coverImageUrl),
    phone: nn(s.phone),
    whatsapp: nn(s.whatsapp),
    email: nn(s.email),
    address: nn(s.address),
    city: nn(s.city),
    state: nn(s.state),
    pincode: nn(s.pincode),
    googleMapLink: nn(s.googleMapLink),
    instagram: nn(s.instagram),
    facebook: nn(s.facebook),
    youtube: nn(s.youtube),
    website: nn(s.website),
    openingTime: nn(s.openingTime).slice(0, 5),
    closingTime: nn(s.closingTime).slice(0, 5),
    workingDays: nn(s.workingDays),
    isOpen: s.isOpen,
    closedMessage: nn(s.closedMessage),
  };
}

const DAY_PRESETS = ['Monday – Saturday', 'Monday – Sunday', 'Monday – Friday', 'Tuesday – Sunday'];

function to12h(t: string): string {
  if (!/^\d{2}:\d{2}$/.test(t)) return t;
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function StorePage() {
  const { data, isLoading, isError, error, refetch } = useStoreSettings();
  if (isLoading)
    return (
      <div aria-busy="true" aria-label="Loading store settings">
        <Skeleton className="h-7 w-48" />
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  if (isError || !data)
    return (
      <Card>
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      </Card>
    );
  return <StoreForm key={data.updatedAt} store={data} />;
}

function StoreForm({ store }: { store: Store }) {
  const update = useUpdateStore();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(store), mode: 'onTouched' });
  const v = useWatch({ control });
  useUnsavedChangesGuard(isDirty && !update.isPending);


  const onSubmit = handleSubmit(
    async (values) => {
      const whatsappDigits = values.whatsapp.replace(/\D/g, '');
      try {
        const saved = await update.mutateAsync(normalizeStoreInput({ ...values, whatsapp: whatsappDigits }));
        reset(toValues(saved));
        toast.success('Store settings saved');
      } catch (err) {
        const applied = applyApiFieldErrors(err, setError as UseFormSetError<Values>, { knownFields: Object.keys(toValues(store)) });
        toast.error(applied ? 'Please fix the highlighted fields' : getErrorMessage(err, 'Could not save store settings'));
      }
    },
    () => toast.error('Please fix the highlighted fields'),
  );

  const hours = v.openingTime && v.closingTime ? `${to12h(v.openingTime)} – ${to12h(v.closingTime)}` : 'Hours not set';

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title="Store"
        description="How your shop appears to customers — identity, contact details, address and opening hours."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Store' }]}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader title="Identity" />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label="Store name" required error={errors.name?.message}>
                <Input {...register('name')} />
              </Field>
              <Field label="Tagline" error={errors.tagline?.message} aside={<CharCount value={v.tagline} max={120} />}>
                <Input {...register('tagline')} placeholder="e.g. Toys & games for every age" />
              </Field>
              <Field label="About the store" className="sm:col-span-2" error={errors.description?.message}>
                <Textarea {...register('description')} rows={3} />
              </Field>
              <div>
                <p className="mb-1.5 text-[13px] font-medium">Logo</p>
                <Controller
                  control={control}
                  name="logoUrl"
                  render={({ field }) => (
                    <ImageUploader value={field.value || null} onChange={(url) => field.onChange(url ?? '')} folder="store" label="Upload logo" hint="Square, at least 256 px" />
                  )}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[13px] font-medium">Cover image</p>
                <Controller
                  control={control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <ImageUploader
                      value={field.value || null}
                      onChange={(url) => field.onChange(url ?? '')}
                      folder="store"
                      aspect="wide"
                      label="Upload cover"
                      hint="Wide image, about 1600 × 700 px"
                    />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Contact" description="Shown on the storefront and used for order updates." />
            <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
              <Field label="Phone" error={errors.phone?.message}>
                <Input {...register('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" leading={<Phone />} />
              </Field>
              <Field
                label="WhatsApp number"
                error={errors.whatsapp?.message}
                hint="Include the country code without + or spaces, e.g. 919876543210."
              >
                <Input {...register('whatsapp')} type="tel" inputMode="numeric" placeholder="919876543210" leading={<MessageCircle />} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input {...register('email')} type="email" inputMode="email" autoComplete="email" placeholder="hello@khilona.in" leading={<Mail />} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Address" />
            <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
              <Field label="Street address" className="sm:col-span-3" error={errors.address?.message}>
                <Textarea {...register('address')} rows={2} autoComplete="street-address" />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <Input {...register('city')} autoComplete="address-level2" />
              </Field>
              <Field label="State" error={errors.state?.message}>
                <Input {...register('state')} autoComplete="address-level1" />
              </Field>
              <Field label="Pincode" error={errors.pincode?.message}>
                <Input {...register('pincode')} inputMode="numeric" maxLength={6} autoComplete="postal-code" />
              </Field>
              <Field label="Google Maps link" className="sm:col-span-3" error={errors.googleMapLink?.message} hint="Open your shop in Google Maps → Share → Copy link.">
                <Input
                  {...register('googleMapLink')}
                  type="url"
                  inputMode="url"
                  placeholder="https://maps.app.goo.gl/…"
                  leading={<MapPin />}
                  trailing={
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={!v.googleMapLink || !isHttpUrl(v.googleMapLink)}
                      onClick={() => v.googleMapLink && window.open(v.googleMapLink, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink /> Test link
                    </Button>
                  }
                  inputClassName="pr-28"
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Opening hours" />
            <div className="flex flex-col gap-4 p-4 sm:p-5">
              <Controller
                control={control}
                name="isOpen"
                render={({ field }) => (
                  <SwitchField
                    id="store-open"
                    label="Store is accepting orders"
                    description="Turn off to pause ordering (e.g. holidays). Customers see the closed message instead of checkout."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Opens at" error={errors.openingTime?.message}>
                  <Input {...register('openingTime')} type="time" />
                </Field>
                <Field label="Closes at" error={errors.closingTime?.message}>
                  <Input {...register('closingTime')} type="time" />
                </Field>
                <Field label="Working days" error={errors.workingDays?.message}>
                  <Input {...register('workingDays')} list="working-days-presets" placeholder="Monday – Saturday" />
                </Field>
                <datalist id="working-days-presets">
                  {DAY_PRESETS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DAY_PRESETS.map((d) => (
                  <Button key={d} variant="secondary" size="xs" onClick={() => setValue('workingDays', d, { shouldDirty: true })}>
                    {d}
                  </Button>
                ))}
              </div>
              <Field label="Closed message" error={errors.closedMessage?.message} hint="Shown when the store is switched off." aside={<CharCount value={v.closedMessage} max={300} />}>
                <Textarea {...register('closedMessage')} rows={2} placeholder="We're closed for Diwali and will be back on 4 Nov." />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Social & website" />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              {(
                [
                  ['instagram', 'Instagram', 'https://instagram.com/khilona'],
                  ['facebook', 'Facebook', 'https://facebook.com/khilona'],
                  ['youtube', 'YouTube', 'https://youtube.com/@khilona'],
                  ['website', 'Website', 'https://khilona.in'],
                ] as const
              ).map(([key, label, ph]) => (
                <Field key={key} label={label} error={errors[key]?.message}>
                  <Input {...register(key)} type="url" inputMode="url" placeholder={ph} leading={<Globe />} />
                </Field>
              ))}
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/7] bg-subtle">
              {v.coverImageUrl ? (
                <img src={v.coverImageUrl} alt="" className="size-full object-cover" width={680} height={300} />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-stone-400">No cover image</div>
              )}
              <div className="absolute -bottom-7 left-4 size-14 overflow-hidden rounded-xl border-2 border-surface bg-surface shadow-xs">
                {v.logoUrl ? (
                  <img src={v.logoUrl} alt="" className="size-full object-cover" width={56} height={56} />
                ) : (
                  <div className="flex size-full items-center justify-center bg-brand text-lg font-bold text-white">
                    {(v.name || 'K').slice(0, 1)}
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 pb-4 pt-9">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{v.name || 'Store name'}</p>
                  {v.tagline && <p className="text-[13px] text-muted">{v.tagline}</p>}
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                    v.isOpen ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200',
                  )}
                >
                  {v.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              {!v.isOpen && v.closedMessage && (
                <p className="mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-800">{v.closedMessage}</p>
              )}
              <ul className="mt-3 space-y-1.5 text-[13px] text-ink-soft">
                <li className="flex gap-2">
                  <Clock className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
                  <span>
                    {hours}
                    {v.workingDays ? ` · ${v.workingDays}` : ''}
                  </span>
                </li>
                {v.phone && (
                  <li className="flex gap-2">
                    <Phone className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
                    <span className="tabular">{formatPhone(v.phone)}</span>
                  </li>
                )}
                {(v.address || v.city) && (
                  <li className="flex gap-2">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
                    <span>{[v.address, v.city, v.state, v.pincode].filter(Boolean).join(', ')}</span>
                  </li>
                )}
              </ul>
            </div>
          </Card>
        </aside>
      </div>

      <div className="sticky bottom-16 z-20 -mx-4 mt-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 md:bottom-0 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-[13px] text-muted sm:block" aria-live="polite">
            {isDirty ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <div className="flex flex-1 gap-2 sm:flex-none">
            <Button variant="secondary" onClick={() => reset(toValues(store))} disabled={!isDirty || isSubmitting} className="flex-1 sm:flex-none">
              Discard
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="flex-1 sm:flex-none">
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

