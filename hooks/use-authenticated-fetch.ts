"use client";

import { useBackendAuth } from "@/context/backend-auth";
import { useCallback } from "react";

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export function useAuthenticatedFetch() {
  const { csrfToken, apiBaseUrl, ensureBackendAuth } = useBackendAuth();

  const authenticatedFetch = useCallback(
    async (endpoint: string, options: FetchOptions = {}) => {
      const { skipAuth = false, ...fetchOptions } = options;

      // Ensure backend authentication before making the request
      if (!skipAuth) {
        const isAuthenticated = await ensureBackendAuth();
        if (!isAuthenticated) {
          throw new Error("Backend authentication required");
        }
      }

      // Prepare headers
      const headers: Record<string, string> = {
        ...(fetchOptions.headers as Record<string, string>),
      };

      // Add CSRF token for state-changing operations
      if (
        csrfToken &&
        (fetchOptions.method === "POST" ||
          fetchOptions.method === "PUT" ||
          fetchOptions.method === "DELETE" ||
          fetchOptions.method === "PATCH")
      ) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      // Add Content-Type header if body is present and not FormData
      if (
        fetchOptions.body &&
        !(fetchOptions.body instanceof FormData) &&
        !headers["Content-Type"]
      ) {
        headers["Content-Type"] = "application/json";
      }

      // Make the request
      const url = endpoint.startsWith("http")
        ? endpoint
        : `${apiBaseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: "include",
      });

      return response;
    },
    [csrfToken, apiBaseUrl, ensureBackendAuth]
  );

  return { authenticatedFetch, apiBaseUrl, csrfToken };
}
