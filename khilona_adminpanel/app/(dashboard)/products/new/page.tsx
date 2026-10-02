import type { Metadata } from 'next';
import { ProductFormPage } from '@/features/products/product-form';

export const metadata: Metadata = { title: 'New product' };

export default function NewProductPage() {
  return <ProductFormPage />;
}
