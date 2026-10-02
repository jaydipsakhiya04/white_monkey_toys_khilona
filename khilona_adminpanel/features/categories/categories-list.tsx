'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CornerDownRight, FolderPlus, FolderTree, GripVertical, MoreHorizontal, Pencil, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Card, EmptyState, ErrorState, Skeleton, Thumb } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useUrlState } from '@/hooks/use-url-state';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';
import { categoryService } from '@/services';
import type { AdminCategory, CategoryListParams, Paginated } from '@/types/api';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { CategorySheet } from './category-sheet';
import { useCategories, useCategoryOptions, useInvalidateCategories } from './hooks';

const KEYS = ['search', 'status', 'page', 'new'] as const;
const LIMIT = 100;

type Row = { cat: AdminCategory; depth: 0 | 1; siblings: AdminCategory[] };

function buildTree(items: AdminCategory[]): Row[] {
  const bySort = (a: AdminCategory, b: AdminCategory) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  const ids = new Set(items.map((i) => i.id));
  const tops = items.filter((i) => !i.parentId || !ids.has(i.parentId)).sort(bySort);
  const rows: Row[] = [];
  for (const t of tops) {
    rows.push({ cat: t, depth: 0, siblings: tops });
    const kids = items.filter((i) => i.parentId === t.id).sort(bySort);
    for (const k of kids) rows.push({ cat: k, depth: 1, siblings: kids });
  }
  return rows;
}

export function CategoriesList() {
  const qc = useQueryClient();
  const { values, set } = useUrlState(KEYS);
  const page = Math.max(1, Number(values.page) || 1);
  const status = values.status === 'active' || values.status === 'inactive' ? values.status : undefined;

  const [searchInput, setSearchInput] = useState(values.search ?? '');
  const debounced = useDebouncedValue(searchInput, 350);
  useEffect(() => {
    if ((values.search ?? '') !== debounced.trim()) set({ search: debounced.trim() || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const params: CategoryListParams = useMemo(
    () => ({ search: values.search, status, sort: 'sortOrder', page, limit: LIMIT }),
    [values.search, status, page],
  );
  const listKey = qk.categories.list(params);
  const { data, isLoading, isError, error, refetch, isFetching } = useCategories(params);
  const { data: options = [] } = useCategoryOptions();
  const invalidate = useInvalidateCategories();

  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'move' | 'children' | null>(null);
  const [moveTarget, setMoveTarget] = useState('');
  const [deletingBusy, setDeletingBusy] = useState(false);

  // open "new" sheet from ?new=1 (dashboard quick action)
  useEffect(() => {
    if (values.new === '1') {
      setEditing(null);
      setSheetOpen(true);
      set({ new: undefined, page: values.page });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.new]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const filtered = !!(values.search || status);
  const treeMode = !filtered && (data?.meta.totalPages ?? 1) <= 1;
  const rows: Row[] = useMemo(
    () => (treeMode ? buildTree(items) : items.map((c) => ({ cat: c, depth: c.parentId ? 1 : 0, siblings: [] }) as Row)),
    [items, treeMode],
  );

  const patchCache = (updater: (items: AdminCategory[]) => AdminCategory[]) => {
    qc.setQueryData<Paginated<AdminCategory>>(listKey, (old) => (old ? { ...old, items: updater(old.items) } : old));
  };

  const toggleActive = async (c: AdminCategory, isActive: boolean) => {
    const snapshot = qc.getQueryData<Paginated<AdminCategory>>(listKey);
    patchCache((list) => list.map((i) => (i.id === c.id ? { ...i, isActive } : i)));
    try {
      await categoryService.update(c.id, { isActive });
      toast.success(isActive ? `“${c.name}” is now visible` : `“${c.name}” hidden from the store`);
    } catch (err) {
      if (snapshot) qc.setQueryData(listKey, snapshot);
      toast.error(getErrorMessage(err, 'Could not update the category'));
    } finally {
      invalidate();
    }
  };

  const reorder = async (siblings: AdminCategory[], fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= siblings.length || fromIdx === toIdx) return;
    const moved = arrayMove(siblings, fromIdx, toIdx);
    const payload = moved.map((c, i) => ({ id: c.id, sortOrder: i }));
    const snapshot = qc.getQueryData<Paginated<AdminCategory>>(listKey);
    const map = new Map(payload.map((p) => [p.id, p.sortOrder]));
    patchCache((list) => list.map((i) => (map.has(i.id) ? { ...i, sortOrder: map.get(i.id)! } : i)));
    try {
      await categoryService.reorder(payload);
      toast.success('Order updated');
    } catch (err) {
      if (snapshot) qc.setQueryData(listKey, snapshot);
      toast.error(getErrorMessage(err, 'Could not reorder categories'));
    } finally {
      invalidate();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const a = rows.find((r) => r.cat.id === active.id);
    const b = rows.find((r) => r.cat.id === over.id);
    if (!a || !b) return;
    if (a.siblings !== b.siblings) {
      toast.info('Drag within the same level. Change the parent from the edit panel.');
      return;
    }
    void reorder(a.siblings, a.siblings.indexOf(a.cat), a.siblings.indexOf(b.cat));
  };

  const startDelete = (c: AdminCategory) => {
    setDeleting(c);
    setMoveTarget('');
    setDeleteStep(c.childrenCount > 0 ? 'children' : 'confirm');
  };

  const closeDelete = () => {
    if (deletingBusy) return;
    setDeleting(null);
    setDeleteStep(null);
  };

  const doDelete = async (moveTo?: string) => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      const res = await categoryService.remove(deleting.id, moveTo);
      toast.success(
        res?.movedProducts
          ? `“${deleting.name}” deleted — ${res.movedProducts} product${res.movedProducts === 1 ? '' : 's'} moved`
          : `“${deleting.name}” deleted`,
      );
      setDeleting(null);
      setDeleteStep(null);
      invalidate();
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        if (/sub-?categor|child/i.test(err.message)) setDeleteStep('children');
        else setDeleteStep('move');
      } else {
        toast.error(getErrorMessage(err, 'Could not delete the category'));
      }
    } finally {
      setDeletingBusy(false);
    }
  };

  const moveChoices = options.filter((o) => deleting && o.id !== deleting.id && o.parentId !== deleting.id);
  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise products into up to two levels. Drag to change the order shown on the store."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Categories' }]}
        actions={
          <Button onClick={openCreate}>
            <FolderPlus /> New category
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:p-4">
          <Input
            type="search"
            aria-label="Search categories"
            placeholder="Search categories"
            leading={<Search />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="sm:max-w-xs sm:flex-1"
          />
          <Select
            aria-label="Filter by status"
            value={status ?? ''}
            onChange={(e) => set({ status: e.target.value || undefined })}
            wrapperClassName="sm:w-40"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          {filtered && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchInput('');
                set({ search: undefined, status: undefined });
              }}
            >
              <X /> Clear
            </Button>
          )}
          <p className="text-xs text-muted sm:ml-auto">
            {treeMode ? 'Drag the handle or use the arrows to reorder.' : 'Clear filters to reorder.'}
          </p>
        </div>

        {isLoading ? (
          <ul className="divide-y divide-line" aria-busy="true" aria-label="Loading categories">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-10" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          filtered ? (
            <EmptyState icon={Search} title="No matching categories" description="Try a different search or status." />
          ) : (
            <EmptyState
              icon={FolderTree}
              title="No categories yet"
              description="Create categories like “Board Games” or “Soft Toys” before adding products."
              action={
                <Button size="sm" onClick={openCreate}>
                  <FolderPlus /> New category
                </Button>
              }
            />
          )
        ) : (
          <div className={cn('transition-opacity', isFetching && 'opacity-70')}>
            <div className="hidden grid-cols-[32px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_90px_80px_96px_44px] items-center gap-3 border-b border-line bg-page/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted lg:grid">
              <span><span className="sr-only">Reorder</span></span>
              <span>Category</span>
              <span>Parent</span>
              <span>Slug</span>
              <span className="text-right">Products</span>
              <span className="text-center">Active</span>
              <span className="text-center">Order</span>
              <span><span className="sr-only">Actions</span></span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={rows.map((r) => r.cat.id)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-line">
                  {rows.map((r) => (
                    <CategoryRow
                      key={r.cat.id}
                      row={r}
                      sortable={treeMode}
                      onEdit={() => {
                        setEditing(r.cat);
                        setSheetOpen(true);
                      }}
                      onDelete={() => startDelete(r.cat)}
                      onToggle={(v) => void toggleActive(r.cat, v)}
                      onMove={(dir) => {
                        const idx = r.siblings.indexOf(r.cat);
                        void reorder(r.siblings, idx, idx + dir);
                      }}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            {data && data.meta.totalPages > 1 && (
              <Pagination meta={data.meta} noun="categories" onPageChange={(p) => set({ page: p > 1 ? String(p) : undefined })} />
            )}
          </div>
        )}
      </Card>

      <CategorySheet
        open={sheetOpen}
        category={editing}
        options={options}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={deleteStep === 'confirm'}
        onClose={closeDelete}
        onConfirm={() => void doDelete()}
        loading={deletingBusy}
        title={`Delete “${deleting?.name ?? ''}”?`}
        description={
          deleting && deleting.directProductCount > 0
            ? `It contains ${deleting.directProductCount} product${deleting.directProductCount === 1 ? '' : 's'}. You'll be asked where to move them — products are never deleted with a category.`
            : 'This category will be removed. Products are never deleted with a category.'
        }
        confirmLabel="Delete category"
      />

      <Dialog
        open={deleteStep === 'move'}
        onClose={closeDelete}
        dismissible={!deletingBusy}
        title={`Move products out of “${deleting?.name ?? ''}”`}
        description="This category still has products. Choose a category to move them to, then it will be deleted."
        footer={
          <>
            <Button variant="secondary" onClick={closeDelete} disabled={deletingBusy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void doDelete(moveTarget)} disabled={!moveTarget} loading={deletingBusy}>
              Move products & delete
            </Button>
          </>
        }
      >
        <Field label="Move products to" required>
          <Select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)}>
            <option value="">Select a category</option>
            {moveChoices
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.parentId ? `↳ ${o.name}` : o.name}
                  {!o.isActive ? ' (inactive)' : ''}
                </option>
              ))}
          </Select>
        </Field>
      </Dialog>

      <Dialog
        open={deleteStep === 'children'}
        onClose={closeDelete}
        title={`“${deleting?.name ?? ''}” has sub-categories`}
        description="A category with sub-categories can't be deleted. Move each sub-category to another parent (or delete it) first."
        size="sm"
        footer={<Button onClick={closeDelete}>Got it</Button>}
      >
        <ul className="space-y-1 text-[13px]">
          {items
            .filter((c) => c.parentId === deleting?.id)
            .map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <CornerDownRight className="size-3.5 text-muted" aria-hidden />
                <button
                  type="button"
                  className="font-medium text-brand hover:underline"
                  onClick={() => {
                    closeDelete();
                    setEditing(c);
                    setSheetOpen(true);
                  }}
                >
                  {c.name}
                </button>
              </li>
            ))}
        </ul>
      </Dialog>
    </>
  );
}

function CategoryRow({
  row,
  sortable,
  onEdit,
  onDelete,
  onToggle,
  onMove,
}: {
  row: Row;
  sortable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const { cat, depth, siblings } = row;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
    disabled: !sortable,
  });
  const idx = siblings.indexOf(cat);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 bg-surface px-4 py-3 lg:grid-cols-[32px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_90px_80px_96px_44px]',
        isDragging && 'z-10 shadow-pop',
      )}
    >
      <div className="flex items-center justify-center">
        {sortable ? (
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag to reorder ${cat.name}`}
            className="flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-stone-400 hover:bg-subtle hover:text-ink active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : (
          <span className="size-7" />
        )}
      </div>

      <div className={cn('flex min-w-0 items-center gap-3', depth === 1 && 'pl-5 lg:pl-7')}>
        {depth === 1 && <CornerDownRight className="-ml-5 size-4 shrink-0 text-stone-300 lg:-ml-6" aria-hidden />}
        <Thumb src={cat.imageUrl} alt={cat.name} size={40} />
        <div className="min-w-0">
          <button type="button" onClick={onEdit} className="block max-w-full truncate text-left text-[13px] font-semibold hover:text-brand">
            {cat.name}
          </button>
          <p className="truncate text-xs text-muted lg:hidden">
            {cat.parent ? `in ${cat.parent.name} · ` : ''}
            {formatNumber(cat.productCount)} product{cat.productCount === 1 ? '' : 's'}
            {cat.childrenCount ? ` · ${cat.childrenCount} sub` : ''}
          </p>
          {!cat.isActive && (
            <Badge className="mt-1 h-[18px] px-1.5 text-[10px] lg:hidden">Inactive</Badge>
          )}
        </div>
      </div>

      <span className="hidden truncate text-[13px] text-ink-soft lg:block">{cat.parent?.name ?? <span className="text-stone-400">—</span>}</span>
      <span className="hidden truncate text-xs text-muted lg:block">/{cat.slug}</span>
      <span className="hidden text-right text-[13px] tabular lg:block">{formatNumber(cat.productCount)}</span>
      <span className="hidden justify-center lg:flex">
        <Switch size="sm" checked={cat.isActive} onCheckedChange={onToggle} label={`${cat.name} active`} />
      </span>
      <span className="hidden items-center justify-center gap-0.5 lg:flex">
        <Button variant="ghost" size="icon-sm" disabled={!sortable || idx <= 0} onClick={() => onMove(-1)} aria-label={`Move ${cat.name} up`}>
          <ArrowUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!sortable || idx === -1 || idx >= siblings.length - 1}
          onClick={() => onMove(1)}
          aria-label={`Move ${cat.name} down`}
        >
          <ArrowDown />
        </Button>
      </span>

      <div className="flex items-center gap-1 lg:justify-center">
        <span className="lg:hidden">
          <Switch size="sm" checked={cat.isActive} onCheckedChange={onToggle} label={`${cat.name} active`} />
        </span>
        <DropdownMenu
          label={`Actions for ${cat.name}`}
          trigger={<MoreHorizontal />}
          items={[
            { label: 'Edit', icon: <Pencil />, onSelect: onEdit },
            ...(sortable
              ? [
                  { label: 'Move up', icon: <ArrowUp />, onSelect: () => onMove(-1), disabled: idx <= 0 },
                  { label: 'Move down', icon: <ArrowDown />, onSelect: () => onMove(1), disabled: idx >= siblings.length - 1 },
                ]
              : []),
            { type: 'separator' as const },
            { label: 'Delete', icon: <Trash2 />, danger: true, onSelect: onDelete },
          ]}
        />
      </div>
    </li>
  );
}
