import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { WhatsAppIcon } from "@/components/icons/brand";
import { CartButton } from "@/features/cart/cart-button";
import { brandName } from "@/lib/brand";
import type { CategorySummary, PublicStore } from "@/types/api";
import { whatsappLink } from "@/utils/phone";
import { AccountMenu } from "./account-menu";
import { CategoriesMenu } from "./categories-menu";
import { SearchForm } from "./header-search";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

export function AnnouncementBar({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null;
  return (
    <div className="bg-ink text-white">
      <Container className="flex min-h-9 items-center justify-center py-1.5 text-center text-[0.8125rem] font-medium leading-snug tracking-[0.01em]">
        <p>{text}</p>
      </Container>
    </div>
  );
}

export function Header({ store, categories }: { store: PublicStore | null; categories: CategorySummary[] }) {
  const name = brandName(store);
  const wa = store?.whatsappUrl ?? (store?.whatsapp ? whatsappLink(store.whatsapp) : null);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/90 backdrop-blur-md supports-[backdrop-filter]:bg-page/80">
      <Container className="flex h-16 items-center gap-2 md:h-[4.5rem] md:gap-3">
        <div className="-ml-2 md:hidden">
          <MobileMenu categories={categories} storeName={name} />
        </div>
        <Logo name={name} logoUrl={store?.logoUrl ?? null} />
        <nav aria-label="Main" className="ml-3 hidden items-center gap-0.5 lg:flex">
          <CategoriesMenu categories={categories} />
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-full px-3.5 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-sand"
          >
            Shop all
          </Link>
        </nav>
        <div className="hidden min-w-0 flex-1 md:block md:max-w-md lg:mx-2 xl:max-w-lg">
          <Suspense>
            <SearchForm />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <Link
            href="/track-order"
            className="hidden h-11 items-center rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:bg-sand hover:text-ink xl:inline-flex"
          >
            Track order
          </Link>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp (opens in new tab)"
              className="hidden size-11 place-items-center rounded-full text-ink transition-colors hover:bg-sand sm:grid"
            >
              <WhatsAppIcon className="size-[1.3rem]" />
            </a>
          )}
          <AccountMenu />
          <CartButton />
        </div>
      </Container>
    </header>
  );
}
