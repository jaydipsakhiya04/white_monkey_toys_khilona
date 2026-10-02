import type { Metadata } from 'next';
import { StorePage } from '@/features/store/store-form';

export const metadata: Metadata = { title: 'Store' };

export default function Page() {
  return <StorePage />;
}
