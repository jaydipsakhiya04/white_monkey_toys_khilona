'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Eye, EyeOff, MessageSquareText, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, EmptyState, ErrorState, Skeleton, Thumb } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Tabs } from '@/components/ui/tabs';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useUrlState } from '@/hooks/use-url-state';
import { getErrorMessage } from '@/lib/api-client';
import { storefrontProductUrl } from '@/lib/env';
import { qk } from '@/lib/query-keys';
import { reviewService } from '@/services';
import { REVIEW_STATUSES, type AdminReview, type ReviewStatus } from '@/types/api';
import { formatDate } from '@/utils/format';

const KEYS = ['status', 'rating', 'search', 'page'] as const;
const STATUS_LABEL: Record<ReviewStatus, string> = { PENDING: 'Pending', APPROVED: 'Published', HIDDEN: 'Hidden' };
const STATUS_TONE: Record<ReviewStatus, 'warning' | 'success' | 'neutral'> = { PENDING: 'warning', APPROVED: 'success', HIDDEN: 'neutral' };

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={i <= value ? 'size-3.5 fill-amber-400 text-amber-400' : 'size-3.5 fill-stone-200 text-stone-200'} aria-hidden />
      ))}
    </span>
  );
}

function ReviewRow({ review }: { review: AdminReview }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (status: 'APPROVED' | 'HIDDEN') => reviewService.setStatus(review.id, status),
    onSuccess: (_, status) => {
      void qc.invalidateQueries({ queryKey: qk.reviews.all });
      toast.success(status === 'HIDDEN' ? 'Review hidden from the storefront' : 'Review published');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not update the review')),
  });
  const productUrl = storefrontProductUrl(review.product.slug);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
      <Thumb src={review.product.thumbnailUrl} alt={review.product.name} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Stars value={review.rating} />
          <Badge tone={STATUS_TONE[review.status]}>{STATUS_LABEL[review.status]}</Badge>
          {review.verifiedPurchase && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
              <BadgeCheck className="size-3.5" aria-hidden /> Verified purchase
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm font-semibold text-ink">
          {productUrl ? (
            <a href={productUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {review.product.name}
            </a>
          ) : (
            review.product.name
          )}
        </p>
        {review.comment ? (
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">{review.comment}</p>
        ) : (
          <p className="mt-1 text-sm italic text-muted">Rating only, no written review.</p>
        )}
        <p className="mt-2 text-xs text-muted">
          {review.customer.name} · {formatDate(review.createdAt)} · Order{' '}
          <Link href={`/orders/${review.order.id}`} className="font-medium text-ink hover:underline">
            {review.order.orderNumber}
          </Link>
          {review.updatedAt !== review.createdAt && ' · edited'}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {review.status !== 'APPROVED' && (
          <Button size="sm" variant="secondary" loading={m.isPending && m.variables === 'APPROVED'} onClick={() => m.mutate('APPROVED')}>
            <Eye /> {review.status === 'PENDING' ? 'Approve' : 'Publish'}
          </Button>
        )}
        {review.status !== 'HIDDEN' && (
          <Button size="sm" variant="ghost" loading={m.isPending && m.variables === 'HIDDEN'} onClick={() => m.mutate('HIDDEN')}>
            <EyeOff /> Hide
          </Button>
        )}
      </div>
    </li>
  );
}

export function ReviewsList() {
  const { values, set } = useUrlState(KEYS);
  const status = (REVIEW_STATUSES as readonly string[]).includes(values.status ?? '') ? (values.status as ReviewStatus) : undefined;
  const rating = Number(values.rating) >= 1 && Number(values.rating) <= 5 ? Number(values.rating) : undefined;
  const page = Math.max(1, Number(values.page) || 1);
  const [searchInput, setSearchInput] = useState(values.search ?? '');
  const debounced = useDebouncedValue(searchInput, 350);
  useEffect(() => {
    if ((values.search ?? '') !== debounced.trim()) set({ search: debounced.trim() || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const params = useMemo(() => ({ status, rating, search: values.search, page, limit: 20 }), [status, rating, values.search, page]);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.reviews.list(params),
    queryFn: () => reviewService.list(params),
    placeholderData: keepPreviousData,
  });
  const counts = data?.statusCounts;
  const tabs = [
    { value: 'ALL', label: 'All', count: counts?.ALL },
    ...REVIEW_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], count: counts?.[s] })),
  ];

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Verified-purchase reviews from customers with delivered orders. You can publish or hide reviews — ratings and text can't be edited."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reviews' }]}
      />
      <Tabs label="Filter reviews by status" items={tabs} value={status ?? 'ALL'} onChange={(v) => set({ status: v === 'ALL' ? undefined : v })} className="mb-4" />
      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:p-4">
          <Input
            type="search"
            aria-label="Search reviews"
            placeholder="Search product, customer, order or text"
            leading={<Search />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="sm:max-w-sm sm:flex-1"
          />
          <Select aria-label="Filter by rating" value={rating ?? ''} onChange={(e) => set({ rating: e.target.value || undefined })} wrapperClassName="sm:w-40">
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} star{r > 1 ? 's' : ''}
              </option>
            ))}
          </Select>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title={status || rating || values.search ? 'No matching reviews' : 'No reviews yet'}
            description="Customers can review products once their order is delivered."
          />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.items.map((r) => (
                <ReviewRow key={r.id} review={r} />
              ))}
            </ul>
            <Pagination meta={data.meta} onPageChange={(p) => set({ page: p > 1 ? String(p) : undefined })} noun="reviews" />
          </>
        )}
      </Card>
    </>
  );
}
