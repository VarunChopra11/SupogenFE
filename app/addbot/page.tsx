"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  "https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands";

type TokenResponse = {
  token?: string;
  secret?: string;
  value?: string;
  access_token?: string;
  expires_in?: number; // seconds
  ttl?: number; // seconds
  expires_at?: string; // ISO date
  expiry?: string; // ISO or timestamp string
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
    return (
      data.token || data.secret || data.value || data.access_token || ""
    );
  };

  const computeExpiry = (data: TokenResponse): number => {
    if (data.expires_at || data.expiry) {
      const ts = Date.parse(data.expires_at || data.expiry!);
      if (!Number.isNaN(ts)) return ts;
    }
    const secs = data.expires_in ?? data.ttl ?? 600; // default 10 min
    return Date.now() + secs * 1000;
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
      const data: TokenResponse = await res.json().catch(() => ({} as TokenResponse));
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
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Add Supogen to Discord
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect the bot to your server and authenticate securely.
                  </p>
                </div>
                <Badge className="hidden sm:inline-flex" variant="secondary">
                  <ShieldCheck className="mr-1 h-4 w-4" /> Secured
                </Badge>
              </div>

              <div className="grid grid-rows-1 gap-6 md:grid-rows-3">
                {/* Discord Bot Link */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>1. Invite the Discord Bot</CardTitle>
                    <CardDescription>
                      Use this link to add the bot to your server with the required permissions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Label htmlFor="discordLink">Discord OAuth URL</Label>
                    <div className="flex w-full flex-col gap-3 sm:flex-row">
                      <div className="flex-1">
                        <Snippet text={DISCORD_BOT_URL} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => handleCopy(DISCORD_BOT_URL)}
                        >
                          Copy Link
                        </Button>
                        <a
                          href={DISCORD_BOT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <Button className="w-full">
                            Open Link <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Secret Token */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>2. Get Secret Token</CardTitle>
                    <CardDescription>
                      Use this short-lived token to authenticate the bot in your server.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Secret Token</Label>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex-1 max-w-full overflow-hidden break-all">
                          {token ? (
                            <Snippet text={token} copyable={false} />
                          ) : (
                            <Input readOnly value="Generating..." />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => token && handleCopy(token)}
                            disabled={!token}
                          >
                            Copy Token
                          </Button>
                          <Button
                            variant="default"
                            className="w-full sm:w-auto"
                            onClick={fetchToken}
                            disabled={loading}
                          >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            {loading ? "Regenerating" : token ? "Regenerate" : "Generate"}
                          </Button>
                        </div>
                      </div>
                      {error && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Expires in: <span className={expired ? "text-destructive" : "text-foreground"}>{formattedRemaining}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Steps */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>3. Steps</CardTitle>
                    <CardDescription>
                      Follow these steps to link the bot with your server.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <ol className="list-decimal space-y-2 pl-5">
                      <li>
                        Open the provided Discord link and add the bot to your server or chosen channels with permissions.
                      </li>
                      <li>Copy your secret token.</li>
                      <li>
                        In your Discord server, send the command:
                        <div className="mt-2 rounded-md bg-muted p-2">
                          <code className="whitespace-pre-wrap break-all">/authenticate {"<your-secret-token>"}</code>
                        </div>
                      </li>
                      <li>Wait for the confirmation message.</li>
                      <li>
                        Done! <span role="img" aria-label="done">✅</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-8" />

              <div className="text-xs text-muted-foreground">
                Tokens are valid for 10 minutes. Regenerate if expired or compromised.
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
