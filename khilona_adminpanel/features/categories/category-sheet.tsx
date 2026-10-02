'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/dialog';
import { CharCount, Field } from '@/components/ui/field';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Input, Select, Textarea } from '@/components/ui/input';
import { SwitchField } from '@/components/ui/switch';
import { getErrorMessage } from '@/lib/api-client';
import { applyApiFieldErrors, emptyToNull } from '@/lib/form-errors';
import type { AdminCategory, CategoryInput, CategoryOption } from '@/types/api';
import { SLUG_PATTERN, slugify } from '@/utils/slugify';
import { useSaveCategory } from './hooks';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
  slug: z
    .string()
    .trim()
    .max(120, 'Slug is too long')
    .refine((v) => v === '' || SLUG_PATTERN.test(v), 'Use lowercase letters, numbers and hyphens only'),
  parentId: z.string(),
  description: z.string().max(1000, 'Description is too long'),
  imageUrl: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.string().trim().regex(/^-?\d+$/, 'Whole number'),
  seoTitle: z.string().max(200, 'Too long'),
  seoDescription: z.string().max(500, 'Too long'),
});
type Values = z.infer<typeof schema>;

function toValues(c?: AdminCategory | null): Values {
  return {
    name: c?.name ?? '',
    slug: c?.slug ?? '',
    parentId: c?.parentId ?? '',
    description: c?.description ?? '',
    imageUrl: c?.imageUrl ?? null,
    isActive: c?.isActive ?? true,
    sortOrder: String(c?.sortOrder ?? 0),
    seoTitle: c?.seoTitle ?? '',
    seoDescription: c?.seoDescription ?? '',
  };
}

export function CategorySheet({
  open,
  category,
  options,
  onClose,
}: {
  open: boolean;
  category: AdminCategory | null;
  options: CategoryOption[];
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={category ? 'Edit category' : 'New category'}
      description={category ? category.name : 'Group products so customers can browse them.'}
    >
      {open && <CategoryForm key={category?.id ?? 'new'} category={category} options={options} onDone={onClose} />}
    </Sheet>
  );
}

function CategoryForm({
  category,
  options,
  onDone,
}: {
  category: AdminCategory | null;
  options: CategoryOption[];
  onDone: () => void;
}) {
  const save = useSaveCategory();
  const [slugTouched, setSlugTouched] = useState(!!category);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(category), mode: 'onTouched' });
  const [seoTitle, seoDescription] = useWatch({ control, name: ['seoTitle', 'seoDescription'] });

  const parentChoices = options
    .filter((o) => !o.parentId && o.id !== category?.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const hasChildren = (category?.childrenCount ?? 0) > 0;

  const onSubmit = handleSubmit((v) => {
    const body: CategoryInput = {
      name: v.name.trim(),
      description: emptyToNull(v.description),
      imageUrl: v.imageUrl || null,
      isActive: v.isActive,
      sortOrder: Number(v.sortOrder),
      parentId: v.parentId || null,
      seoTitle: emptyToNull(v.seoTitle),
      seoDescription: emptyToNull(v.seoDescription),
    };
    if (v.slug.trim()) body.slug = v.slug.trim();
    save.mutate(
      { id: category?.id, body },
      {
        onSuccess: (saved) => {
          toast.success(category ? `“${saved.name}” updated` : `“${saved.name}” created`);
          onDone();
        },
        onError: (err) => {
          const applied = applyApiFieldErrors(err, setError, {
            knownFields: ['name', 'slug', 'parentId', 'description', 'imageUrl', 'sortOrder', 'seoTitle', 'seoDescription'],
          });
          if (!applied && /parent|cycle|deep|level/i.test(getErrorMessage(err))) {
            setError('parentId', { type: 'server', message: getErrorMessage(err) });
          } else {
            toast.error(getErrorMessage(err, 'Could not save the category'));
          }
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-label={category ? 'Edit category' : 'New category'}>
      <Field label="Name" required error={errors.name?.message}>
        <Input
          {...register('name', {
            onChange: (e) => {
              if (!slugTouched) setValue('slug', slugify(e.target.value));
            },
          })}
          placeholder="e.g. Board Games"
          autoComplete="off"
          data-autofocus
        />
      </Field>
      <Field label="URL slug" error={errors.slug?.message} hint="Auto-generated from the name. Edit to customise.">
        <Input
          {...register('slug', { onChange: (e) => setSlugTouched(e.target.value !== '') })}
          placeholder="board-games"
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>
      <Field
        label="Parent category"
        htmlFor={hasChildren ? undefined : "cat-parent"}
        error={errors.parentId?.message}
        hint={
          hasChildren
            ? 'This category has sub-categories, so it must stay top-level (categories can only be 2 levels deep).'
            : 'Leave empty for a top-level category.'
        }
      >
        {hasChildren ? (
          <Select disabled value="" onChange={() => undefined}>
            <option value="">None (top-level)</option>
          </Select>
        ) : (
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <Select id="cat-parent" ref={field.ref} name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur}>
                <option value="">None (top-level)</option>
                {parentChoices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                    {!o.isActive ? ' (inactive)' : ''}
                  </option>
                ))}
              </Select>
            )}
          />
        )}
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <Textarea {...register('description')} rows={3} />
      </Field>
      <div>
        <p className="mb-1.5 text-[13px] font-medium">Image</p>
        <Controller
          control={control}
          name="imageUrl"
          render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} folder="categories" />}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort order" error={errors.sortOrder?.message} hint="Lower numbers appear first.">
          <Input {...register('sortOrder')} inputMode="numeric" />
        </Field>
        <div className="sm:pt-5">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <SwitchField id="cat-active" label="Active" description="Visible on the storefront." checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>
      <fieldset className="flex flex-col gap-4 rounded-xl border border-line p-4">
        <legend className="px-1 text-[13px] font-medium">SEO (optional)</legend>
        <Field label="SEO title" error={errors.seoTitle?.message} aside={<CharCount value={seoTitle} max={60} />}>
          <Input {...register('seoTitle')} />
        </Field>
        <Field label="SEO description" error={errors.seoDescription?.message} aside={<CharCount value={seoDescription} max={160} />}>
          <Textarea {...register('seoDescription')} rows={2} />
        </Field>
      </fieldset>
      <div className="sticky bottom-0 -mx-5 -mb-4 flex gap-2 border-t border-line bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-end">
        <Button variant="secondary" onClick={onDone} disabled={save.isPending} className="flex-1 sm:flex-none">
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} className="flex-1 sm:flex-none">
          {category ? 'Save changes' : 'Create category'}
        </Button>
      </div>
    </form>
  );
}
