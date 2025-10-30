"use client";

import { useAuth } from "@clerk/nextjs";
import { useBackendAuth } from "@/context/backend-auth";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { backendAuthenticated, ensureBackendAuth } = useBackendAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const attemptedRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for Clerk to load
      if (!clerkLoaded) {
        return;
      }

      // If not signed in with Clerk, redirect to sign in
      if (!isSignedIn) {
        if (!redirectedRef.current) {
          redirectedRef.current = true;
          router.replace("/");
        }
        return;
      }

      // If signed in with Clerk, ensure backend authentication
      if (isSignedIn && !backendAuthenticated) {
        // Only attempt once per mount to avoid loops
        if (!attemptedRef.current) {
          attemptedRef.current = true;
          const success = await ensureBackendAuth(true);
          if (!success) {
            if (!redirectedRef.current) {
              redirectedRef.current = true;
              router.replace("/backend-down");
            }
            setIsChecking(false);
            return;
          }
        } else {
          // Already attempted and still not authenticated -> single redirect
          if (!redirectedRef.current) {
            redirectedRef.current = true;
            router.replace("/backend-down");
          }
          setIsChecking(false);
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [clerkLoaded, isSignedIn, backendAuthenticated, ensureBackendAuth, router]);

  // Show loading state while checking authentication
  if (!clerkLoaded || isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated with Clerk, don't render (will redirect)
  if (!isSignedIn) {
    return null;
  }

  // If not authenticated with backend, don't render (will redirect)
  if (!backendAuthenticated) {
    return null;
  }

  // Both authentications successful, render children
  return <>{children}</>;
}
