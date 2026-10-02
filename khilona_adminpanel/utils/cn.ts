type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Tiny className joiner (no dependency). */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (Array.isArray(v)) {
      const inner = cn(...v);
      if (inner) out.push(inner);
    } else {
      out.push(String(v));
    }
  }
  return out.join(' ');
}
