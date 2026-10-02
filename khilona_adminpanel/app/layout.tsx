import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'KHILONA Admin', template: '%s · KHILONA Admin' },
  description: 'Management dashboard for the KHILONA toy & games shop.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAFAF9',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
