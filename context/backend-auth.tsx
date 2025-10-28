"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";

type BackendUser = {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  image_url?: string | null;
} | null;

type BackendAuthContextValue = {
  backendAuthenticated: boolean;
  csrfToken: string | null;
  apiBaseUrl: string;
  ensureBackendAuth: (force?: boolean) => Promise<boolean>;
  signOutFromBackend: () => Promise<void>;
  user: BackendUser;
};

const BackendAuthContext = createContext<BackendAuthContextValue | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function BackendAuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken, signOut } = useAuth();
  const { signOut: clerkSignOut } = useClerk();
  const [backendAuthenticated, setBackendAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [handshakeInFlight, setHandshakeInFlight] = useState(false);
  const hasAttempted = useRef(false);
  const [user, setUser] = useState<BackendUser>(null);

  const apiBaseUrl = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!url) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("NEXT_PUBLIC_API_BASE_URL is not set. Using window.location.origin as fallback.");
      }
      // Fallback to same origin in dev if not provided
      return typeof window !== "undefined" ? window.location.origin : "";
    }
    return url.replace(/\/$/, "");
  }, []);

  const jwtTemplate = useMemo(() => (process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE || "fastapi"), []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/session`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        setBackendAuthenticated(false);
        setCsrfToken(null);
        setUser(null);
        return false;
      }
      const csrfFromHeader = res.headers.get("x-csrf-token");
      const csrfFromCookie = getCookie("csrf_token");
      const csrf = csrfFromHeader || csrfFromCookie || null;
      setCsrfToken(csrf);
      const data = await res.json().catch(() => null);
      if (data && data.user) {
        setUser({
          user_id: data.user.user_id,
          full_name: data.user.full_name ?? null,
          email: data.user.email ?? null,
          image_url: data.user.image_url ?? null,
        });
      }
      setBackendAuthenticated(true);
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Session check failed:", err);
      setBackendAuthenticated(false);
      setCsrfToken(null);
      setUser(null);
      return false;
    }
  }, [apiBaseUrl]);

  const performHandshake = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn) return false;
    if (handshakeInFlight) return backendAuthenticated; // avoid parallel calls
    setHandshakeInFlight(true);
    try {
      const token = await getToken({ template: jwtTemplate });
      if (!token) throw new Error("Failed to get Clerk token for backend");

      const res = await fetch(`${apiBaseUrl}/auth/handshake`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Handshake failed with status ${res.status}`);
      }
      // After successful handshake, fetch session to obtain CSRF and user info
      const ok = await refreshSession();
      hasAttempted.current = true;
      return ok;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Backend handshake error:", err);
      setBackendAuthenticated(false);
      setCsrfToken(null);
      setUser(null);
      hasAttempted.current = true;
      return false;
    } finally {
      setHandshakeInFlight(false);
    }
  }, [apiBaseUrl, backendAuthenticated, getToken, isSignedIn, jwtTemplate, handshakeInFlight, refreshSession]);

  const ensureBackendAuth = useCallback(
    async (force?: boolean) => {
      if (!isSignedIn) return false;
      if (backendAuthenticated && !force) return true;
      // Try to refresh current session first
      const ok = await refreshSession();
      if (ok) return true;
      // If forced (e.g., on 401) or immediately post sign-in, perform handshake then refresh session
      if (force) {
        return performHandshake();
      }
      return false;
    },
    [backendAuthenticated, isSignedIn, performHandshake, refreshSession]
  );

  const signOutFromBackend = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers,
      });
    } catch (e) {
      // ignore
    } finally {
      setBackendAuthenticated(false);
      setCsrfToken(null);
    }
  }, [apiBaseUrl, csrfToken]);

  // Auto-handshake when signed in
  useEffect(() => {
    const init = async () => {
      if (!isSignedIn) {
        setBackendAuthenticated(false);
        setCsrfToken(null);
        setUser(null);
        return;
      }
      // First try session; if no valid session (fresh login or expired), do handshake
      const ok = await refreshSession();
      if (!ok && !hasAttempted.current) {
        await performHandshake();
      }
    };
    void init();
  }, [isSignedIn, refreshSession, performHandshake]);

  // When Clerk signs out, also clear backend session
  useEffect(() => {
    if (!isSignedIn && (backendAuthenticated || csrfToken)) {
      // Attempt to log out from backend, then reset state
      void (async () => {
        try {
          await fetch(`${apiBaseUrl}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch (_) {}
        setBackendAuthenticated(false);
        setCsrfToken(null);
        setUser(null);
      })();
    }
  }, [isSignedIn, backendAuthenticated, csrfToken, apiBaseUrl]);

  const value = useMemo<BackendAuthContextValue>(
    () => ({ backendAuthenticated, csrfToken, apiBaseUrl, ensureBackendAuth, signOutFromBackend, user }),
    [backendAuthenticated, csrfToken, apiBaseUrl, ensureBackendAuth, signOutFromBackend, user]
  );

  return <BackendAuthContext.Provider value={value}>{children}</BackendAuthContext.Provider>;
}

export function useBackendAuth(): BackendAuthContextValue {
  const ctx = useContext(BackendAuthContext);
  if (!ctx) throw new Error("useBackendAuth must be used within BackendAuthProvider");
  return ctx;
}
