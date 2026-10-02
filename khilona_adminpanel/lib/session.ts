import type { AdminProfile } from '@/types/api';

/**
 * Module-level, in-memory session holder.
 * The access token is NEVER persisted (no localStorage / sessionStorage / cookies).
 * The refresh token lives in an httpOnly cookie managed by the backend.
 */
export type SessionSnapshot = {
  accessToken: string | null;
  expiresAt: number | null; // epoch ms
  admin: AdminProfile | null;
};

type Listener = (s: SessionSnapshot) => void;

let snapshot: SessionSnapshot = { accessToken: null, expiresAt: null, admin: null };
const listeners = new Set<Listener>();

export const session = {
  get(): SessionSnapshot {
    return snapshot;
  },
  getAccessToken(): string | null {
    return snapshot.accessToken;
  },
  set(accessToken: string, expiresInSeconds: number, admin: AdminProfile) {
    snapshot = { accessToken, expiresAt: Date.now() + expiresInSeconds * 1000, admin };
    listeners.forEach((l) => l(snapshot));
  },
  setAdmin(admin: AdminProfile) {
    snapshot = { ...snapshot, admin };
    listeners.forEach((l) => l(snapshot));
  },
  clear() {
    snapshot = { accessToken: null, expiresAt: null, admin: null };
    listeners.forEach((l) => l(snapshot));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Called by the API client when a refresh fails mid-session. Registered by AuthProvider. */
let sessionExpiredHandler: (() => void) | null = null;

export function onSessionExpired(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

export function notifySessionExpired() {
  sessionExpiredHandler?.();
}
