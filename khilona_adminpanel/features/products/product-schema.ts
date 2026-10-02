import { z } from 'zod';
import type { AdminProductDetail, ProductInput } from '@/types/api';
import { emptyToNull } from '@/lib/form-errors';
import { SLUG_PATTERN } from '@/utils/slugify';

const money = /^\d+(\.\d{1,2})?$/;
const int = /^\d+$/;

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === '' || (money.test(v) && Number(v) > 0), 'Enter a valid amount greater than 0');

export const imageSchema = z.object({
  key: z.string(),
  url: z.string().min(1),
  alt: z.string().max(200, 'Keep alt text under 200 characters'),
});

export const optionSchema = z.object({
  key: z.string(),
  name: z.string().trim().min(1, 'Option name is required').max(40, 'Keep it under 40 characters'),
  values: z.array(z.string()).min(1, 'Add at least one value'),
});

export const variantSchema = z.object({
  key: z.string(),
  options: z.record(z.string(), z.string()),
  sku: z.string().trim().max(64, 'SKU is too long'),
  price: optionalMoney,
  salePrice: optionalMoney,
  stock: z.string().trim().regex(int, 'Whole number, 0 or more'),
  imageUrl: z.string(),
  isActive: z.boolean(),
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(140, 'Name must be 140 characters or fewer'),
    slug: z
      .string()
      .trim()
      .max(160, 'Slug is too long')
      .refine((v) => v === '' || SLUG_PATTERN.test(v), 'Use lowercase letters, numbers and hyphens only'),
    categoryId: z.string().min(1, 'Choose a category'),
    shortDescription: z.string().max(300, 'Keep it under 300 characters'),
    description: z.string().max(10000, 'Description is too long'),
    images: z.array(imageSchema),
    price: z
      .string()
      .trim()
      .min(1, 'Price is required')
      .refine((v) => money.test(v) && Number(v) > 0, 'Enter a valid price greater than 0'),
    salePrice: optionalMoney,
    sku: z.string().trim().max(64, 'SKU is too long'),
    stock: z.string().trim().regex(int, 'Whole number, 0 or more'),
    lowStockThreshold: z.string().trim().regex(int, 'Whole number, 0 or more'),
    options: z.array(optionSchema),
    variants: z.array(variantSchema),
    specifications: z.array(z.object({ label: z.string().max(80), value: z.string().max(300) })),
    seoTitle: z.string().max(200, 'SEO title is too long'),
    seoDescription: z.string().max(500, 'SEO description is too long'),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: z.string().trim().regex(/^-?\d+$/, 'Whole number'),
  })
  .superRefine((v, ctx) => {
    const price = Number(v.price);
    if (v.salePrice !== '' && Number(v.salePrice) >= price) {
      ctx.addIssue({ code: 'custom', path: ['salePrice'], message: 'Sale price must be lower than the price' });
    }
    const names = new Set<string>();
    v.options.forEach((o, i) => {
      const n = o.name.trim().toLowerCase();
      if (n && names.has(n)) ctx.addIssue({ code: 'custom', path: ['options', i, 'name'], message: 'Option names must be unique' });
      names.add(n);
    });
    v.variants.forEach((variant, i) => {
      const base = variant.price !== '' ? Number(variant.price) : price;
      if (variant.salePrice !== '' && Number(variant.salePrice) >= base) {
        ctx.addIssue({ code: 'custom', path: ['variants', i, 'salePrice'], message: 'Must be lower than the price' });
      }
    });
    const skus = new Map<string, number>();
    v.variants.forEach((variant, i) => {
      const s = variant.sku.trim().toLowerCase();
      if (!s) return;
      if (skus.has(s)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'Duplicate SKU' });
      skus.set(s, i);
    });
    v.specifications.forEach((s, i) => {
      const hasLabel = s.label.trim() !== '';
      const hasValue = s.value.trim() !== '';
      if (hasLabel !== hasValue) {
        ctx.addIssue({
          code: 'custom',
          path: ['specifications', i, hasLabel ? 'value' : 'label'],
          message: hasLabel ? 'Value is required' : 'Label is required',
        });
      }
    });
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type VariantRow = ProductFormValues['variants'][number];
export type OptionGroup = ProductFormValues['options'][number];

let keySeq = 0;
export function newKey(prefix = 'k'): string {
  keySeq += 1;
  return `${prefix}${Date.now().toString(36)}${keySeq}`;
}

export function comboKey(options: Record<string, string>, order: string[]): string {
  return order.map((n) => `${n}=${options[n] ?? ''}`).join('|');
}

export const emptyProductForm: ProductFormValues = {
  name: '',
  slug: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  images: [],
  price: '',
  salePrice: '',
  sku: '',
  stock: '0',
  lowStockThreshold: '5',
  options: [],
  variants: [],
  specifications: [],
  seoTitle: '',
  seoDescription: '',
  isActive: true,
  isFeatured: false,
  sortOrder: '0',
};

const numStr = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

export function productToForm(p: AdminProductDetail): ProductFormValues {
  const order = p.options.map((o) => o.name);
  return {
    name: p.name,
    slug: p.slug,
    categoryId: p.category?.id ?? '',
    shortDescription: p.shortDescription ?? '',
    description: p.description ?? '',
    images: [...p.images]
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ key: img.id || newKey('img'), url: img.url, alt: img.alt ?? '' })),
    price: numStr(p.price),
    salePrice: numStr(p.salePrice),
    sku: p.sku ?? '',
    stock: String(p.stock ?? 0),
    lowStockThreshold: String(p.lowStockThreshold ?? 5),
    options: p.options.map((o) => ({ key: newKey('opt'), name: o.name, values: [...o.values] })),
    variants: [...p.variants]
      .sort((a, b) => a.position - b.position)
      .map((v) => ({
        key: comboKey(v.options, order),
        options: { ...v.options },
        sku: v.sku ?? '',
        price: numStr(v.price),
        salePrice: numStr(v.salePrice),
        stock: String(v.stock ?? 0),
        imageUrl: v.imageUrl ?? '',
        isActive: v.isActive,
      })),
    specifications: p.specifications.map((s) => ({ label: s.label, value: s.value })),
    seoTitle: p.seoTitle ?? '',
    seoDescription: p.seoDescription ?? '',
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    sortOrder: String(p.sortOrder ?? 0),
  };
}

export function formToInput(v: ProductFormValues): ProductInput {
  const options = v.options
    .map((o) => ({ name: o.name.trim(), values: o.values.map((x) => x.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length);
  const hasVariants = options.length > 0;
  const input: ProductInput = {
    name: v.name.trim(),
    categoryId: v.categoryId,
    shortDescription: emptyToNull(v.shortDescription),
    description: emptyToNull(v.description),
    sku: emptyToNull(v.sku),
    price: Number(v.price),
    salePrice: v.salePrice.trim() === '' ? null : Number(v.salePrice),
    lowStockThreshold: Number(v.lowStockThreshold),
    isActive: v.isActive,
    isFeatured: v.isFeatured,
    sortOrder: Number(v.sortOrder),
    seoTitle: emptyToNull(v.seoTitle),
    seoDescription: emptyToNull(v.seoDescription),
    specifications: v.specifications
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      .filter((s) => s.label && s.value),
    images: v.images.map((img) => ({ url: img.url, alt: emptyToNull(img.alt) })),
    options,
    variants: hasVariants
      ? v.variants.map((row) => ({
          options: row.options,
          sku: emptyToNull(row.sku),
          price: row.price.trim() === '' ? null : Number(row.price),
          salePrice: row.salePrice.trim() === '' ? null : Number(row.salePrice),
          stock: Number(row.stock),
          imageUrl: row.imageUrl || null,
          isActive: row.isActive,
        }))
      : [],
  };
  if (v.slug.trim()) input.slug = v.slug.trim();
  if (!hasVariants) input.stock = Number(v.stock);
  return input;
}
