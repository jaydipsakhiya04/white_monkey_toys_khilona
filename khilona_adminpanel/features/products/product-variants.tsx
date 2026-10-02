'use client';

import { Layers, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TagInput } from '@/components/ui/tag-input';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { comboKey, newKey, type ProductFormValues, type VariantRow } from './product-schema';

const PRESETS = ['Color', 'Size', 'Age', 'Material', 'Pack'];
const MAX_OPTIONS = 3;
const MAX_VARIANTS = 100;

function cartesian(groups: { name: string; values: string[] }[]): Record<string, string>[] {
  return groups.reduce<Record<string, string>[]>(
    (acc, g) => acc.flatMap((combo) => g.values.map((v) => ({ ...combo, [g.name]: v }))),
    [{}],
  );
}

type Props = {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  getValues: UseFormGetValues<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
};

export function ProductVariants({ control, register, setValue, getValues, errors }: Props) {
  const { fields: optionFields, append, remove } = useFieldArray({ control, name: 'options', keyName: '_rid' });
  const { fields: variantFields } = useFieldArray({ control, name: 'variants', keyName: '_rid' });
  const options = useWatch({ control, name: 'options' });
  const variants = useWatch({ control, name: 'variants' });
  const images = useWatch({ control, name: 'images' });
  const basePrice = useWatch({ control, name: 'price' });

  const valid = useMemo(
    () =>
      (options ?? [])
        .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) }))
        .filter((o) => o.name && o.values.length),
    [options],
  );
  const signature = JSON.stringify(valid);
  const prevSignature = useRef<string | null>(null);

  // Regenerate the variant matrix when option groups change, preserving rows already filled in.
  useEffect(() => {
    if (prevSignature.current === null) {
      prevSignature.current = signature;
      return;
    }
    if (prevSignature.current === signature) return;
    prevSignature.current = signature;

    const order = valid.map((o) => o.name);
    const combos = valid.length ? cartesian(valid).slice(0, MAX_VARIANTS) : [];
    const current = getValues('variants');
    const byKey = new Map(current.map((r) => [comboKey(r.options, Object.keys(r.options)), r]));
    const next: VariantRow[] = combos.map((combo) => {
      const key = comboKey(combo, order);
      const existing = byKey.get(key) ?? current.find((r) => order.every((n) => r.options[n] === combo[n]) && Object.keys(r.options).length === order.length);
      return existing
        ? { ...existing, key, options: combo }
        : { key, options: combo, sku: '', price: '', salePrice: '', stock: '0', imageUrl: '', isActive: true };
    });
    setValue('variants', next, { shouldDirty: true, shouldValidate: false });
  }, [signature, valid, getValues, setValue]);

  const totalStock = (variants ?? []).reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const activeCount = (variants ?? []).filter((v) => v.isActive).length;
  const comboCount = valid.reduce((n, o) => n * o.values.length, valid.length ? 1 : 0);

  const usedNames = new Set((options ?? []).map((o) => o.name.trim().toLowerCase()));
  const presets = PRESETS.filter((p) => !usedNames.has(p.toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      {optionFields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-page px-4 py-5 text-center">
          <Layers className="mx-auto size-5 text-muted" aria-hidden />
          <p className="mt-2 text-[13px] font-medium">This product has no variants</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted">
            Add options like Color, Size or Age if customers need to choose. Each combination gets its own SKU, price and stock.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {PRESETS.slice(0, 3).map((p) => (
              <Button key={p} variant="secondary" size="xs" onClick={() => append({ key: newKey('opt'), name: p, values: [] })}>
                <Plus /> {p}
              </Button>
            ))}
            <Button variant="secondary" size="xs" onClick={() => append({ key: newKey('opt'), name: '', values: [] })}>
              <Plus /> Custom option
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {optionFields.map((f, i) => {
            const err = errors.options?.[i];
            return (
              <div key={f._rid} className="grid gap-3 rounded-xl border border-line bg-page/50 p-3 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-start">
                <Field label={`Option ${i + 1}`} error={err?.name?.message}>
                  <Input {...register(`options.${i}.name` as const)} placeholder="e.g. Color" maxLength={40} />
                </Field>
                <Field label="Values" error={err?.values?.message ?? err?.values?.root?.message} hint="Press Enter or comma to add">
                  <Controller
                    control={control}
                    name={`options.${i}.values` as const}
                    render={({ field, fieldState }) => (
                      <TagInput
                        label={options?.[i]?.name || `option ${i + 1}`}
                        value={field.value}
                        onChange={field.onChange}
                        invalid={!!fieldState.error}
                        placeholder="e.g. Red, Blue, Green"
                      />
                    )}
                  />
                </Field>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  aria-label={`Remove option ${options?.[i]?.name || i + 1}`}
                  className="justify-self-end text-muted hover:text-danger sm:mt-6"
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
          {optionFields.length < MAX_OPTIONS && (
            <div className="flex flex-wrap gap-2">
              {presets.slice(0, 3).map((p) => (
                <Button key={p} variant="secondary" size="xs" onClick={() => append({ key: newKey('opt'), name: p, values: [] })}>
                  <Plus /> {p}
                </Button>
              ))}
              <Button variant="secondary" size="xs" onClick={() => append({ key: newKey('opt'), name: '', values: [] })}>
                <Plus /> Custom option
              </Button>
            </div>
          )}
          {comboCount > MAX_VARIANTS && (
            <p className="text-xs text-danger">
              {formatNumber(comboCount)} combinations — only the first {MAX_VARIANTS} are shown. Reduce option values.
            </p>
          )}
        </div>
      )}

      {variantFields.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-medium">
              {variantFields.length} variant{variantFields.length === 1 ? '' : 's'}{' '}
              <span className="font-normal text-muted">· {activeCount} active</span>
            </p>
            <p className="text-[13px] text-muted">
              Total stock <span className="font-semibold text-ink tabular">{formatNumber(totalStock)}</span>
            </p>
          </div>
          <p className="mb-3 text-xs text-muted">
            Leave price empty to use the product price ({basePrice ? `₹${basePrice}` : 'not set'}). Turn off combinations you don&apos;t sell.
          </p>
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="hidden grid-cols-[minmax(140px,1.4fr)_minmax(100px,1fr)_90px_90px_80px_minmax(110px,1fr)_56px] gap-2 border-b border-line bg-page px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted xl:grid">
              <span>Variant</span>
              <span>SKU</span>
              <span>Price</span>
              <span>Sale</span>
              <span>Stock</span>
              <span>Image</span>
              <span className="text-center">Active</span>
            </div>
            <ul className="divide-y divide-line">
              {variantFields.map((f, i) => {
                const row = variants?.[i];
                const err = errors.variants?.[i];
                const title = Object.values(row?.options ?? f.options).join(' / ');
                return (
                  <li
                    key={f._rid}
                    className={cn(
                      'grid grid-cols-2 gap-2 px-3 py-3 sm:grid-cols-4 xl:grid-cols-[minmax(140px,1.4fr)_minmax(100px,1fr)_90px_90px_80px_minmax(110px,1fr)_56px] xl:items-start',
                      row && !row.isActive && 'bg-page/70',
                    )}
                  >
                    <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-4 xl:col-span-1 xl:h-9">
                      <span className={cn('truncate text-[13px] font-medium', row && !row.isActive && 'text-muted line-through')}>{title}</span>
                      <Controller
                        control={control}
                        name={`variants.${i}.isActive` as const}
                        render={({ field }) => (
                          <span className="xl:hidden">
                            <Switch size="sm" checked={field.value} onCheckedChange={field.onChange} label={`${title} active`} />
                          </span>
                        )}
                      />
                    </div>
                    <VariantInput label="SKU" error={err?.sku?.message}>
                      <Input {...register(`variants.${i}.sku` as const)} aria-label={`${title} SKU`} placeholder="Optional" invalid={!!err?.sku} />
                    </VariantInput>
                    <VariantInput label="Price" error={err?.price?.message}>
                      <Input
                        {...register(`variants.${i}.price` as const)}
                        aria-label={`${title} price`}
                        inputMode="decimal"
                        placeholder={basePrice || '—'}
                        invalid={!!err?.price}
                      />
                    </VariantInput>
                    <VariantInput label="Sale" error={err?.salePrice?.message}>
                      <Input
                        {...register(`variants.${i}.salePrice` as const)}
                        aria-label={`${title} sale price`}
                        inputMode="decimal"
                        placeholder="—"
                        invalid={!!err?.salePrice}
                      />
                    </VariantInput>
                    <VariantInput label="Stock" error={err?.stock?.message}>
                      <Input
                        {...register(`variants.${i}.stock` as const)}
                        aria-label={`${title} stock`}
                        inputMode="numeric"
                        invalid={!!err?.stock}
                      />
                    </VariantInput>
                    <VariantInput label="Image" className="col-span-2 sm:col-span-2 xl:col-span-1">
                      <Select {...register(`variants.${i}.imageUrl` as const)} aria-label={`${title} image`} disabled={!images?.length}>
                        <option value="">{images?.length ? 'Product cover' : 'Upload images first'}</option>
                        {(images ?? []).map((img, idx) => (
                          <option key={img.key} value={img.url}>
                            Image {idx + 1}
                            {img.alt ? ` – ${img.alt.slice(0, 24)}` : ''}
                          </option>
                        ))}
                      </Select>
                    </VariantInput>
                    <div className="hidden h-9 items-center justify-center xl:flex">
                      <Controller
                        control={control}
                        name={`variants.${i}.isActive` as const}
                        render={({ field }) => (
                          <Switch size="sm" checked={field.value} onCheckedChange={field.onChange} label={`${title} active`} />
                        )}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function VariantInput({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <span className="mb-1 block text-[11px] font-medium text-muted xl:sr-only" aria-hidden>
        {label}
      </span>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
