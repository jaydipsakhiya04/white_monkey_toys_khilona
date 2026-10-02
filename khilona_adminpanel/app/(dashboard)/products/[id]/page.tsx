import type { Metadata } from 'next';
import { ProductFormPage } from '@/features/products/product-form';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductFormPage id={id} />;
}
