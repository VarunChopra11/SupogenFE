"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth, useClerk } from "@clerk/nextjs";

type BackendUser = {
  user_id: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
} | null;

type BackendAuthContextValue = {
  backendAuthenticated: boolean;
  csrfToken: string | null;
  apiBaseUrl: string;
  ensureBackendAuth: (force?: boolean) => Promise<boolean>;
  signOutFromBackend: () => Promise<void>;
  user: BackendUser;
};

const BackendAuthContext = createContext<BackendAuthContextValue | undefined>(
  undefined,
);

export function BackendAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, getToken } = useAuth();
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
        console.warn(
          "NEXT_PUBLIC_API_BASE_URL is not set. Using window.location.origin as fallback.",
        );
      }
      return typeof window !== "undefined" ? window.location.origin : "";
    }
    return url.replace(/\/$/, "");
  }, []);

  const jwtTemplate = useMemo(
    () => process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE || "fastapi",
    [],
  );

  // ✅ Refresh session and get user + csrf_token from backend
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

      const data = await res.json();
      if (data?.user) {
        setUser({
          user_id: data.user.user_id,
          name: data.user.name ?? null,
          email: data.user.email ?? null,
          picture: data.user.picture ?? null,
        });
        setCsrfToken(data.csrf_token ?? null);
        setBackendAuthenticated(true);
        return true;
      }

      return false;
    } catch (err) {
      console.error("Session check failed:", err);
      setBackendAuthenticated(false);
      setCsrfToken(null);
      setUser(null);
      return false;
    }
  }, [apiBaseUrl]);

  // ✅ Perform handshake with backend (GET)
  const performHandshake = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn) return false;
    if (handshakeInFlight) return backendAuthenticated;

    setHandshakeInFlight(true);
    try {
      const token = await getToken({ template: jwtTemplate });
      if (!token) throw new Error("Failed to get Clerk token for backend");

      const res = await fetch(`${apiBaseUrl}/auth/handshake`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok)
        throw new Error(`Handshake failed with status ${res.status}`);

      const ok = await refreshSession();
      hasAttempted.current = true;
      return ok;
    } catch (err) {
      console.error("Backend handshake error:", err);
      setBackendAuthenticated(false);
      setCsrfToken(null);
      setUser(null);
      hasAttempted.current = true;
      return false;
    } finally {
      setHandshakeInFlight(false);
    }
  }, [
    apiBaseUrl,
    backendAuthenticated,
    getToken,
    isSignedIn,
    jwtTemplate,
    handshakeInFlight,
    refreshSession,
  ]);

  // ✅ Ensure backend authentication (with optional force)
  const ensureBackendAuth = useCallback(
    async (force?: boolean) => {
      if (!isSignedIn) return false;
      if (backendAuthenticated && !force) return true;

      const ok = await refreshSession();
      if (ok) return true;

      if (force) return performHandshake();
      return false;
    },
    [backendAuthenticated, isSignedIn, performHandshake, refreshSession],
  );

  // ✅ Sign out from backend
  const signOutFromBackend = useCallback(async () => {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore errors
    } finally {
      setBackendAuthenticated(false);
      setCsrfToken(null);
      setUser(null);
    }
  }, [apiBaseUrl]);

  // Auto-handshake when signed in
  useEffect(() => {
    const init = async () => {
      if (!isSignedIn) {
        setBackendAuthenticated(false);
        setCsrfToken(null);
        setUser(null);
        return;
      }
      const ok = await refreshSession();
      if (!ok && !hasAttempted.current) await performHandshake();
    };
    void init();
  }, [isSignedIn, refreshSession, performHandshake]);

  // Clerk sign-out → clear backend session too
  useEffect(() => {
    if (!isSignedIn && (backendAuthenticated || csrfToken)) {
      void (async () => {
        try {
          await fetch(`${apiBaseUrl}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch {}
        setBackendAuthenticated(false);
        setCsrfToken(null);
        setUser(null);
      })();
    }
  }, [isSignedIn, backendAuthenticated, csrfToken, apiBaseUrl]);

  const value = useMemo<BackendAuthContextValue>(
    () => ({
      backendAuthenticated,
      csrfToken,
      apiBaseUrl,
      ensureBackendAuth,
      signOutFromBackend,
      user,
    }),
    [
      backendAuthenticated,
      csrfToken,
      apiBaseUrl,
      ensureBackendAuth,
      signOutFromBackend,
      user,
    ],
  );

  return (
    <BackendAuthContext.Provider value={value}>
      {children}
    </BackendAuthContext.Provider>
  );
}

export function useBackendAuth(): BackendAuthContextValue {
  const ctx = useContext(BackendAuthContext);
  if (!ctx)
    throw new Error("useBackendAuth must be used within BackendAuthProvider");
  return ctx;
}
