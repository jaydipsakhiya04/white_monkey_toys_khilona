'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Megaphone, Search as SearchIcon } from 'lucide-react';
import { useForm, useWatch, type UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, ErrorState, Skeleton } from '@/components/ui/feedback';
import { CharCount, Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { AdminUsers } from '@/features/admins/admin-users';
import { useAuth } from '@/features/auth/auth-provider';
import { nn, normalizeStoreInput, useStoreSettings, useUpdateStore } from '@/features/store/hooks';
import { getErrorMessage } from '@/lib/api-client';
import { applyApiFieldErrors } from '@/lib/form-errors';
import type { Store } from '@/types/api';

type FieldDef = {
  name: keyof Store;
  label: string;
  max: number;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  placeholder?: string;
  counter?: number;
};

type SectionDef = { id: string; title: string; description: string; icon: typeof FileText; fields: FieldDef[] };

const SECTIONS: SectionDef[] = [
  {
    id: 'content',
    title: 'Storefront content',
    description: 'Home page hero and the announcement bar shown across the store.',
    icon: Megaphone,
    fields: [
      { name: 'heroTitle', label: 'Hero title', max: 120, counter: 60, placeholder: 'Toys that spark joy' },
      { name: 'heroSubtitle', label: 'Hero subtitle', max: 300, multiline: true, rows: 2, counter: 160 },
      { name: 'heroCtaLabel', label: 'Hero button label', max: 40, counter: 24, placeholder: 'Shop now' },
      {
        name: 'announcement',
        label: 'Announcement bar',
        max: 200,
        counter: 120,
        hint: 'Leave empty to hide. e.g. “Free delivery on orders above ₹999”.',
      },
    ],
  },
  {
    id: 'policies',
    title: 'Policies',
    description: 'Plain text. Shown on the policy pages of the storefront.',
    icon: FileText,
    fields: [
      { name: 'shippingPolicy', label: 'Shipping & delivery policy', max: 20000, multiline: true, rows: 6 },
      { name: 'returnPolicy', label: 'Returns & refunds policy', max: 20000, multiline: true, rows: 6 },
      { name: 'privacyPolicy', label: 'Privacy policy', max: 20000, multiline: true, rows: 6 },
      { name: 'termsAndConditions', label: 'Terms & conditions', max: 20000, multiline: true, rows: 6 },
    ],
  },
  {
    id: 'seo',
    title: 'SEO defaults',
    description: 'Used for the home page and as a fallback when a page has no SEO text.',
    icon: SearchIcon,
    fields: [
      { name: 'seoTitle', label: 'Default title', max: 200, counter: 60 },
      { name: 'seoDescription', label: 'Default description', max: 500, multiline: true, rows: 3, counter: 160 },
    ],
  },
];

function SubsetForm({ section, store }: { section: SectionDef; store: Store }) {
  const update = useUpdateStore();
  const schema = z.object(Object.fromEntries(section.fields.map((f) => [f.name, z.string().max(f.max, `Keep it under ${f.max} characters`)])));
  type Values = Record<string, string>;
  const defaults: Values = Object.fromEntries(section.fields.map((f) => [f.name, nn(store[f.name] as string | null)]));
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const values = useWatch({ control });

  const onSubmit = handleSubmit(async (v) => {
    try {
      const saved = await update.mutateAsync(normalizeStoreInput(v));
      reset(Object.fromEntries(section.fields.map((f) => [f.name, nn(saved[f.name] as string | null)])));
      toast.success(`${section.title} saved`);
    } catch (err) {
      const applied = applyApiFieldErrors(err, setError as UseFormSetError<Values>, { knownFields: section.fields.map((f) => f.name) });
      toast.error(applied ? 'Please fix the highlighted fields' : getErrorMessage(err, 'Could not save'));
    }
  });

  const Icon = section.icon;
  return (
    <Card id={section.id} className="scroll-mt-20">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Icon className="size-4 text-muted" aria-hidden />
            {section.title}
          </span>
        }
        description={section.description}
      />
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 p-4 sm:p-5">
          {section.fields.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              hint={f.hint}
              error={errors[f.name]?.message}
              aside={f.counter ? <CharCount value={values[f.name]} max={f.counter} /> : undefined}
            >
              {f.multiline ? (
                <Textarea {...register(f.name)} rows={f.rows ?? 3} placeholder={f.placeholder} />
              ) : (
                <Input {...register(f.name)} placeholder={f.placeholder} />
              )}
            </Field>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3 sm:px-5">
          {isDirty && (
            <Button variant="ghost" size="sm" onClick={() => reset(defaults)} disabled={isSubmitting}>
              Discard
            </Button>
          )}
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function SettingsView() {
  const { admin } = useAuth();
  const { data, isLoading, isError, error, refetch } = useStoreSettings();
  const isSuper = admin?.role === 'SUPER_ADMIN';

  return (
    <>
      <PageHeader
        title="Settings"
        description="Storefront content, policies, SEO defaults and team access."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
      />
      <nav aria-label="Settings sections" className="mb-4 flex gap-1 overflow-x-auto scrollbar-none">
        {[...SECTIONS.map((s) => [s.id, s.title] as const), ...(isSuper ? ([['admins', 'Admin users']] as const) : [])].map(([id, title]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:bg-subtle hover:text-ink"
          >
            {title}
          </a>
        ))}
      </nav>
      <div className="flex max-w-4xl flex-col gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </>
        ) : isError || !data ? (
          <Card>
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          </Card>
        ) : (
          SECTIONS.map((s) => <SubsetForm key={s.id} section={s} store={data} />)
        )}
        {isSuper && <AdminUsers />}
      </div>
    </>
  );
}
