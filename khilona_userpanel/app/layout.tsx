import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import { AnnouncementBar, Header } from "@/components/layout/header";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Footer } from "@/components/layout/footer";
import { SITE_URL } from "@/lib/env";
import { getCategoryTree, getStore } from "@/services/catalog.server";
import { toPlainText } from "@/utils/format";
import { Providers } from "./providers";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#FFFCF7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const store = await getStore();
  const name = store?.name ?? "KHILONA";
  const title = store?.seoTitle || (store?.tagline ? `${name} – ${store.tagline}` : `${name} – Toys & Games Shop`);
  const description =
    toPlainText(store?.seoDescription || store?.description) ||
    "Shop toys, games and gifts your kids will love. Order online and pay on delivery.";
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-ink focus:px-4 focus:py-3 focus:font-semibold focus:text-white"
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
