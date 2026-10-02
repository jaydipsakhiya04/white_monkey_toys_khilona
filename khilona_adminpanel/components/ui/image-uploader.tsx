'use client';

import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api-client';
import { uploadService } from '@/services';
import type { UploadFolder } from '@/types/api';
import { cn } from '@/utils/cn';
import { Button } from './button';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Returns an error message, or null if the file is acceptable. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return `${file.name}: unsupported type. Use JPG, PNG, WebP, AVIF or GIF.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: larger than 5 MB.`;
  return null;
}

type ImageUploaderProps = {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder: UploadFolder;
  label?: string;
  /** Aspect of the preview box */
  aspect?: 'square' | 'wide';
  hint?: string;
  disabled?: boolean;
  id?: string;
};

/** Single image upload with preview, progress, replace and remove. */
export function ImageUploader({
  value,
  onChange,
  folder,
  label = 'Upload image',
  aspect = 'square',
  hint = 'JPG, PNG, WebP, AVIF or GIF · up to 5 MB',
  disabled,
  id,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const inputId = id ?? autoId;
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const uploading = progress !== null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setProgress(0);
    try {
      const res = await uploadService.image(file, folder, setProgress);
      onChange(res.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Upload failed'));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-3', aspect === 'square' && 'sm:flex-row sm:items-start')}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-subtle',
          aspect === 'square' ? 'size-28' : 'aspect-[16/7] w-full sm:w-64',
          dragOver ? 'border-brand ring-3 ring-brand/15' : 'border-dashed border-line-strong',
        )}
      >
        {value ? (
          <img src={value} alt="" width={256} height={256} className="size-full object-cover" loading="lazy" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex size-full flex-col items-center justify-center gap-1 text-muted hover:text-ink"
          >
            <ImagePlus className="size-5" aria-hidden />
            <span className="text-xs font-medium">{label}</span>
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/85 text-xs font-medium text-ink">
            <Loader2 className="size-5 animate-spin text-brand" aria-hidden />
            <span className="tabular">{progress}%</span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            aria-describedby={`${inputId}-hint`}
          >
            {value ? <RefreshCw /> : <ImagePlus />}
            {value ? 'Replace' : label}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)} disabled={disabled || uploading}>
              <Trash2 />
              Remove
            </Button>
          )}
        </div>
        <p id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}. Drag & drop supported.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
