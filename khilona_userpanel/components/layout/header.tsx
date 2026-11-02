import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { WhatsAppIcon } from "@/components/icons/brand";
import { GatedAnchor } from "@/features/auth/login-gate";
import { CartButton } from "@/features/cart/cart-button";
import { brandName } from "@/lib/brand";
import type { CategorySummary, PublicStore } from "@/types/api";
import { whatsappLink } from "@/utils/phone";
import { AccountMenu } from "./account-menu";
import { CategoriesMenu } from "./categories-menu";
import { SearchForm } from "./header-search";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

/** Slim store announcement. "A | B | C" (or "·") renders as separate items; phones show the first one. */
export function AnnouncementBar({ text }: { text: string | null | undefined }) {
  const items = (text ?? "")
    .split(/\s*[|·•]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="bg-ink text-white">
      <Container className="flex min-h-9 items-center justify-center py-1.5">
        <p className="sr-only">{items.join(", ")}</p>
        <ul aria-hidden="true" className="flex items-center gap-5 text-center text-xs font-medium tracking-[0.04em] text-white/85 max-sm:[&>li:nth-child(n+2)]:hidden">
          {items.map((item, i) => (
            <li key={item} className="flex items-center gap-5">
              {i > 0 && <span className="h-3 w-px bg-white/25" />}
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

const navLinkBase = "h-10 items-center rounded-full px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-sand";
const navLink = `inline-flex ${navLinkBase}`;

export function Header({ store, categories }: { store: PublicStore | null; categories: CategorySummary[] }) {
  const name = brandName(store);
  const wa = store?.whatsappUrl ?? (store?.whatsapp ? whatsappLink(store.whatsapp) : null);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
      <Container className="flex h-16 items-center gap-2 md:h-[4.5rem] md:gap-3">
        <div className="-ml-2 md:hidden">
          <MobileMenu categories={categories} storeName={name} logoUrl={store?.logoUrl ?? null} />
        </div>
        <Logo name={name} logoUrl={store?.logoUrl ?? null} />
        <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
          <CategoriesMenu categories={categories} />
          <Link href="/products" className={navLink}>
            Shop All
          </Link>
          <Link href="/wholesale" className={navLink}>
            Wholesale
          </Link>
        </nav>
        <div className="hidden min-w-0 flex-1 md:block md:max-w-md lg:mx-3 xl:max-w-lg">
          <Suspense>
            <SearchForm />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <Link href="/track-order" className={`${navLinkBase} hidden xl:inline-flex`}>
            Track Order
          </Link>
          {wa && (
            <GatedAnchor
              href={wa}
              action="chat with us on WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="hidden size-10 place-items-center rounded-full text-ink transition-colors hover:bg-sand sm:grid"
            >
              <WhatsAppIcon className="size-[1.25rem]" />
            </GatedAnchor>
          )}
          <AccountMenu />
          <CartButton />
        </div>
      </Container>
    </header>
  );
}
