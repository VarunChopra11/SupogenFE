"use client";

import { useState } from "react";
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
  const { ensureBackendAuth } = useBackendAuth();
  const [isRetrying, setIsRetrying] = useState(false);

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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Backend Authentication Failed</CardTitle>
          </div>
          <CardDescription>
            Unable to authenticate with the backend server.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your Clerk authentication is valid, but we couldn’t establish a session with our backend server. 
            This might be due to:
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
