import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FullScreenLoader } from '@/components/layout/brand';
import { LoginScreen } from '@/features/auth/login-screen';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <LoginScreen />
    </Suspense>
  );
}
