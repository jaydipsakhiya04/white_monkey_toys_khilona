import { Check, Circle } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/utils/cn';

export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'letter', label: 'Contains a letter', test: (v: string) => /[A-Za-z]/.test(v) },
  { id: 'number', label: 'Contains a number', test: (v: string) => /\d/.test(v) },
];

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password must contain a letter and a number');

export function PasswordRules({ value }: { value: string | undefined }) {
  const v = value ?? '';
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(v);
        return (
          <li key={r.id} className={cn('flex items-center gap-1.5', ok ? 'text-success' : 'text-muted')}>
            {ok ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3" aria-hidden />}
            {r.label}
            <span className="sr-only">{ok ? '(met)' : '(not met)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
