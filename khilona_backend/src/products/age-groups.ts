import { AgeGroup } from '@prisma/client';

/** Display order and labels of the age groups ("Shop by age"). */
export const AGE_GROUPS: { value: AgeGroup; label: string; slug: string; minMonths: number; maxMonths: number | null }[] = [
  { value: 'MONTHS_0_18', label: '0-18 Months', slug: '0-18-months', minMonths: 0, maxMonths: 18 },
  { value: 'MONTHS_18_36', label: '18-36 Months', slug: '18-36-months', minMonths: 18, maxMonths: 36 },
  { value: 'YEARS_3_5', label: '3-5 Years', slug: '3-5-years', minMonths: 36, maxMonths: 60 },
  { value: 'YEARS_5_7', label: '5-7 Years', slug: '5-7-years', minMonths: 60, maxMonths: 84 },
  { value: 'YEARS_7_9', label: '7-9 Years', slug: '7-9-years', minMonths: 84, maxMonths: 108 },
  { value: 'YEARS_9_12', label: '9-12 Years', slug: '9-12-years', minMonths: 108, maxMonths: 144 },
  { value: 'YEARS_12_14', label: '12-14 Years', slug: '12-14-years', minMonths: 144, maxMonths: 168 },
  { value: 'YEARS_14_PLUS', label: '14+ Years', slug: '14-plus-years', minMonths: 168, maxMonths: null },
];

const INDEX = new Map(AGE_GROUPS.map((g, i) => [g.value, i]));

export function sortAgeGroups(groups: AgeGroup[]): AgeGroup[] {
  return [...new Set(groups)].filter((g) => INDEX.has(g)).sort((a, b) => INDEX.get(a)! - INDEX.get(b)!);
}

/**
 * A compact age rating from the selected groups:
 * [7-9] → "7-9 Years", [5-7, 7-9, 9-12] → "5-12 Years", [12-14, 14+] → "12+ Years", [0-18m, 18-36m] → "0-36 Months".
 */
export function ageRatingLabel(groups: AgeGroup[]): string | null {
  const sorted = sortAgeGroups(groups).map((g) => AGE_GROUPS[INDEX.get(g)!]);
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0].label;
  const min = sorted[0].minMonths;
  const max = sorted[sorted.length - 1].maxMonths;
  if (max !== null && max <= 36) return `${min}-${max} Months`;
  const from = min < 36 ? `${min} months` : `${min / 12}`;
  if (max === null) return min < 36 ? `${from}+` : `${from}+ Years`;
  return min < 36 ? `${from} – ${max / 12} years` : `${from}-${max / 12} Years`;
}

export function ageGroupFromSlug(slug: string): AgeGroup | undefined {
  const s = slug.trim();
  return AGE_GROUPS.find((g) => g.slug === s || g.value === s)?.value;
}
