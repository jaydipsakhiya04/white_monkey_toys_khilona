import Link from "next/link";
import { Boxes, Building2, Phone, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { WhatsAppIcon } from "@/components/icons/brand";
import { GatedAnchor } from "@/features/auth/login-gate";
import { CartButton } from "@/features/cart/cart-button";
import { brandName } from "@/lib/brand";
import type { CategorySummary, PublicStore } from "@/types/api";
import { storeContactNumbers } from "@/features/store/store-utils";
import { cn } from "@/utils/cn";
import { whatsappLink } from "@/utils/phone";
import { AccountMenu } from "./account-menu";
import { CategoriesMenu } from "./categories-menu";
import { SearchForm } from "./header-search";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

/** Icon for an announcement item, picked from its wording. */
function announcementIcon(text: string): LucideIcon {
  if (/deliver|ship|dispatch|courier/i.test(text)) return Truck;
  if (/wholesale|retail|supply|distribut/i.test(text)) return Building2;
  if (/bulk|order|quantit/i.test(text)) return Boxes;
  return Sparkles;
}

/**
 * Top bar: the store announcement ("A | B | C" → separate items with icons) and both store mobiles
 * (tap to call, WhatsApp icon to chat). Phones show the first item and the main number.
 */
export function AnnouncementBar({ store }: { store: PublicStore | null }) {
  const items = (store?.announcement ?? "")
    .split(/\s*[|•]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  const numbers = storeContactNumbers(store);
  if (items.length === 0 && numbers.length === 0) return null;
  return (
    <div className="bg-ink text-white">
      <Container className="flex min-h-10 items-center justify-between gap-4 py-1.5 text-xs">
        <ul className="flex min-w-0 items-center gap-5 font-medium tracking-[0.02em] text-white/85">
          {items.map((item, i) => {
            const Icon = announcementIcon(item);
            return (
              <li key={item} className={cn("min-w-0 items-center gap-1.5", i === 0 ? "flex" : i === 1 ? "hidden md:flex" : "hidden lg:flex")}>
                <Icon className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
                <span className="truncate">{item}</span>
              </li>
            );
          })}
        </ul>
        {numbers.length > 0 && (
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-white/50 xl:inline">Call / WhatsApp</span>
            {numbers.map((n, i) => (
              <span key={n.telUrl} className={cn("items-center gap-1.5", i === 0 ? "inline-flex" : "hidden sm:inline-flex")}>
                {i > 0 && <span className="mr-1.5 h-3 w-px bg-white/25" aria-hidden="true" />}
                <a href={n.telUrl} className="inline-flex items-center gap-1 font-semibold tabular-nums text-white hover:underline hover:underline-offset-4">
                  <Phone className="size-3 text-white/60" aria-hidden="true" />
                  <span className="sr-only">Call </span>
                  {n.display}
                </a>
                <a
                  href={n.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${n.display}`}
                  className="grid size-6 place-items-center rounded-full text-[#25D366] transition-colors hover:bg-white/10"
                >
                  <WhatsAppIcon className="size-3.5" />
                </a>
              </span>
            ))}
          </div>
        )}
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
