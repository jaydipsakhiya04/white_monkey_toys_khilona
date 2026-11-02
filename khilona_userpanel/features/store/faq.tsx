import { Plus } from "lucide-react";
import { JsonLd } from "@/components/ui/json-ld";

export type FaqItem = { q: string; a: string };

/** Accordion of questions (native <details>, works without JS) plus matching FAQPage structured data. */
export function Faq({ items, className }: { items: FaqItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
        }}
      />
      <ul className="divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-surface">
        {items.map((item) => (
          <li key={item.q}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink transition-colors hover:bg-sand/50 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong transition-transform duration-300 group-open:rotate-45">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-muted sm:px-6">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
