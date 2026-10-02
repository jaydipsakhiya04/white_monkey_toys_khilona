'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

type TagInputProps = {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
  'aria-describedby'?: string;
  label: string;
  maxLength?: number;
};

/** Tag-style input: Enter or comma adds a value, Backspace on empty removes the last. */
export function TagInput({ value, onChange, placeholder, invalid, id, label, maxLength = 40, ...rest }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, maxLength));
    }
    onChange(next);
    setDraft('');
  };

  return (
    <div
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2 py-1.5 shadow-xs transition-colors',
        'focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15',
        invalid ? 'border-danger' : 'border-line hover:border-line-strong',
      )}
    >
      <ul className="contents" aria-label={`${label} values`}>
        {value.map((v, i) => (
          <li key={`${v}-${i}`} className="inline-flex h-6 items-center gap-1 rounded-md bg-subtle pl-2 pr-1 text-xs font-medium text-ink">
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="rounded p-0.5 text-muted hover:bg-stone-200 hover:text-ink"
              aria-label={`Remove ${v}`}
            >
              <X className="size-3" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <input
        id={id}
        value={draft}
        aria-label={`Add ${label} value`}
        aria-invalid={invalid || undefined}
        aria-describedby={rest['aria-describedby']}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(',')) add(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && draft === '' && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? 'Add another…' : placeholder}
        className="h-6 min-w-[120px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-stone-400"
        maxLength={maxLength}
      />
    </div>
  );
}
