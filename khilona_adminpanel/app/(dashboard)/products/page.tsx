import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsList } from '@/features/products/products-list';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsList />
    </Suspense>
  );
}
