"use client";

import { create } from "zustand";
import type { CustomerProfile } from "@/types/api";

/**
 * Customer session, held in memory only.
 * - The access token is NEVER written to localStorage/sessionStorage/cookies.
 * - The refresh token lives in an httpOnly cookie set by the API (path /api/auth/customer).
 * - A non-sensitive "signed in" hint is kept in localStorage so guests don't trigger a refresh
 *   request on every page load; it carries no credential.
 */
export type SessionStatus = "loading" | "authenticated" | "guest";

type SessionState = {
  status: SessionStatus;
  accessToken: string | null;
  expiresAt: number | null;
  customer: CustomerProfile | null;
  /** Set when a session ended unexpectedly (refresh failed) so the UI can explain it once. */
  expired: boolean;
  set: (accessToken: string, expiresInSeconds: number, customer: CustomerProfile) => void;
  setCustomer: (customer: CustomerProfile) => void;
  clear: (opts?: { expired?: boolean }) => void;
  setStatus: (status: SessionStatus) => void;
  ackExpired: () => void;
};

const HINT_KEY = "wmt-signed-in";

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeHint(on: boolean) {
  try {
    if (on) localStorage.setItem(HINT_KEY, "1");
    else localStorage.removeItem(HINT_KEY);
  } catch {
    // storage unavailable (private mode) — the session still works for this tab
  }
}

export const useSession = create<SessionState>((set) => ({
  status: "loading",
  accessToken: null,
  expiresAt: null,
  customer: null,
  expired: false,
  set: (accessToken, expiresInSeconds, customer) => {
    writeHint(true);
    set({ status: "authenticated", accessToken, expiresAt: Date.now() + expiresInSeconds * 1000, customer, expired: false });
  },
  setCustomer: (customer) => set({ customer }),
  clear: (opts) => {
    writeHint(false);
    set({ status: "guest", accessToken: null, expiresAt: null, customer: null, expired: !!opts?.expired });
  },
  setStatus: (status) => set({ status }),
  ackExpired: () => set({ expired: false }),
}));

export const sessionSnapshot = () => useSession.getState();
