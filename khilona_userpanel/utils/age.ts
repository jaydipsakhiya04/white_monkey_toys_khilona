import type { AgeGroup } from "@/types/api";

/** Age groups used for "Shop by age" (same order and slugs as the API). */
export const AGE_GROUPS: { value: AgeGroup; slug: string; label: string; short: string; tagline: string }[] = [
  { value: "MONTHS_0_18", slug: "0-18-months", label: "0-18 Months", short: "0-18", tagline: "Months" },
  { value: "MONTHS_18_36", slug: "18-36-months", label: "18-36 Months", short: "18-36", tagline: "Months" },
  { value: "YEARS_3_5", slug: "3-5-years", label: "3-5 Years", short: "3-5", tagline: "Years" },
  { value: "YEARS_5_7", slug: "5-7-years", label: "5-7 Years", short: "5-7", tagline: "Years" },
  { value: "YEARS_7_9", slug: "7-9-years", label: "7-9 Years", short: "7-9", tagline: "Years" },
  { value: "YEARS_9_12", slug: "9-12-years", label: "9-12 Years", short: "9-12", tagline: "Years" },
  { value: "YEARS_12_14", slug: "12-14-years", label: "12-14 Years", short: "12-14", tagline: "Years" },
  { value: "YEARS_14_PLUS", slug: "14-plus-years", label: "14+ Years", short: "14+", tagline: "Years" },
];

const BY_SLUG = new Map(AGE_GROUPS.map((g) => [g.slug, g]));

export const ageLabelFromSlug = (slug: string) => BY_SLUG.get(slug)?.label ?? slug;
export const isAgeSlug = (slug: string) => BY_SLUG.has(slug);

/** Age group values → URL slugs (for "Shop by age" links). */
export const ageSlugsFor = (groups: AgeGroup[] | undefined) =>
  AGE_GROUPS.filter((g) => groups?.includes(g.value)).map((g) => g.slug);
