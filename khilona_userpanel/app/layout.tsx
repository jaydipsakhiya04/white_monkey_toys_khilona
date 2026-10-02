import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { connection } from "next/server";
import { AnnouncementBar, Header } from "@/components/layout/header";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Footer } from "@/components/layout/footer";
import { brandName } from "@/lib/brand";
import { SITE_URL } from "@/lib/env";
import { getCategoryTree, getStore } from "@/services/catalog.server";
import { toPlainText } from "@/utils/format";
import { Providers } from "./providers";
import "./globals.css";

const display = Inter_Tight({
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
  const title = store?.seoTitle || (store?.tagline ? `${name} – ${store.tagline}` : `${name} – Premium Toys, Games & Gifts`);
  const description =
    toPlainText(store?.seoDescription || store?.description) ||
    `Shop quality toys, games and gifts at ${name}. Easy ordering, order tracking and pay on delivery.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
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
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Providers>
          <AnnouncementBar text={store?.announcement} />
          <Header store={store} categories={categories ?? []} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer store={store} categories={categories ?? []} />
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  );
}
