'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CalendarClock, ExternalLink, GalleryHorizontal, ImageIcon, Link2, Pencil, Plus, Smartphone, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Sheet } from '@/components/ui/dialog';
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Switch, SwitchField } from '@/components/ui/switch';
import { useCategories } from '@/features/categories/hooks';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { STOREFRONT_URL } from '@/lib/env';
import { qk } from '@/lib/query-keys';
import { bannerService } from '@/services';
import type { AdminBanner, BannerInput, BannerState } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';

const STATE: Record<BannerState, { label: string; tone: 'success' | 'info' | 'neutral' | 'warning' }> = {
  LIVE: { label: 'Live', tone: 'success' },
  SCHEDULED: { label: 'Scheduled', tone: 'info' },
  EXPIRED: { label: 'Ended', tone: 'warning' },
  HIDDEN: { label: 'Hidden', tone: 'neutral' },
};

const CUSTOM = '__custom__';

type Draft = {
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkChoice: string;
  linkUrl: string;
  ctaLabel: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

/** ISO → value for <input type="datetime-local"> (local time). */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

function useLinkTargets() {
  const { data } = useCategories({ limit: 100, sort: 'sortOrder' });
  return useMemo(() => {
    const base = [
      { value: '', label: 'No link' },
      { value: '/products', label: 'All products', group: 'Shop' },
      { value: '/products?sort=newest', label: 'New arrivals', group: 'Shop' },
      { value: '/products?featured=true', label: 'Featured products', group: 'Shop' },
      { value: '/products?sort=popular', label: 'Best sellers', group: 'Shop' },
      { value: '/wholesale', label: 'Wholesale enquiry', group: 'Shop' },
    ];
    const cats = (data?.items ?? []).filter((c) => c.isActive).map((c) => ({ value: `/category/${c.slug}`, label: c.name, group: 'Categories' }));
    return [...base, ...cats];
  }, [data]);
}

function toDraft(b: AdminBanner | null, targets: { value: string }[]): Draft {
  const link = b?.linkUrl ?? '';
  const known = targets.some((t) => t.value === link);
  return {
    title: b?.title ?? '',
    subtitle: b?.subtitle ?? '',
    imageUrl: b?.imageUrl ?? '',
    mobileImageUrl: b?.mobileImageUrl ?? '',
    linkChoice: known ? link : CUSTOM,
    linkUrl: link,
    ctaLabel: b?.ctaLabel ?? '',
    isActive: b?.isActive ?? true,
    startsAt: toLocalInput(b?.startsAt ?? null),
    endsAt: toLocalInput(b?.endsAt ?? null),
  };
}

function SlidePreview({ draft }: { draft: Pick<Draft, 'imageUrl' | 'title' | 'subtitle' | 'ctaLabel' | 'linkUrl'> }) {
  return (
    <div className="relative aspect-[7/2] overflow-hidden rounded-xl bg-stone-100 ring-1 ring-line">
      {draft.imageUrl ? (
        <img src={draft.imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 text-xs text-stone-400">
          <ImageIcon className="size-5" aria-hidden /> Banner image
        </div>
      )}
      {(draft.title || draft.subtitle) && (
        <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/60 via-black/20 to-transparent p-4">
          {draft.title && <p className="max-w-[70%] text-[15px] font-bold leading-tight text-white">{draft.title}</p>}
          {draft.subtitle && <p className="mt-1 line-clamp-2 max-w-[65%] text-[11px] text-white/85">{draft.subtitle}</p>}
          {draft.linkUrl && <span className="mt-2 w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-ink">{draft.ctaLabel || 'Shop now'}</span>}
        </div>
      )}
    </div>
  );
}

function BannerSheet({ banner, open, onClose }: { banner: AdminBanner | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const targets = useLinkTargets();
  const [draft, setDraft] = useState<Draft>(() => toDraft(banner, targets));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = useMutation({
    mutationFn: (body: BannerInput) => (banner ? bannerService.update(banner.id, body) : bannerService.create(body)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.banners });
      toast.success(banner ? 'Banner updated' : 'Banner added to the slider');
      onClose();
    },
    onError: (err) => {
      if (isApiError(err) && err.errors.length) {
        const next: Partial<Record<keyof Draft, string>> = {};
        for (const e of err.errors) if (e.field) next[e.field as keyof Draft] = e.message;
        setErrors(next);
      }
      toast.error(getErrorMessage(err, 'Could not save the banner'));
    },
  });

  const submit = () => {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (!draft.imageUrl) next.imageUrl = 'Upload a banner image';
    const link = draft.linkChoice === CUSTOM ? draft.linkUrl.trim() : draft.linkChoice;
    if (link && !/^(\/\S*|https?:\/\/\S+)$/.test(link)) next.linkUrl = 'Use a store path like /products or a full https:// link';
    if (draft.startsAt && draft.endsAt && new Date(draft.endsAt) <= new Date(draft.startsAt)) next.endsAt = 'Must be after the start';
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate({
      title: draft.title.trim() || null,
      subtitle: draft.subtitle.trim() || null,
      imageUrl: draft.imageUrl,
      mobileImageUrl: draft.mobileImageUrl || null,
      linkUrl: link || null,
      ctaLabel: draft.ctaLabel.trim() || null,
      isActive: draft.isActive,
      startsAt: fromLocalInput(draft.startsAt),
      endsAt: fromLocalInput(draft.endsAt),
    });
  };

  const effectiveLink = draft.linkChoice === CUSTOM ? draft.linkUrl : draft.linkChoice;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      dismissible={!save.isPending}
      title={banner ? 'Edit banner' : 'New banner'}
      description="Slides appear right after the hero on the storefront home page."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {banner ? 'Save changes' : 'Add banner'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">Preview</p>
          <SlidePreview draft={{ ...draft, linkUrl: effectiveLink }} />
        </div>

        <Field label="Banner image (required)" error={errors.imageUrl} hint="Wide image, 1680 × 480 px (7:2). Keep text on the left third and products on the right.">
          <ImageUploader value={draft.imageUrl || null} onChange={(url) => set({ imageUrl: url ?? '' })} folder="banners" aspect="wide" label="Upload banner" hint="JPG, PNG or WebP · up to 5 MB" />
        </Field>

        <Field label="Phone image (optional)" hint="1000 × 800 px (5:4), text area at the bottom. Without it, phones show the wide image.">
          <ImageUploader value={draft.mobileImageUrl || null} onChange={(url) => set({ mobileImageUrl: url ?? '' })} folder="banners" label="Upload" hint="Shown on phones" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" hint="Optional text on the slide. Leave empty if the image already has text." className="sm:col-span-2">
            <Input value={draft.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Diwali RC Mega Sale" />
          </Field>
          <Field label="Subtitle" className="sm:col-span-2">
            <Input value={draft.subtitle} maxLength={160} onChange={(e) => set({ subtitle: e.target.value })} placeholder="e.g. Up to 30% off hobby-grade RC cars" />
          </Field>
          <Field label="Opens when tapped" error={draft.linkChoice === CUSTOM ? undefined : errors.linkUrl}>
            <Select value={draft.linkChoice} onChange={(e) => set({ linkChoice: e.target.value })} searchPlaceholder="Search pages and categories…">
              {targets.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
              <option value={CUSTOM}>Custom link…</option>
            </Select>
          </Field>
          <Field label="Button label">
            <Input value={draft.ctaLabel} maxLength={30} onChange={(e) => set({ ctaLabel: e.target.value })} placeholder="Shop now" disabled={!effectiveLink} />
          </Field>
          {draft.linkChoice === CUSTOM && (
            <Field label="Custom link" error={errors.linkUrl} hint="A store path (/product/…, /products?…) or a full https:// link." className="sm:col-span-2">
              <Input value={draft.linkUrl} onChange={(e) => set({ linkUrl: e.target.value })} placeholder="/product/suzuki-jimny-rc-crawler" leading={<Link2 />} />
            </Field>
          )}
          <Field label="Show from" hint="Optional">
            <Input type="datetime-local" value={draft.startsAt} onChange={(e) => set({ startsAt: e.target.value })} />
          </Field>
          <Field label="Show until" hint="Optional" error={errors.endsAt}>
            <Input type="datetime-local" value={draft.endsAt} onChange={(e) => set({ endsAt: e.target.value })} invalid={!!errors.endsAt} />
          </Field>
        </div>

        <SwitchField label="Active" description="Hidden banners stay saved but don't appear on the storefront." checked={draft.isActive} onCheckedChange={(v) => set({ isActive: v })} />
      </div>
    </Sheet>
  );
}

function BannerCard({
  banner,
  index,
  total,
  onEdit,
  onDelete,
  onMove,
  onToggle,
  busy,
}: {
  banner: AdminBanner;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onToggle: (v: boolean) => void;
  busy: boolean;
}) {
  const state = STATE[banner.state];
  return (
    <Card className="flex flex-col overflow-hidden sm:flex-row">
      <div className="relative sm:w-[22rem] sm:shrink-0">
        <SlidePreview draft={{ imageUrl: banner.imageUrl, title: banner.title ?? '', subtitle: banner.subtitle ?? '', ctaLabel: banner.ctaLabel ?? '', linkUrl: banner.linkUrl ?? '' }} />
        <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-white/90 text-[11px] font-bold text-ink shadow-sm">{index + 1}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={state.tone}>{state.label}</Badge>
          {banner.mobileImageUrl && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Smartphone className="size-3.5" aria-hidden /> Phone image
            </span>
          )}
        </div>
        <p className="truncate text-sm font-semibold">{banner.title || <span className="font-normal italic text-muted">Image only (no text)</span>}</p>
        {banner.linkUrl && (
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <Link2 className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{banner.linkUrl}</span>
            {banner.linkUrl.startsWith('/') && STOREFRONT_URL && (
              <a href={`${STOREFRONT_URL}${banner.linkUrl}`} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:text-ink" aria-label="Open link">
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </p>
        )}
        {(banner.startsAt || banner.endsAt) && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            {banner.startsAt ? formatDateTime(banner.startsAt) : 'Now'} → {banner.endsAt ? formatDateTime(banner.endsAt) : 'no end'}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <label className="mr-auto inline-flex items-center gap-2 text-[13px] font-medium">
            <Switch size="sm" checked={banner.isActive} onCheckedChange={onToggle} disabled={busy} label={banner.isActive ? 'Hide banner' : 'Show banner'} />
            {banner.isActive ? 'Active' : 'Hidden'}
          </label>
          <Button size="xs" variant="ghost" onClick={() => onMove(-1)} disabled={busy || index === 0} aria-label="Move up">
            <ArrowUp />
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onMove(1)} disabled={busy || index === total - 1} aria-label="Move down">
            <ArrowDown />
          </Button>
          <Button size="xs" variant="secondary" onClick={onEdit}>
            <Pencil /> Edit
          </Button>
          <Button size="xs" variant="ghost" onClick={onDelete} className="text-danger hover:bg-danger-tint" aria-label="Delete banner">
            <Trash2 />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function BannersManager() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: qk.banners, queryFn: bannerService.list });
  const [editing, setEditing] = useState<AdminBanner | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminBanner | null>(null);

  const refresh = () => void qc.invalidateQueries({ queryKey: qk.banners });
  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => bannerService.update(id, { isActive }),
    onSuccess: (b) => {
      refresh();
      toast.success(b.isActive ? 'Banner shown on the storefront' : 'Banner hidden');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) => bannerService.reorder(ids),
    onSuccess: (list) => qc.setQueryData(qk.banners, list),
    onError: (err) => toast.error(getErrorMessage(err, 'Could not save the order')),
  });
  const remove = useMutation({
    mutationFn: (id: string) => bannerService.remove(id),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success('Banner deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const list = data ?? [];
  const move = (index: number, dir: -1 | 1) => {
    const ids = list.map((b) => b.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorder.mutate(ids);
  };
  const live = list.filter((b) => b.state === 'LIVE').length;

  return (
    <>
      <PageHeader
        title="Banners"
        description="Offer and announcement slides shown right after the hero on the home page. Reorder with the arrows; only active banners within their dates are shown."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Banners' }]}
        meta={list.length ? <Badge tone={live ? 'success' : 'neutral'}>{live} live</Badge> : undefined}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus /> Add banner
          </Button>
        }
      />
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={GalleryHorizontal}
            title="No banners yet"
            description="Add a slide for a new offer, festival sale or new arrivals. Customers can tap it to open a category, product or page."
            action={
              <Button onClick={() => setEditing('new')}>
                <Plus /> Add your first banner
              </Button>
            }
          />
        </Card>
      ) : (
        <ol className={cn('flex flex-col gap-4', reorder.isPending && 'opacity-70')}>
          {list.map((b, i) => (
            <li key={b.id}>
              <BannerCard
                banner={b}
                index={i}
                total={list.length}
                busy={reorder.isPending || toggle.isPending}
                onEdit={() => setEditing(b)}
                onDelete={() => setDeleting(b)}
                onMove={(dir) => move(i, dir)}
                onToggle={(v) => toggle.mutate({ id: b.id, isActive: v })}
              />
            </li>
          ))}
        </ol>
      )}

      {editing && <BannerSheet key={editing === 'new' ? 'new' : editing.id} banner={editing === 'new' ? null : editing} open onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => !remove.isPending && setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title="Delete this banner?"
        description="It will be removed from the storefront slider. This can't be undone."
        confirmLabel="Delete banner"
      />
    </>
  );
}
