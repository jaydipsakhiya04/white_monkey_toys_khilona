'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/auth-provider';
import { createQueryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        position="top-right"
        closeButton
        richColors
        toastOptions={{ classNames: { toast: 'font-sans text-sm' } }}
        offset={16}
        mobileOffset={{ top: 12 }}
      />
    </QueryClientProvider>
  );
}
