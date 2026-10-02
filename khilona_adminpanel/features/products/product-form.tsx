'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Info, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge, StockBadge } from '@/components/ui/badge';
import { Button, buttonClasses } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Card, CardHeader, ErrorState, Skeleton } from '@/components/ui/feedback';
import { CharCount, Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SwitchField } from '@/components/ui/switch';
import { CategorySelect } from '@/features/categories/category-select';
import { useCategoryOptions } from '@/features/categories/hooks';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { storefrontProductUrl } from '@/lib/env';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { qk } from '@/lib/query-keys';
import { productService } from '@/services';
import type { AdminProductDetail } from '@/types/api';
import { cn } from '@/utils/cn';
import { discountPercent, formatDateTime } from '@/utils/format';
import { slugify } from '@/utils/slugify';
import { useDeleteProduct, useInvalidateProducts, useProduct } from './hooks';
import { ProductMedia } from './product-media';
import {
  emptyProductForm,
  formToInput,
  productFormSchema,
  productToForm,
  type ProductFormValues,
} from './product-schema';
import { ProductVariants } from './product-variants';

function Section({
  id,
  title,
  description,
  children,
  action,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader title={title} description={description} action={action} />
      <div className="p-4 sm:p-5">{children}</div>
    </Card>
  );
}

const SECTIONS = [
  ['basic', 'Basic info'],
  ['media', 'Media'],
  ['pricing', 'Pricing'],
  ['inventory', 'Inventory'],
  ['variants', 'Variants'],
  ['specs', 'Specifications'],
  ['seo', 'SEO'],
] as const;

const KNOWN_FIELDS = [
  'name',
  'slug',
  'categoryId',
  'shortDescription',
  'description',
  'images',
  'price',
  'salePrice',
  'sku',
  'stock',
  'lowStockThreshold',
  'options',
  'variants',
  'specifications',
  'seoTitle',
  'seoDescription',
  'isActive',
  'isFeatured',
  'sortOrder',
];

export function ProductFormPage({ id }: { id?: string }) {
  const { data, isLoading, isError, error, refetch } = useProduct(id);
  if (id && isLoading) return <FormSkeleton />;
  if (id && (isError || !data)) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <Card>
        <ErrorState
          title={notFound ? 'Product not found' : "Couldn't load this product"}
          message={notFound ? 'It may have been deleted.' : getErrorMessage(error)}
          onRetry={notFound ? undefined : () => void refetch()}
        />
        <div className="flex justify-center pb-8">
          <Link href="/products" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            <ArrowLeft /> Back to products
          </Link>
        </div>
      </Card>
    );
  }
  return <ProductForm key={data?.id ?? 'new'} product={data} />;
}

function ProductForm({ product }: { product?: AdminProductDetail }) {
  const router = useRouter();
  const qc = useQueryClient();
  const invalidate = useInvalidateProducts();
  const isEdit = !!product;
  const { data: categoryOptions = [], isLoading: categoriesLoading } = useCategoryOptions();
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = useDeleteProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? productToForm(product) : emptyProductForm,
    mode: 'onTouched',
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  const specs = useFieldArray({ control, name: 'specifications' });
  const [price, salePrice, options, variants, seoTitle, seoDescription, shortDescription, name] = useWatch({
    control,
    name: ['price', 'salePrice', 'options', 'variants', 'seoTitle', 'seoDescription', 'shortDescription', 'name'],
  });
  const hasVariants = (options ?? []).some((o) => o.name.trim() && o.values.length > 0) && (variants ?? []).length > 0;
  const off = discountPercent(Number(price) || 0, salePrice ? Number(salePrice) : null);
  const variantStock = (variants ?? []).reduce((s, v) => s + (Number(v.stock) || 0), 0);

  useUnsavedChangesGuard((isDirty || uploading) && !isSubmitting);

  const onUploadingChange = useCallback((u: boolean) => setUploading(u), []);

  const onSubmit = handleSubmit(
    async (values) => {
      if (uploading) {
        toast.error('Please wait for image uploads to finish');
        return;
      }
      const input = formToInput(values);
      try {
        const saved = product ? await productService.update(product.id, input) : await productService.create(input);
        qc.setQueryData(qk.products.detail(saved.id), saved);
        invalidate();
        reset(productToForm(saved));
        toast.success(product ? `“${saved.name}” saved` : `“${saved.name}” created`);
        router.push('/products');
      } catch (err) {
        const applied = applyApiFieldErrors(err, setError, { knownFields: KNOWN_FIELDS });
        if (isApiError(err) && err.status === 409 && !applied) {
          toast.error(err.message);
        } else {
          toast.error(
            applied ? 'Please fix the highlighted fields' : getErrorMessage(err, 'Could not save the product'),
            applied && isApiError(err) ? { description: err.message } : undefined,
          );
        }
      }
    },
    () => {
      toast.error('Please fix the highlighted fields');
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
    },
  );

  const nameField = register('name', {
    onChange: (e) => {
      if (!slugTouched) setValue('slug', slugify(e.target.value), { shouldDirty: true });
    },
  });

  const storeUrl = product ? storefrontProductUrl(product.slug) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="relative">
      <PageHeader
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: product ? product.name : 'New product' },
        ]}
        title={product ? 'Edit product' : 'New product'}
        meta={
          product && (
            <>
              <Badge tone={product.isActive ? 'success' : 'neutral'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
              <StockBadge status={product.stockStatus} stock={product.stock} />
            </>
          )
        }
        description={
          product
            ? `Last updated ${formatDateTime(product.updatedAt)}${product.ordersCount ? ` · in ${product.ordersCount} order${product.ordersCount === 1 ? '' : 's'}` : ''}`
            : 'Add a toy or game to your catalogue.'
        }
        actions={
          <>
            {storeUrl && product?.isActive && (
              <a href={storeUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                <ExternalLink /> View on store
              </a>
            )}
            {product && (
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(true)} className="text-danger">
                <Trash2 /> Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section id="basic" title="Basic info">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={errors.name?.message} className="sm:col-span-2">
                <Input {...nameField} placeholder="e.g. Wooden Stacking Rainbow" maxLength={140} autoComplete="off" />
              </Field>
              <Field
                label="URL slug"
                error={errors.slug?.message}
                hint={slugTouched ? 'Custom slug. Clear it to generate one from the name.' : 'Generated from the name — edit to customise.'}
              >
                <Input
                  {...register('slug', {
                    onChange: (e) => setSlugTouched(e.target.value !== ''),
                  })}
                  placeholder="wooden-stacking-rainbow"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </Field>
              <Field label="Category" required htmlFor="categoryId" error={errors.categoryId?.message}>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field, fieldState }) => (
                    <CategorySelect
                      id="categoryId"
                      ref={field.ref}
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      invalid={!!fieldState.error}
                      aria-describedby={fieldState.error ? 'categoryId-error' : undefined}
                      options={categoryOptions}
                      disabled={categoriesLoading}
                      placeholder={categoriesLoading ? 'Loading categories…' : 'Select a category'}
                    />
                  )}
                />
              </Field>
              <Field
                label="Short description"
                className="sm:col-span-2"
                error={errors.shortDescription?.message}
                aside={<CharCount value={shortDescription} max={300} />}
                hint="Shown on product cards and at the top of the product page."
              >
                <Textarea {...register('shortDescription')} rows={2} maxLength={300} />
              </Field>
              <Field label="Description" className="sm:col-span-2" error={errors.description?.message} hint="Plain text. Line breaks are kept.">
                <Textarea {...register('description')} rows={7} />
              </Field>
            </div>
          </Section>

          <Section id="media" title="Media" description="Drag to reorder. The first image is the cover shown in listings.">
            <ProductMedia control={control} register={register} onUploadingChange={onUploadingChange} />
          </Section>

          <Section id="pricing" title="Pricing">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (MRP)" required error={errors.price?.message}>
                <Input {...register('price')} inputMode="decimal" leading={<span className="text-sm">₹</span>} placeholder="0" />
              </Field>
              <Field
                label="Sale price"
                error={errors.salePrice?.message}
                hint="Optional. Must be lower than the price."
              >
                <Input {...register('salePrice')} inputMode="decimal" leading={<span className="text-sm">₹</span>} placeholder="—" />
              </Field>
              <div className="flex flex-col justify-center rounded-lg border border-line bg-page px-3 py-2">
                <span className="text-xs text-muted">Discount</span>
                <span className={cn('text-lg font-semibold tabular', off > 0 ? 'text-success' : 'text-muted')}>
                  {off > 0 ? `${off}% off` : '—'}
                </span>
              </div>
            </div>
          </Section>

          <Section id="inventory" title="Inventory">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="SKU" error={errors.sku?.message} hint="Unique product code (optional).">
                <Input {...register('sku')} autoCapitalize="characters" spellCheck={false} placeholder="e.g. KH-TOY-001" />
              </Field>
              <Field
                label="Stock"
                error={errors.stock?.message}
                hint={hasVariants ? `Calculated from variants: ${variantStock}` : 'Units available to sell.'}
              >
                {hasVariants ? (
                  <Input value={String(variantStock)} disabled readOnly aria-label="Stock (calculated from variants)" />
                ) : (
                  <Input {...register('stock')} inputMode="numeric" />
                )}
              </Field>
              <Field label="Low-stock alert at" error={errors.lowStockThreshold?.message} hint="Flag as low stock at or below this.">
                <Input {...register('lowStockThreshold')} inputMode="numeric" />
              </Field>
            </div>
            {hasVariants && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-info-tint px-3 py-2 text-xs text-info">
                <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                This product has variants, so stock is managed per variant below and the total is calculated automatically.
              </p>
            )}
          </Section>

          <Section id="variants" title="Options & variants" description="For products sold in different colours, sizes or age groups.">
            <ProductVariants control={control} register={register} setValue={setValue} getValues={getValues} errors={errors} />
          </Section>

          <Section
            id="specs"
            title="Specifications"
            description="Shown as a table on the product page (e.g. Material, Age group, Batteries)."
          >
            {specs.fields.length > 0 && (
              <ul className="mb-3 flex flex-col gap-2">
                {specs.fields.map((f, i) => (
                  <li key={f.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-start gap-2">
                    <div>
                      <Input
                        {...register(`specifications.${i}.label` as const)}
                        aria-label={`Specification ${i + 1} label`}
                        placeholder="Label"
                        invalid={!!errors.specifications?.[i]?.label}
                      />
                      {errors.specifications?.[i]?.label && (
                        <p className="mt-1 text-[11px] text-danger">{errors.specifications[i]?.label?.message}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        {...register(`specifications.${i}.value` as const)}
                        aria-label={`Specification ${i + 1} value`}
                        placeholder="Value"
                        invalid={!!errors.specifications?.[i]?.value}
                      />
                      {errors.specifications?.[i]?.value && (
                        <p className="mt-1 text-[11px] text-danger">{errors.specifications[i]?.value?.message}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => specs.remove(i)} aria-label={`Remove specification ${i + 1}`} className="text-muted hover:text-danger">
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="secondary" size="sm" onClick={() => specs.append({ label: '', value: '' })}>
              <Plus /> Add specification
            </Button>
          </Section>

          <Section id="seo" title="Search engine listing" description="Optional. Defaults to the product name and short description.">
            <div className="flex flex-col gap-4">
              <Field label="SEO title" error={errors.seoTitle?.message} aside={<CharCount value={seoTitle} max={60} />}>
                <Input {...register('seoTitle')} placeholder={name || 'Product name'} />
              </Field>
              <Field label="SEO description" error={errors.seoDescription?.message} aside={<CharCount value={seoDescription} max={160} />}>
                <Textarea {...register('seoDescription')} rows={3} placeholder={shortDescription || 'Short description'} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader title="Visibility" />
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <SwitchField
                    id="isActive"
                    label="Active"
                    description="Visible and orderable on the storefront."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <SwitchField
                    id="isFeatured"
                    label="Featured"
                    description="Highlighted on the home page."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Field label="Sort order" error={errors.sortOrder?.message} hint="Lower numbers appear first in manual order.">
                <Input {...register('sortOrder')} inputMode="numeric" />
              </Field>
            </div>
          </Card>
          <nav aria-label="Form sections" className="hidden rounded-xl border border-line bg-surface p-2 xl:block">
            <ul>
              {SECTIONS.map(([sid, label]) => (
                <li key={sid}>
                  <a
                    href={`#${sid}`}
                    data-skip-unsaved-guard="true"
                    className="block rounded-md px-2.5 py-1.5 text-[13px] text-ink-soft hover:bg-subtle hover:text-ink"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-16 z-20 -mx-4 mt-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 md:bottom-0 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="hidden truncate text-[13px] text-muted sm:block" aria-live="polite">
            {uploading ? 'Uploading images…' : isDirty ? 'You have unsaved changes' : product ? 'All changes saved' : 'Fill in the details and save'}
          </p>
          <div className="flex flex-1 gap-2 sm:flex-none">
            <Link href="/products" className={buttonClasses({ variant: 'secondary', className: 'flex-1 sm:flex-none' })}>
              Cancel
            </Link>
            <Button type="submit" loading={isSubmitting} disabled={uploading} className="flex-1 sm:flex-none">
              {product ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </div>
      </div>

      {product && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          loading={del.isPending}
          title={`Delete “${product.name}”?`}
          description={
            product.ordersCount > 0
              ? `This product appears in ${product.ordersCount} order${product.ordersCount === 1 ? '' : 's'}, so it will be archived — hidden from the catalogue but kept for order history.`
              : 'This product has never been ordered, so it will be permanently deleted with its photos and variants.'
          }
          confirmLabel={product.ordersCount > 0 ? 'Archive product' : 'Delete product'}
          onConfirm={() =>
            del.mutate(product.id, {
              onSuccess: (res) => {
                reset(getValues());
                toast.success(res.mode === 'archived' ? 'Product archived' : 'Product deleted');
                setConfirmDelete(false);
                router.push('/products');
              },
              onError: (err) => toast.error(getErrorMessage(err, 'Could not delete the product')),
            })
          }
        />
      )}
    </form>
  );
}

function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-7 w-52" />
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
