"use client";

import { useAuth } from "@clerk/nextjs";
import { useBackendAuth } from "@/context/backend-auth";

type ApiOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  useBearer?: boolean; // force bearer per request
  retryOn401?: boolean;
};

export function useApi() {
  const { getToken } = useAuth();
  const { csrfToken, apiBaseUrl, ensureBackendAuth } = useBackendAuth();

  async function apiFetch(path: string, options: ApiOptions = {}) {
    const {
      method = "GET",
      headers = {},
      body,
      useBearer = false,
      retryOn401 = true,
    } = options;

    let reqHeaders: Record<string, string> = { ...headers };
    let url = path.startsWith("http") ? path : `${apiBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

    // Ensure backend session if not using bearer
    if (!useBearer) {
      await ensureBackendAuth();
      if (method !== "GET" && csrfToken) {
        reqHeaders["X-CSRF-Token"] = csrfToken;
      }
    } else {
      const token = await getToken({ template: process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE || "fastapi" });
      if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      credentials: useBearer ? "omit" : "include",
      headers: {
        "Content-Type": body ? "application/json" : "application/json",
        ...reqHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && retryOn401 && !useBearer) {
      // Force refresh (session check then handshake as needed) and retry once
      const ok = await ensureBackendAuth(true);
      if (ok) {
        if (method !== "GET" && csrfToken) {
          reqHeaders["X-CSRF-Token"] = csrfToken;
        }
        const retryRes = await fetch(url, {
          method,
          credentials: "include",
          headers: {
            "Content-Type": body ? "application/json" : "application/json",
            ...reqHeaders,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        return parseJson(retryRes);
      }
    }

    return parseJson(res);
  }

  return { apiFetch };
}

async function parseJson(res: Response) {
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const error: any = new Error((data && data.message) || res.statusText);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
