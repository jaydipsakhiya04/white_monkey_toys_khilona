import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import { AnnouncementBar, Header } from "@/components/layout/header";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Footer } from "@/components/layout/footer";
import { RevealObserver } from "@/components/ui/reveal";
import { brandName } from "@/lib/brand";
import { ALL_KEYWORDS } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { getCategoryTree, getStore } from "@/services/catalog.server";
import { toPlainText } from "@/utils/format";
import { PricingProvider } from "@/features/store/pricing";
import { storeWhatsappUrl } from "@/features/store/store-utils";
import { Providers } from "./providers";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body-face",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const store = await getStore();
  const name = brandName(store);
  const city = store?.city || "Surat";
  const title = store?.seoTitle || `${name} | Toy Wholesaler in ${city} – Supplying Retailers PAN India`;
  const description =
    toPlainText(store?.seoDescription || store?.description, 300) ||
    `${name} is a toy wholesaler in ${city} supplying RC cars, drones, construction RC and action figures to retailers and wholesalers across India.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${name}` },
    description,
    keywords: ALL_KEYWORDS,
    applicationName: name,
    category: "shopping",
    // regional hints for local search (the store's city / state)
    other: { "geo.region": "IN-GJ", "geo.placename": city },
    openGraph: {
      type: "website",
      siteName: name,
      title,
      description,
      locale: "en_IN",
      ...(store?.coverImageUrl ? { images: [{ url: store.coverImageUrl }] } : {}),
    },
    twitter: {
      card: store?.coverImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(store?.coverImageUrl ? { images: [store.coverImageUrl] } : {}),
    },
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render on demand: the API may be unreachable at build time. Data is still
  // cached for 60s via fetch `next.revalidate`.
  await connection();
  const [store, categories] = await Promise.all([getStore(), getCategoryTree()]);

  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/* enables scroll-reveal styles only when JS runs, so content is never hidden without it */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Providers>
          <PricingProvider value={{ showPrices: store?.showPrices ?? false, storeName: brandName(store), whatsappUrl: storeWhatsappUrl(store) }}>
          <AnnouncementBar store={store} />
          <Header store={store} categories={categories ?? []} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer store={store} categories={categories ?? []} />
          <BottomTabBar />
          <RevealObserver />
          </PricingProvider>
        </Providers>
      </body>
    </html>
  );
}
