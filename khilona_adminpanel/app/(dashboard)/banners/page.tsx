import type { Metadata } from 'next';
import { BannersManager } from '@/features/banners/banners-manager';

export const metadata: Metadata = { title: 'Banners' };

export default function BannersPage() {
  return <BannersManager />;
}
