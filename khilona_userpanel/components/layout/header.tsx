import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { WhatsAppIcon } from "@/components/icons/brand";
import { CartButton } from "@/features/cart/cart-button";
import type { CategorySummary, PublicStore } from "@/types/api";
import { whatsappLink } from "@/utils/phone";
import { CategoriesMenu } from "./categories-menu";
import { SearchForm } from "./header-search";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

export function AnnouncementBar({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null;
  return (
    <div className="bg-ink text-white">
      <Container className="flex min-h-9 items-center justify-center py-1.5 text-center text-[0.8125rem] font-medium leading-snug">
        <p>{text}</p>
      </Container>
    </div>
  );
}

export function Header({ store, categories }: { store: PublicStore | null; categories: CategorySummary[] }) {
  const name = store?.name ?? "KHILONA";
  const wa = store?.whatsappUrl ?? (store?.whatsapp ? whatsappLink(store.whatsapp) : null);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center gap-2 md:h-[4.5rem] md:gap-4">
        <div className="-ml-2 md:hidden">
          <MobileMenu categories={categories} storeName={name} />
        </div>
        <Logo name={name} logoUrl={store?.logoUrl ?? null} />
        <nav aria-label="Main" className="ml-2 hidden items-center gap-1 md:flex">
          <CategoriesMenu categories={categories} />
          <Link
            href="/products"
            className="hidden h-11 items-center rounded-xl px-3.5 text-[0.9375rem] font-semibold text-ink hover:bg-sand lg:inline-flex"
          >
            Shop all
          </Link>
        </nav>
        <div className="hidden min-w-0 flex-1 md:block md:max-w-xl lg:mx-4">
          <Suspense>
            <SearchForm />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/track-order"
            className="hidden h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted hover:bg-sand hover:text-ink xl:inline-flex"
          >
            Track order
          </Link>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp (opens in new tab)"
              className="grid size-11 place-items-center rounded-xl text-success-700 hover:bg-success-tint"
            >
              <WhatsAppIcon className="size-[1.375rem]" />
            </a>
          )}
          <CartButton />
        </div>
      </Container>
    </header>
  );
}
