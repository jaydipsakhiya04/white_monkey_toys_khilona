"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { refreshSession } from "@/lib/api/authed";
import { hasSessionHint, useSession } from "@/lib/auth/session";
import { customerAuth } from "@/services/account";
import type { CustomerAuthResponse, SignupInput } from "@/types/api";

/** Restores the session on load (only when this browser was signed in) and announces expiry once. */
export function AuthBootstrap() {
  const started = useRef(false);
  const expired = useSession((s) => s.expired);
  const ackExpired = useSession((s) => s.ackExpired);
  const qc = useQueryClient();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!hasSessionHint()) {
      useSession.getState().setStatus("guest");
      return;
    }
    void refreshSession().then((result) => {
      if (result !== "ok") useSession.getState().clear();
    });
  }, []);

  useEffect(() => {
    if (!expired) return;
    toast.error("Your session has expired. Please log in again.");
    qc.removeQueries({ queryKey: ["account"] });
    ackExpired();
  }, [expired, ackExpired, qc]);

  return null;
}

export function useAuth() {
  const status = useSession((s) => s.status);
  const customer = useSession((s) => s.customer);
  const qc = useQueryClient();

  const accept = useCallback((data: CustomerAuthResponse) => {
    useSession.getState().set(data.accessToken, data.expiresIn, data.customer);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const data = await customerAuth.login(identifier, password);
      accept(data);
      return data.customer;
    },
    [accept],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      const data = await customerAuth.signup(input);
      accept(data);
      return data.customer;
    },
    [accept],
  );

  const logout = useCallback(async () => {
    try {
      await customerAuth.logout();
    } catch {
      // the local session is cleared regardless
    }
    useSession.getState().clear();
    qc.removeQueries({ queryKey: ["account"] });
  }, [qc]);

  return {
    status,
    customer,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login,
    signup,
    logout,
  };
}

/** First name for greetings ("Hi, Jaydip"). */
export function firstName(name: string | null | undefined) {
  return (name ?? "").trim().split(/\s+/)[0] || "there";
}
