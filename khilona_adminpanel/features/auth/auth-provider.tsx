'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { refreshSession } from '@/lib/api-client';
import { notifySessionExpired, onSessionExpired, session, type SessionSnapshot } from '@/lib/session';
import { authService } from '@/services';
import type { AdminProfile } from '@/types/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'signedOut' | 'offline';

type AuthContextValue = {
  status: AuthStatus;
  admin: AdminProfile | null;
  login: (email: string, password: string) => Promise<AdminProfile>;
  logout: () => Promise<void>;
  retry: () => void;
  setAdmin: (admin: AdminProfile) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Refresh this many ms before the access token expires. */
const REFRESH_LEEWAY_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [snap, setSnap] = useState<SessionSnapshot>(() => session.get());
  const [status, setStatus] = useState<AuthStatus>('loading');
  const pathnameRef = useRef(pathname);
  const loggingOut = useRef(false);

  const statusRef = useRef<AuthStatus>(status);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => session.subscribe(setSnap), []);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    const result = await refreshSession();
    setStatus(result === 'ok' ? 'authenticated' : result === 'network' ? 'offline' : 'unauthenticated');
  }, []);

  // Restore the session from the httpOnly refresh cookie on first load.
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Session expired mid-use (refresh failed after a 401).
  useEffect(() => {
    onSessionExpired(() => {
      if (loggingOut.current) return;
      session.clear();
      if (statusRef.current === 'authenticated') {
        statusRef.current = 'unauthenticated';
        toast.error('Session expired, please sign in again', { id: 'session-expired' });
        const current = pathnameRef.current;
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const next = current && current !== '/login' ? `?next=${encodeURIComponent(current + search)}` : '';
        router.replace(`/login${next}`);
        queryClient.clear();
      }
      setStatus('unauthenticated');
    });
    return () => onSessionExpired(null);
  }, [queryClient, router]);

  // Proactive refresh shortly before the access token expires.
  useEffect(() => {
    if (status !== 'authenticated' || !snap.expiresAt) return;
    const delay = Math.max(5_000, snap.expiresAt - Date.now() - REFRESH_LEEWAY_MS);
    const timer = window.setTimeout(async () => {
      const result = await refreshSession();
      if (result === 'unauthorized') {
        notifySessionExpired();
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [status, snap.expiresAt]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    session.set(data.accessToken, data.expiresIn, data.admin);
    setStatus('authenticated');
    return data.admin;
  }, []);

  const logout = useCallback(async () => {
    loggingOut.current = true;
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout; local session is cleared regardless
    } finally {
      session.clear();
      statusRef.current = 'signedOut';
      setStatus('signedOut');
      router.replace('/login');
      setTimeout(() => queryClient.clear(), 0);
      toast.success('Signed out');
      loggingOut.current = false;
    }
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      admin: snap.admin,
      login,
      logout,
      retry: () => void bootstrap(),
      setAdmin: (admin) => session.setAdmin(admin),
    }),
    [status, snap.admin, login, logout, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
