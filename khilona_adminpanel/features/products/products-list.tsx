'use client';

import {
  Archive,
  ExternalLink,
  Eye,
  EyeOff,
  MoreHorizontal,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge, StockBadge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/dialog';
import { DropdownMenu, type MenuEntry } from '@/components/ui/dropdown-menu';
import { Card, EmptyState, ErrorState, Skeleton, Thumb } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { CategorySelect } from '@/features/categories/category-select';
import { useCategoryOptions } from '@/features/categories/hooks';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useUrlState } from '@/hooks/use-url-state';
import { getErrorMessage } from '@/lib/api-client';
import { storefrontProductUrl } from '@/lib/env';
import type { AdminProductListItem, BulkProductAction, ProductListParams, ProductSort } from '@/types/api';
import { cn } from '@/utils/cn';
import { discountPercent, formatCurrency } from '@/utils/format';
import { useBulkProducts, useDeleteProduct, useProducts, useToggleProductStatus } from './hooks';

const KEYS = ['search', 'categoryId', 'status', 'stock', 'featured', 'sort', 'page'] as const;
const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'stock_asc', label: 'Stock: lowest first' },
  { value: 'sortOrder', label: 'Manual order' },
];

const BULK_COPY: Record<BulkProductAction, { title: string; body: string; label: string; done: string; danger?: boolean }> = {
  activate: { title: 'Activate products', body: 'Selected products will become visible on the storefront.', label: 'Activate', done: 'activated' },
  deactivate: {
    title: 'Deactivate products',
    body: 'Selected products will be hidden from the storefront. Existing orders are not affected.',
    label: 'Deactivate',
    done: 'deactivated',
  },
  feature: { title: 'Feature products', body: 'Selected products will be highlighted on the storefront.', label: 'Feature', done: 'featured' },
  unfeature: { title: 'Remove from featured', body: 'Selected products will no longer be highlighted.', label: 'Unfeature', done: 'unfeatured' },
  delete: {
    title: 'Delete products',
    body: 'Products that appear in past orders are archived (hidden and removed from the catalogue, but kept for order history). The rest are permanently deleted. This cannot be undone.',
    label: 'Delete',
    done: 'deleted or archived',
    danger: true,
  },
};

function PriceCell({ p }: { p: AdminProductListItem }) {
  const off = discountPercent(p.price, p.salePrice);
  return (
    <div className="tabular">
      <p className="font-semibold">{formatCurrency(p.salePrice ?? p.price)}</p>
      {p.salePrice !== null && (
        <p className="text-xs text-muted">
          <s>{formatCurrency(p.price)}</s> <span className="text-success">{off}% off</span>
        </p>
      )}
    </div>
  );
}

export function ProductsList() {
  const { values, set, reset } = useUrlState(KEYS);
  const page = Math.max(1, Number(values.page) || 1);
  const sort = (SORTS.some((s) => s.value === values.sort) ? values.sort : 'newest') as ProductSort;

  const [searchInput, setSearchInput] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  useEffect(() => {
    if ((values.search ?? '') !== debouncedSearch.trim()) set({ search: debouncedSearch.trim() || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  useEffect(() => {
    setSearchInput((cur) => (cur.trim() === (values.search ?? '') ? cur : values.search ?? ''));
  }, [values.search]);

  const params: ProductListParams = useMemo(
    () => ({
      search: values.search,
      categoryId: values.categoryId,
      status: values.status === 'active' || values.status === 'inactive' ? values.status : undefined,
      stock: values.stock === 'in' || values.stock === 'low' || values.stock === 'out' ? values.stock : undefined,
      featured: values.featured === 'true' || values.featured === 'false' ? values.featured : undefined,
      sort,
      page,
      limit: 20,
    }),
    [values.search, values.categoryId, values.status, values.stock, values.featured, sort, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useProducts(params);
  const { data: categoryOptions = [] } = useCategoryOptions();
  const toggle = useToggleProductStatus();
  const bulk = useBulkProducts();
  const del = useDeleteProduct();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkProductAction | null>(null);
  const [deleting, setDeleting] = useState<AdminProductListItem | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  // drop selections that are no longer visible
  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(items.map((i) => i.id));
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hasFilters = !!(values.search || values.categoryId || values.status || values.stock || values.featured);
  const clearAll = () => {
    setSearchInput('');
    reset();
  };

  const runBulk = () => {
    if (!bulkAction) return;
    const ids = [...selected];
    bulk.mutate(
      { ids, action: bulkAction },
      {
        onSuccess: (res) => {
          toast.success(`${res.affected} product${res.affected === 1 ? '' : 's'} ${BULK_COPY[bulkAction].done}`);
          setSelected(new Set());
          setBulkAction(null);
        },
        onError: (err) => toast.error(getErrorMessage(err, 'Bulk action failed')),
      },
    );
  };

  const runDelete = () => {
    if (!deleting) return;
    del.mutate(deleting.id, {
      onSuccess: (res) => {
        toast.success(
          res.mode === 'archived'
            ? `“${deleting.name}” archived — it's referenced by past orders, so it was hidden instead of erased.`
            : `“${deleting.name}” deleted permanently.`,
        );
        setDeleting(null);
      },
      onError: (err) => toast.error(getErrorMessage(err, 'Could not delete the product')),
    });
  };

  const rowMenu = (p: AdminProductListItem): MenuEntry[] => {
    const storeUrl = storefrontProductUrl(p.slug);
    const entries: MenuEntry[] = [{ label: 'Edit', icon: <Pencil />, href: `/products/${p.id}` }];
    if (storeUrl) entries.push({ label: 'View on store', icon: <ExternalLink />, href: storeUrl, external: true, disabled: !p.isActive });
    entries.push(
      {
        label: p.isActive ? 'Deactivate' : 'Activate',
        icon: p.isActive ? <EyeOff /> : <Eye />,
        onSelect: () => toggle.mutate({ id: p.id, patch: { isActive: !p.isActive } }),
      },
      { type: 'separator' },
      { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: () => setDeleting(p) },
    );
    return entries;
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Your catalogue — prices, stock, photos and visibility."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Products' }]}
        actions={
          <Link href="/products/new" className={buttonClasses({ size: 'md' })}>
            <PackagePlus />
            New product
          </Link>
        }
      />

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:p-4">
          <div className="flex flex-col gap-2 lg:flex-row">
            <Input
              type="search"
              aria-label="Search products"
              placeholder="Search name or SKU"
              leading={<Search />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="lg:max-w-xs lg:flex-1"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-1 lg:flex-wrap">
              <CategorySelect
                aria-label="Filter by category"
                options={categoryOptions}
                placeholder="All categories"
                value={values.categoryId ?? ''}
                onChange={(e) => set({ categoryId: e.target.value || undefined })}
                wrapperClassName="col-span-2 sm:col-span-1 lg:w-44"
              />
              <Select
                aria-label="Filter by status"
                value={values.status ?? ''}
                onChange={(e) => set({ status: e.target.value || undefined })}
                wrapperClassName="lg:w-32"
              >
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Select
                aria-label="Filter by stock"
                value={values.stock ?? ''}
                onChange={(e) => set({ stock: e.target.value || undefined })}
                wrapperClassName="lg:w-32"
              >
                <option value="">Any stock</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </Select>
              <Select
                aria-label="Filter by featured"
                value={values.featured ?? ''}
                onChange={(e) => set({ featured: e.target.value || undefined })}
                wrapperClassName="lg:w-36"
              >
                <option value="">Featured: any</option>
                <option value="true">Featured only</option>
                <option value="false">Not featured</option>
              </Select>
              <Select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => set({ sort: e.target.value === 'newest' ? undefined : e.target.value })}
                wrapperClassName="lg:w-44"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    Sort: {s.label}
                  </option>
                ))}
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="md" onClick={clearAll} className="col-span-2 sm:col-span-1">
                  <X />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {selected.size > 0 && (
          <div
            role="region"
            aria-label="Bulk actions"
            className="sticky top-14 z-20 flex flex-wrap items-center gap-2 border-b border-line bg-brand-tint/70 px-3 py-2 backdrop-blur-sm sm:px-4 md:top-0"
          >
            <span className="mr-1 text-[13px] font-medium tabular">{selected.size} selected</span>
            <Button size="xs" variant="secondary" onClick={() => setBulkAction('activate')}>
              <Eye /> Activate
            </Button>
            <Button size="xs" variant="secondary" onClick={() => setBulkAction('deactivate')}>
              <EyeOff /> Deactivate
            </Button>
            <Button size="xs" variant="secondary" onClick={() => setBulkAction('feature')}>
              <Star /> Feature
            </Button>
            <Button size="xs" variant="secondary" onClick={() => setBulkAction('unfeature')}>
              <StarOff /> Unfeature
            </Button>
            <Button size="xs" variant="danger" onClick={() => setBulkAction('delete')}>
              <Trash2 /> Delete
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setSelected(new Set())} className="ml-auto">
              Clear selection
            </Button>
          </div>
        )}

        {isLoading ? (
          <ProductsSkeleton />
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="No products found"
              description="No products match these filters. Try clearing some of them."
              action={
                <Button variant="secondary" size="sm" onClick={clearAll}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Add your first toy or game to start selling."
              action={
                <Link href="/products/new" className={buttonClasses({ size: 'sm' })}>
                  <PackagePlus /> New product
                </Link>
              }
            />
          )
        ) : (
          <div className={cn('transition-opacity', isFetching && 'opacity-70')}>
            <div className="hidden xl:block">
              <Table>
                <THead>
                  <tr>
                    <TH className="w-10">
                      <Checkbox
                        aria-label="Select all products on this page"
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleAll}
                      />
                    </TH>
                    <TH>Product</TH>
                    <TH>Category</TH>
                    <TH>Price</TH>
                    <TH>Stock</TH>
                    <TH className="text-center">Active</TH>
                    <TH className="text-center">Featured</TH>
                    <TH className="w-12">
                      <span className="sr-only">Actions</span>
                    </TH>
                  </tr>
                </THead>
                <TBody>
                  {items.map((p) => (
                    <TR key={p.id} className={selected.has(p.id) ? 'bg-brand-tint/40 hover:bg-brand-tint/50' : ''}>
                      <TD>
                        <Checkbox aria-label={`Select ${p.name}`} checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                      </TD>
                      <TD>
                        <div className="flex items-center gap-3">
                          <Thumb src={p.thumbnailUrl} alt={p.name} size={40} />
                          <div className="min-w-0">
                            <Link href={`/products/${p.id}`} className="block max-w-[280px] truncate font-medium hover:text-brand">
                              {p.name}
                            </Link>
                            <p className="flex items-center gap-1.5 text-xs text-muted">
                              <span className="tabular">{p.sku ? `SKU ${p.sku}` : 'No SKU'}</span>
                              {p.hasVariants && (
                                <Badge className="h-[18px] px-1.5 text-[10px]">
                                  {p.variantsCount} variant{p.variantsCount === 1 ? '' : 's'}
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD className="max-w-[160px] truncate text-ink-soft">{p.category.name}</TD>
                      <TD>
                        <PriceCell p={p} />
                      </TD>
                      <TD>
                        <StockBadge status={p.stockStatus} stock={p.stock} />
                      </TD>
                      <TD className="text-center">
                        <Switch
                          size="sm"
                          checked={p.isActive}
                          label={`${p.name} active`}
                          onCheckedChange={(v) => toggle.mutate({ id: p.id, patch: { isActive: v } })}
                        />
                      </TD>
                      <TD className="text-center">
                        <FeaturedToggle p={p} onToggle={(v) => toggle.mutate({ id: p.id, patch: { isFeatured: v } })} />
                      </TD>
                      <TD>
                        <DropdownMenu label={`Actions for ${p.name}`} trigger={<MoreHorizontal />} items={rowMenu(p)} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>

            <div className="flex items-center gap-3 border-b border-line px-4 py-2 xl:hidden">
              <Checkbox id="select-all-mobile" checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
              <label htmlFor="select-all-mobile" className="text-xs text-muted">
                Select all on this page
              </label>
            </div>
            <ul className="divide-y divide-line xl:hidden">
              {items.map((p) => (
                <li key={p.id} className={cn('flex gap-3 px-4 py-3', selected.has(p.id) && 'bg-brand-tint/40')}>
                  <Checkbox
                    aria-label={`Select ${p.name}`}
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    className="mt-3"
                  />
                  <Thumb src={p.thumbnailUrl} alt={p.name} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/products/${p.id}`} className="line-clamp-2 text-[13px] font-semibold hover:text-brand">
                          {p.name}
                        </Link>
                        <p className="truncate text-xs text-muted">
                          {p.category.name}
                          {p.sku ? ` · ${p.sku}` : ''}
                        </p>
                      </div>
                      <DropdownMenu label={`Actions for ${p.name}`} trigger={<MoreHorizontal />} items={rowMenu(p)} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold tabular">{formatCurrency(p.salePrice ?? p.price)}</span>
                      {p.salePrice !== null && <s className="text-xs text-muted tabular">{formatCurrency(p.price)}</s>}
                      <StockBadge status={p.stockStatus} stock={p.stock} />
                    </div>
                    <div className="mt-2.5 flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-muted">
                        <Switch
                          size="sm"
                          checked={p.isActive}
                          label={`${p.name} active`}
                          onCheckedChange={(v) => toggle.mutate({ id: p.id, patch: { isActive: v } })}
                        />
                        Active
                      </label>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <FeaturedToggle p={p} onToggle={(v) => toggle.mutate({ id: p.id, patch: { isFeatured: v } })} />
                        Featured
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {data && (
              <Pagination meta={data.meta} noun="products" onPageChange={(pg) => set({ page: pg > 1 ? String(pg) : undefined })} />
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!bulkAction}
        onClose={() => setBulkAction(null)}
        onConfirm={runBulk}
        loading={bulk.isPending}
        tone={bulkAction && BULK_COPY[bulkAction].danger ? 'danger' : 'primary'}
        title={bulkAction ? `${BULK_COPY[bulkAction].title} (${selected.size})` : ''}
        description={bulkAction ? BULK_COPY[bulkAction].body : undefined}
        confirmLabel={bulkAction ? `${BULK_COPY[bulkAction].label} ${selected.size}` : 'Confirm'}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={runDelete}
        loading={del.isPending}
        title={`Delete “${deleting?.name ?? ''}”?`}
        confirmLabel="Delete product"
      >
        <div className="space-y-2 text-[13px] leading-relaxed text-ink-soft">
          <p className="flex gap-2">
            <Trash2 className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            <span>
              <strong className="text-ink">Never ordered:</strong> the product, its photos and variants are deleted permanently.
            </span>
          </p>
          <p className="flex gap-2">
            <Archive className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <span>
              <strong className="text-ink">Appears in past orders:</strong> it&apos;s archived instead — removed from the catalogue
              and storefront, but kept so order history stays accurate.
            </span>
          </p>
        </div>
      </ConfirmDialog>
    </>
  );
}

function FeaturedToggle({ p, onToggle }: { p: AdminProductListItem; onToggle: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={p.isFeatured}
      aria-label={p.isFeatured ? `Remove ${p.name} from featured` : `Feature ${p.name}`}
      onClick={() => onToggle(!p.isFeatured)}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-subtle',
        p.isFeatured ? 'text-amber-500' : 'text-stone-300 hover:text-stone-500',
      )}
    >
      <Star className={cn('size-[18px]', p.isFeatured && 'fill-current')} aria-hidden />
    </button>
  );
}

function ProductsSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-5 w-20 sm:block" />
          <Skeleton className="h-5 w-10" />
        </li>
      ))}
    </ul>
  );
}
