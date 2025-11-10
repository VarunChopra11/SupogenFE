"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useBackendAuth } from "@/context/backend-auth";

export default function BackendDownPage() {
  const router = useRouter();
  const { ensureBackendAuth, backendAuthenticated } = useBackendAuth();
  const [isRetrying, setIsRetrying] = useState(false);
  const [shouldRenderPage, setShouldRenderPage] = useState(false);

  // Track latest backend auth state without re-running the effect
  const authRef = useRef(backendAuthenticated);
  useEffect(() => {
    authRef.current = backendAuthenticated;
  }, [backendAuthenticated]);

  // Before rendering this page, poll for up to 10s and redirect if auth becomes valid
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    const deadline = Date.now() + 10_000; // 10 seconds

    const tick = async () => {
      if (cancelled) return;

      // If already authenticated, redirect immediately
      if (authRef.current) {
        router.replace("/dashboard");
        return;
      }

      // Try to ensure backend auth (avoid overlapping calls)
      if (!inFlight) {
        inFlight = true;
        try {
          const ok = await ensureBackendAuth(true);
          if (ok || authRef.current) {
            router.replace("/dashboard");
            return;
          }
        } finally {
          inFlight = false;
        }
      }

      // Stop polling after deadline and render the fallback page
      if (Date.now() >= deadline) {
        if (!cancelled) setShouldRenderPage(true);
        return;
      }

      timer = setTimeout(tick, 1000); // poll every 1s
    };

    // start polling loop
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [ensureBackendAuth, router]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const success = await ensureBackendAuth(true);
      if (success) router.push("/dashboard");
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't render the fallback UI during the pre-check window
  if (!shouldRenderPage) return null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Connection Failed</CardTitle>
          </div>
          <CardDescription>Unable to authenticate with server.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your Authentication is valid, but we couldn't establish a session
            with our servers. This might be due to:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            <li>The backend server is temporarily unavailable</li>
            <li>Network connectivity issues</li>
            <li>Session expired or invalid</li>
          </ul>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-1/2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full sm:w-1/2"
          >
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
