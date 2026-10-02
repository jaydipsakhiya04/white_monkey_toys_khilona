import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CategoriesList } from '@/features/categories/categories-list';

export const metadata: Metadata = { title: 'Categories' };

export default function CategoriesPage() {
  return (
    <Suspense>
      <CategoriesList />
    </Suspense>
  );
}
