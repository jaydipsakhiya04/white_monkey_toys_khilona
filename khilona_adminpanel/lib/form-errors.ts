import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isApiError } from '@/lib/api-client';

/**
 * Map a backend 422/409 error onto react-hook-form fields.
 * Returns true if at least one field error was applied.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  options: { fieldMap?: Record<string, string>; knownFields?: string[] } = {},
): boolean {
  if (!isApiError(err)) return false;
  const { fieldMap = {}, knownFields } = options;
  let applied = false;

  for (const e of err.errors) {
    if (!e.field) continue;
    const mapped = fieldMap[e.field] ?? e.field;
    if (knownFields && !knownFields.some((k) => mapped === k || mapped.startsWith(`${k}.`))) continue;
    setError(mapped as Path<T>, { type: 'server', message: e.message });
    applied = true;
  }

  // 409 conflicts often come without a field: infer from the message.
  if (!applied && err.status === 409) {
    const msg = err.message.toLowerCase();
    if (msg.includes('sku') && (!knownFields || knownFields.includes('sku'))) {
      setError('sku' as Path<T>, { type: 'server', message: err.message });
      applied = true;
    } else if (msg.includes('slug') && (!knownFields || knownFields.includes('slug'))) {
      setError('slug' as Path<T>, { type: 'server', message: err.message });
      applied = true;
    } else if (msg.includes('email') && (!knownFields || knownFields.includes('email'))) {
      setError('email' as Path<T>, { type: 'server', message: err.message });
      applied = true;
    }
  }
  return applied;
}

/** Empty strings → null (contract: empty string means "clear"). */
export function emptyToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}
