"use client";

import { createContext, useContext, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons/brand";
import { cn } from "@/utils/cn";
import { whatsappLink } from "@/utils/phone";

type Pricing = {
  /** Admin → Store → Prices. While false, every price is hidden and "Ask for price" is shown. */
  showPrices: boolean;
  storeName: string;
  whatsappUrl: string | null;
};

const PricingContext = createContext<Pricing>({ showPrices: false, storeName: "White Monkey Toys", whatsappUrl: null });

export function PricingProvider({ value, children }: { value: Pricing; children: ReactNode }) {
  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing() {
  const ctx = useContext(PricingContext);
  return {
    ...ctx,
    /** WhatsApp chat asking for the trade price of a product. */
    askPriceUrl(productName?: string, sku?: string | null) {
      if (!ctx.whatsappUrl) return null;
      const text = productName
        ? `Hi ${ctx.storeName}, please share your wholesale / retailer price for "${productName}"${sku ? ` (SKU ${sku})` : ""}.`
        : `Hi ${ctx.storeName}, please share your wholesale / retailer price list.`;
      return whatsappLink(ctx.whatsappUrl, text);
    },
  };
}

/** "Ask for price" on WhatsApp, shown wherever a price would be while prices are hidden. */
export function AskPriceButton({
  productName,
  sku,
  size = "sm",
  className,
}: {
  productName?: string;
  sku?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { askPriceUrl } = usePricing();
  const href = askPriceUrl(productName, sku);
  const label = "Ask for price";
  if (!href) return <p className={cn("text-sm font-semibold text-ink", className)}>Price on request</p>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={productName ? `${label}: ${productName} (WhatsApp)` : `${label} on WhatsApp`}
      className={cn(
        "relative z-10 inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors",
        size === "sm" &&
          "h-9 border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 text-[0.75rem] text-[#128C4A] hover:bg-[#25D366]/20 min-[380px]:text-[0.8125rem] sm:px-3",
        size === "md" && "h-10 border border-[#25D366]/40 bg-[#25D366]/10 px-4 text-sm text-[#128C4A] hover:bg-[#25D366]/20",
        size === "lg" && "h-12 bg-[#25D366] px-6 text-[0.9375rem] text-white shadow-[0_10px_24px_-12px_rgb(37_211_102/0.7)] hover:bg-[#1fbd5a]",
        className,
      )}
    >
      <WhatsAppIcon className={cn("shrink-0", size === "lg" ? "size-5" : size === "sm" ? "size-3.5 min-[380px]:size-4" : "size-4")} />
      <span className="truncate">{label}</span>
    </a>
  );
}

/** Replaces totals / summaries while prices are hidden. */
export function PricesOnRequestNote({ className }: { className?: string }) {
  const { askPriceUrl } = usePricing();
  const href = askPriceUrl();
  return (
    <div className={cn("rounded-2xl bg-sand px-4 py-3.5 text-sm text-ink-soft", className)}>
      <p className="font-semibold text-ink">Prices on request</p>
      <p className="mt-0.5">Our team shares wholesale / retailer prices, delivery charges and payment details on WhatsApp before dispatch.</p>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[#128C4A] hover:underline">
          <WhatsAppIcon className="size-4" /> Ask for the price list
        </a>
      )}
    </div>
  );
}
