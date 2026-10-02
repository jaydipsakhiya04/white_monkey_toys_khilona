import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { POLICY_TYPES, type PolicyType } from "@/features/store/store-utils";
import { getStore } from "@/services/catalog.server";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";

type Props = { params: Promise<{ type: string }> };

const isPolicy = (t: string): t is PolicyType => t in POLICY_TYPES;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!isPolicy(type)) return { title: "Not found" };
  const store = await getStore();
  return {
    title: POLICY_TYPES[type].title,
    description: `${POLICY_TYPES[type].title} of ${store?.name ?? "KHILONA"}.`,
    alternates: { canonical: `/policies/${type}` },
  };
}

export default async function PolicyPage({ params }: Props) {
  const { type } = await params;
  if (!isPolicy(type)) notFound();
  const store = await getStore();
  const meta = POLICY_TYPES[type];
  const content = store?.[meta.field] as string | null | undefined;
  const paragraphs = (content ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Container className="py-6 sm:py-10">
      <Breadcrumbs items={[{ name: meta.title }]} />
      <div className="mt-6 grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
        <nav aria-label="Policies" className="order-2 lg:order-1">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {(Object.keys(POLICY_TYPES) as PolicyType[]).map((k) => (
              <li key={k}>
                <Link
                  href={`/policies/${k}`}
                  aria-current={k === type ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-xl px-3.5 text-sm font-semibold lg:flex",
                    k === type ? "bg-ink text-white" : "bg-surface text-ink ring-1 ring-line hover:bg-sand",
                  )}
                >
                  {POLICY_TYPES[k].title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="order-1 min-w-0 lg:order-2">
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{meta.title}</h1>
          {store?.updatedAt && paragraphs.length > 0 && <p className="mt-2 text-sm text-muted">Last updated {formatDateTime(store.updatedAt)}</p>}
          <div className="mt-6">
            {!store ? (
              <ErrorState />
            ) : paragraphs.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                title="Not published yet"
                description="This policy hasn't been published yet. Please contact the store if you have any questions."
              >
                <ButtonLink href="/contact">Contact us</ButtonLink>
              </EmptyState>
            ) : (
              <div className="prose-policy max-w-prose rounded-2xl border border-line bg-surface p-5 text-[0.9375rem] leading-7 text-ink sm:p-8 sm:text-base">
                {paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </Container>
  );
}
