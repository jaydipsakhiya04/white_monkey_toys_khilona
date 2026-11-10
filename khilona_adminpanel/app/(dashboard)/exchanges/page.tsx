import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ExchangesList } from '@/features/exchanges/exchanges-list';

export const metadata: Metadata = { title: 'Exchanges' };

export default function ExchangesPage() {
  return (
    <Suspense>
      <ExchangesList />
    </Suspense>
  );
}
