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
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, GripVertical, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from '@/components/ui/image-uploader';
import { getErrorMessage } from '@/lib/api-client';
import { uploadService } from '@/services';
import { cn } from '@/utils/cn';
import { newKey, type ProductFormValues } from './product-schema';

type Pending = { id: string; name: string; preview: string; progress: number };

function SortableImage({
  id,
  index,
  count,
  url,
  register,
  onRemove,
  onMove,
}: {
  id: string;
  index: number;
  count: number;
  url: string;
  register: UseFormRegister<ProductFormValues>;
  onRemove: () => void;
  onMove: (to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-surface',
        index === 0 ? 'border-brand/50 ring-1 ring-brand/30' : 'border-line',
        isDragging && 'z-10 shadow-pop',
      )}
    >
      <div className="relative aspect-square bg-subtle">
        <img src={url} alt="" width={240} height={240} loading="lazy" className="size-full object-cover" draggable={false} />
        {index === 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-ink/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Cover
          </span>
        )}
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder image ${index + 1}`}
          className="absolute right-2 top-2 flex size-7 cursor-grab touch-none items-center justify-center rounded-md bg-white/90 text-ink-soft shadow-xs active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-1.5 p-2">
        <input
          {...register(`images.${index}.alt` as const)}
          placeholder="Alt text (for accessibility)"
          aria-label={`Alt text for image ${index + 1}`}
          maxLength={200}
          className="h-8 w-full rounded-md border border-line px-2 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        <div className="flex items-center justify-between">
          <div className="flex">
            <Button variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move image ${index + 1} earlier`}>
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={index === count - 1}
              onClick={() => onMove(index + 1)}
              aria-label={`Move image ${index + 1} later`}
            >
              <ChevronRight />
            </Button>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove image ${index + 1}`} className="text-muted hover:text-danger">
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}

export function ProductMedia({
  control,
  register,
  onUploadingChange,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'images', keyName: '_rid' });
  const [pending, setPending] = useState<Pending[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => onUploadingChange(pending.length > 0), [pending.length, onUploadingChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f._rid === active.id);
    const to = fields.findIndex((f) => f._rid === over.id);
    if (from >= 0 && to >= 0) move(from, to);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const accepted: File[] = [];
    for (const f of list) {
      const problem = validateImageFile(f);
      if (problem) toast.error(problem);
      else accepted.push(f);
    }
    if (!accepted.length) return;
    const jobs = accepted.map((file) => ({ file, id: newKey('up'), preview: URL.createObjectURL(file) }));
    setPending((p) => [...p, ...jobs.map((j) => ({ id: j.id, name: j.file.name, preview: j.preview, progress: 0 }))]);

    // upload at most 3 at a time, keep the chosen order
    const results: ({ url: string } | null)[] = new Array(jobs.length).fill(null);
    let cursor = 0;
    const worker = async () => {
      while (cursor < jobs.length) {
        const i = cursor++;
        const job = jobs[i];
        try {
          const res = await uploadService.image(job.file, 'products', (progress) =>
            setPending((p) => p.map((x) => (x.id === job.id ? { ...x, progress } : x))),
          );
          results[i] = res;
        } catch (err) {
          toast.error(`${job.file.name}: ${getErrorMessage(err, 'upload failed')}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, jobs.length) }, worker));
    const ok = results.filter((r): r is { url: string } => !!r);
    if (ok.length) {
      append(ok.map((r) => ({ key: newKey('img'), url: r.url, alt: '' })));
      toast.success(`${ok.length} image${ok.length === 1 ? '' : 's'} uploaded`);
    }
    setPending((p) => p.filter((x) => !jobs.some((j) => j.id === x.id)));
    jobs.forEach((j) => URL.revokeObjectURL(j.preview));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files?.length) return;
          e.preventDefault();
          setDragOver(false);
          void uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors',
          dragOver ? 'border-brand bg-brand-tint/50' : 'border-line-strong bg-page',
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-muted">
          <ImagePlus className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-[13px] font-medium">Drop photos here or</p>
          <Button variant="link" className="text-[13px]" onClick={() => inputRef.current?.click()}>
            browse files
          </Button>
        </div>
        <p className="text-xs text-muted">JPG, PNG, WebP, AVIF or GIF · up to 5 MB each · first image is the cover</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          aria-label="Upload product images"
          data-testid="product-image-input"
          onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
        />
      </div>

      {(fields.length > 0 || pending.length > 0) && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f._rid)} strategy={rectSortingStrategy}>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Product images (drag to reorder)">
              {fields.map((f, i) => (
                <SortableImage
                  key={f._rid}
                  id={f._rid}
                  index={i}
                  count={fields.length}
                  url={f.url}
                  register={register}
                  onRemove={() => remove(i)}
                  onMove={(to) => move(i, to)}
                />
              ))}
              {pending.map((p) => (
                <li key={p.id} className="relative overflow-hidden rounded-xl border border-line bg-subtle" aria-live="polite">
                  <div className="relative aspect-square">
                    <img src={p.preview} alt="" className="size-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                      <Loader2 className="size-5 animate-spin text-brand" aria-hidden />
                      <span className="text-xs font-semibold tabular">{p.progress}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-stone-200">
                    <div className="h-full bg-brand transition-[width]" style={{ width: `${p.progress}%` }} />
                  </div>
                  <p className="truncate px-2 py-2 text-xs text-muted">Uploading {p.name}</p>
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
