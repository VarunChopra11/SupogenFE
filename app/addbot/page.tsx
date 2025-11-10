"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Snippet } from "@/components/ui/snippet-1";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { Clock, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DISCORD_BOT_URL =
  (process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "development"
    ? "https://discord.com/oauth2/authorize?client_id=1427304496291119177&permissions=8&scope=bot%20applications.commands"
    : "https://discord.com/oauth2/authorize?client_id=1432309525444038797&permissions=8&scope=bot%20applications.commands");

type TokenResponse = {
  token?: string;
  secret?: string;
  value?: string;
  access_token?: string;
  expires_in?: number;
  ttl?: number;
  expires_at?: string;
  expiry?: string;
};

export default function AddBotPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [token, setToken] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formattedRemaining = useMemo(() => {
    const secs = Math.max(0, remaining);
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  const startTimer = useCallback((expiryMs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const update = () => {
      const diff = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    timerRef.current = setInterval(update, 1000);
  }, []);

  const extractToken = (data: TokenResponse): string => {
    return data.token || data.secret || data.value || data.access_token || "";
  };

  const computeExpiry = (data: TokenResponse): number => {
    const expiryString = data.expires_at ?? data.expiry;

    if (expiryString) {
      const ts = Date.parse(expiryString);
      if (!Number.isNaN(ts)) return ts;
    }

    return Date.now() + 3600 * 1000; // fallback
  };

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authenticatedFetch("/auth/discord/token", {
        method: "GET",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed with ${res.status}`);
      }
      const data: TokenResponse = await res
        .json()
        .catch(() => ({} as TokenResponse));
      const newToken = extractToken(data);
      const expiryMs = computeExpiry(data);
      setToken(newToken);
      setExpiresAt(expiryMs);
      startTimer(expiryMs);
    } catch (e: any) {
      setError(e?.message || "Failed to generate token");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, startTimer]);

  useEffect(() => {
    void fetchToken();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchToken]);

  const expired = expiresAt ? Date.now() >= expiresAt : false;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <ProtectedRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
              <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Add Supogen to Discord
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect the bot to your server and authenticate securely.
                  </p>
                </div>
                <Badge variant="secondary">
                  <ShieldCheck className="mr-1 h-4 w-4" /> Secured
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 1. Invite Bot */}
                <Card>
                  <CardHeader>
                    <CardTitle>1. Invite the Discord Bot</CardTitle>
                    <CardDescription>
                      Use this link to add the bot to your server with required
                      permissions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Label>Discord OAuth URL</Label>
                    <div className="rounded-md border bg-muted/50 p-2 overflow-hidden">
                      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
                        <code className="block min-w-max whitespace-pre text-xs sm:text-sm font-mono leading-6">
                          {DISCORD_BOT_URL}
                        </code>
                      </div>
                    </div>

                    {/* Centered buttons */}
                    <div className="flex justify-center items-center gap-3 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => handleCopy(DISCORD_BOT_URL)}
                        className="cursor-pointer"
                      >
                        Copy Link
                      </Button>
                      <a
                        href={DISCORD_BOT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button>
                          Open Link <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Secret Token */}
                <Card>
                  <CardHeader>
                    <CardTitle>2. Get Secret Token</CardTitle>
                    <CardDescription>
                      Use this short-lived token to authenticate the bot in your
                      server.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Label className="mt-5.5 block">Secret Token</Label>
                    <div className="rounded-md border bg-muted/50 p-2 overflow-hidden">
                      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
                        {token ? (
                          <code className="block min-w-max whitespace-pre text-xs sm:text-sm font-mono leading-6">
                            {token}
                          </code>
                        ) : (
                          <Input readOnly value="Generating..." />
                        )}
                      </div>
                    </div>

                    {/* Inline buttons + expiry */}
                    <div className="flex justify-center items-center gap-3 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => token && handleCopy(token)}
                        disabled={!token}
                      >
                        Copy Token
                      </Button>
                      <Button
                        variant="default"
                        onClick={fetchToken}
                        disabled={loading}
                      >
                        <RefreshCw
                          className={`mr-2 h-4 w-4 ${
                            loading ? "animate-spin" : ""
                          }`}
                        />
                        {loading
                          ? "Regenerating"
                          : token
                          ? "Regenerate"
                          : "Generate"}
                      </Button>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span
                          className={
                            expired
                              ? "text-destructive font-medium"
                              : "text-foreground"
                          }
                        >
                          {formattedRemaining}
                        </span>
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-destructive text-center">
                        {error}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* 3. Steps */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>3. Steps</CardTitle>
                    <CardDescription>
                      Follow these steps to link the bot with your server.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <ol className="list-decimal space-y-2 pl-5">
                      <li>
                        Open the provided Discord link and add the bot to your
                        server or channels.
                      </li>
                      <li>Copy your secret token.</li>
                      <li>
                        In your Discord server, within 5 minutes of token
                        generation, send the command:
                        <div className="mt-2 rounded-md bg-muted p-2">
                          <code className="whitespace-pre-wrap break-all">
                            /authenticate {"<your-secret-token>"}
                          </code>
                        </div>
                      </li>
                      <li>Wait for the confirmation message.</li>
                      <li>Done! ✅</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-8" />
              <div className="text-xs text-muted-foreground text-center">
                Secret Token is valid for 5 minutes. Regenerate if expired or
                compromised.
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
