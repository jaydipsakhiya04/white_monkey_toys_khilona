type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Tiny className joiner (no tailwind-merge dependency). */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const v of inputs) {
    if (!v) continue;
    if (Array.isArray(v)) {
      const s = cn(...v);
      if (s) out.push(s);
    } else out.push(String(v));
  }
  return out.join(" ");
}
