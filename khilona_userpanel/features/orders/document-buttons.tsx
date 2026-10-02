"use client";

import { Download, FileText, ReceiptText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { isApiError } from "@/lib/api/errors";
import type { DocumentKind } from "@/types/api";
import { cn } from "@/utils/cn";

const META: Record<DocumentKind, { title: string; description: string; icon: typeof FileText }> = {
  invoice: { title: "Invoice", description: "Official purchase invoice / bill", icon: FileText },
  receipt: { title: "Order receipt", description: "A simple summary of your order", icon: ReceiptText },
};

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function documentFilename(storeName: string, kind: DocumentKind, orderNumber: string) {
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "store";
  return `${slug}-${kind}-${orderNumber}.pdf`;
}

/** Generates the PDF on demand and makes the outcome obvious (progress → success / error). */
export function useDocumentDownload(fetcher: (kind: DocumentKind) => Promise<Blob>, filename: (kind: DocumentKind) => string) {
  const [busy, setBusy] = useState<DocumentKind | null>(null);
  const download = async (kind: DocumentKind) => {
    if (busy) return;
    setBusy(kind);
    const id = toast.loading("Generating PDF…");
    try {
      const blob = await fetcher(kind);
      saveBlob(blob, filename(kind));
      toast.success(`✓ ${kind === "invoice" ? "Invoice" : "Receipt"} downloaded`, { id });
    } catch (e) {
      const detail = isApiError(e) && e.status === 409 ? e.message : "Please try again.";
      toast.error("Unable to generate the document.", { id, description: detail });
    } finally {
      setBusy(null);
    }
  };
  return { busy, download };
}

/** "Order documents" card list (invoice + receipt). */
export function OrderDocuments({
  available,
  fetcher,
  filename,
  className,
}: {
  available: { invoice: boolean; receipt: boolean };
  fetcher: (kind: DocumentKind) => Promise<Blob>;
  filename: (kind: DocumentKind) => string;
  className?: string;
}) {
  const { busy, download } = useDocumentDownload(fetcher, filename);
  const kinds = (["invoice", "receipt"] as const).filter((k) => available[k]);
  if (kinds.length === 0) return null;
  return (
    <section aria-labelledby="docs-title" className={className}>
      <h2 id="docs-title" className="text-lg font-semibold text-ink">
        Order documents
      </h2>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {kinds.map((kind) => {
          const m = META[kind];
          return (
            <li key={kind} className="flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand" aria-hidden="true">
                <m.icon className="size-5 text-ink" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{m.title}</p>
                <p className="text-xs text-muted"><span className="hidden sm:inline">{m.description} · </span>PDF</p>
              </div>
              <button
                type="button"
                onClick={() => void download(kind)}
                disabled={busy !== null}
                aria-busy={busy === kind}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60",
                )}
              >
                {busy === kind ? <Spinner className="size-4" /> : <Download className="size-4" aria-hidden="true" />}
                <span>{busy === kind ? "Generating…" : "Download"}</span>
                <span className="sr-only">{m.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
