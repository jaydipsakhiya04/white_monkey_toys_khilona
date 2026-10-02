import { Transform } from 'class-transformer';
import { normalizeIndianMobile } from '../utils/phone';

export const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/** Trims strings; converts empty strings to null (use for optional nullable text fields). */
export const EmptyToNull = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });

/** Trims strings; converts empty strings to undefined (field treated as "not provided"). */
export const EmptyToUndefined = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  });

/** Query-string boolean: "true"/"1"/"yes" -> true, "false"/"0"/"no" -> false, else undefined. */
export const ToBoolean = () =>
  Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return undefined;
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(v)) return true;
    if (['false', '0', 'no'].includes(v)) return false;
    return undefined;
  });

/** Query-string integer (keeps invalid input so validators can report it). */
export const ToInt = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : value;
  });

/** Query-string number (keeps invalid input so validators can report it). */
export const ToNumber = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  });

/** Lowercases + trims (emails). */
export const ToLowerTrim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));

/** Normalises "+91 98765 43210" → "9876543210"; leaves invalid input untouched for the validator. */
export const NormalizePhone = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return normalizeIndianMobile(trimmed) ?? trimmed;
  });
