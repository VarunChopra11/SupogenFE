"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { Skeleton } from "@/components/ui/skeleton";

type Server = {
  server_id: string;
  server_name: string;
  member_count: number;
};

type DocumentItem = {
  document_id: string;
  user_id: string;
  server_id: string;
  document_url: string;
  created_at: string;
};

export default function Page() {
  const [entries, setEntries] = useState<
    { type: "url" | "pdf"; value: string }[]
  >([]);
  const [url, setUrl] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  // servers/documents state
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [servers, setServers] = useState<Server[]>([]);
  const [serversLoading, setServersLoading] = useState<boolean>(false);
  const [serversError, setServersError] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  // Tracks only the POST /documents/embed_docs lifecycle for overlay
  const [embedSubmitting, setEmbedSubmitting] = useState<boolean>(false);

  // ✅ URL Validation
  const validateUrl = (value: string) => {
    try {
      const urlObj = new URL(value);
      return urlObj.protocol === "https:" || urlObj.protocol === "http:";
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    if (value.trim() === "") {
      setIsValidUrl(null);
    } else {
      setIsValidUrl(validateUrl(value));
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!url || !isValidUrl) return;
    if (!selectedServerId) {
      setSubmitError("Please select a server before submitting.");
      return;
    }

    try {
      setSubmitLoading(true);
      setEmbedSubmitting(true);
      const res = await authenticatedFetch("/documents/embed_docs", {
        method: "POST",
        body: JSON.stringify({
          document_url: url,
          server_id: selectedServerId,
        }),
      });
      // Hide the overlay as soon as the POST responds (success or error)
      setEmbedSubmitting(false);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to embed document (${res.status})`);
      }
      // Clear the url and refresh documents list
      setUrl("");
      setIsValidUrl(null);
      setSubmitSuccess("Document Added");
      // Refresh documents for the selected server
      setDocumentsLoading(true);
      setDocumentsError(null);
      try {
        const docsRes = await authenticatedFetch(
          `/documents/get_documents/${selectedServerId}`,
          { method: "GET" }
        );
        if (docsRes.ok) {
          const data = (await docsRes.json()) as DocumentItem[];
          setDocuments(Array.isArray(data) ? data : []);
        } else {
          setDocumentsError(`Failed to reload documents (${docsRes.status})`);
        }
      } finally {
        setDocumentsLoading(false);
      }
    } catch (e: any) {
      // Ensure overlay is hidden on error as well
      setEmbedSubmitting(false);
      setSubmitError(e?.message || "Failed to submit document.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const isDisabled = !url || !isValidUrl || !selectedServerId;

  // Fetch servers on mount
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function loadServers() {
      try {
        setServersLoading(true);
        setServersError(null);
        const res = await authenticatedFetch("/auth/discord/get_servers", {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Failed to load servers (${res.status})`);
        const data = (await res.json()) as { servers: Server[] };
        console.log(data);

        if (!active) return;
        setServers(Array.isArray(data?.servers) ? data.servers : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setServersError(e?.message || "Failed to load servers");
      } finally {
        setServersLoading(false);
      }
    }
    loadServers();
    return () => {
      active = false;
      controller.abort();
    };
  }, [authenticatedFetch]);

  // Fetch documents when a server is selected
  useEffect(() => {
    if (!selectedServerId) return;
    let active = true;
    const controller = new AbortController();
    async function loadDocuments() {
      try {
        setDocumentsLoading(true);
        setDocumentsError(null);
        const res = await authenticatedFetch(
          `/documents/get_documents/${selectedServerId}`,
          { method: "GET", signal: controller.signal }
        );
        if (!res.ok)
          throw new Error(`Failed to load documents (${res.status})`);
        const data = (await res.json()) as DocumentItem[];
        if (!active) return;
        setDocuments(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setDocumentsError(e?.message || "Failed to load documents");
      } finally {
        setDocumentsLoading(false);
      }
    }
    loadDocuments();
    return () => {
      active = false;
      controller.abort();
    };
  }, [authenticatedFetch, selectedServerId]);

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
          <div className="flex flex-1 flex-col p-6 gap-6">
            {/* Select a Server Section */}
            <Card className="w-full max-w-5xl mx-auto">
              <CardHeader>
                <CardTitle>Select a Server</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 ">
                <div
                  className="thin-scrollbar flex gap-3 overflow-x-auto pb-2 px-1 "
                  aria-busy={serversLoading}
                >
                  {serversLoading && (
                    <div className="flex gap-3 ">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="min-w-[220px] h-24 rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  {!serversLoading && serversError && (
                    <div className="text-sm text-red-500">{serversError}</div>
                  )}
                  {!serversLoading && !serversError && servers.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No servers found.
                    </div>
                  )}
                  {!serversLoading &&
                    !serversError &&
                    servers.map((s) => {
                      const selected = s.server_id === selectedServerId;
                      return (
                        <button
                          key={s.server_id}
                          type="button"
                          onClick={() => setSelectedServerId(s.server_id)}
                          className={
                            "text-left min-w-[220px] p-4 border rounded-lg bg-white/50 hover:bg-white transition-colors shadow-sm  cursor-pointer" +
                            (selected
                              ? " ring-2 ring-blue-500"
                              : " border-gray-200")
                          }
                        >
                          <div className="font-medium line-clamp-1">
                            {s.server_name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Members: {s.member_count}
                          </div>
                          {selected && (
                            <div className="mt-2 inline-block text-[10px] uppercase tracking-wide text-blue-600">
                              Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Add Your Resources Section */}
            <Card className="w-full max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Add Your Resources</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* URL Input */}
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Enter your docs page URL (e.g. https://example.com/docs/introduction)"
                    value={url}
                    onChange={handleUrlChange}
                  />
                  {isValidUrl === false && (
                    <p className="text-sm text-red-500">
                      Please enter a valid URL starting with https://
                    </p>
                  )}
                </div>

                {/* PDF Upload (disabled for now) */}
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="application/pdf"
                    disabled
                    onChange={() => {}}
                  />
                  <p className="text-sm text-muted-foreground">
                    PDF uploads are temporarily disabled. Please use a URL.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isDisabled || submitLoading}
                    className="w-full cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {submitLoading ? "Submitting..." : "Submit"}
                  </Button>
                  {submitError && (
                    <p className="mt-2 text-sm text-red-500">{submitError}</p>
                  )}
                  {submitSuccess && (
                    <p className="mt-2 text-sm text-green-600">
                      {submitSuccess}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Display Added Resources */}
            <Card className="w-full max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Previously Added</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {!selectedServerId && (
                  <p className="text-muted-foreground text-sm">
                    Select a server above to view its documents.
                  </p>
                )}

                {selectedServerId && documentsLoading && (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                )}

                {selectedServerId && !documentsLoading && documentsError && (
                  <p className="text-sm text-red-500">{documentsError}</p>
                )}

                {selectedServerId && !documentsLoading && !documentsError && (
                  <div className="flex flex-col gap-3">
                    {documents.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No documents found for this server.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {documents.map((doc, idx) => (
                          <div
                            key={doc.document_id}
                            className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white/60 p-3 shadow-sm transition hover:bg-white hover:shadow-md dark:border-gray-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-900"
                          >
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <a
                                href={doc.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center h-full truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
                                title={doc.document_url}
                              >
                                {doc.document_url}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
      {embedSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Submitting…</span>
          </div>
        </div>
      )}
      {/* Local thin light-grey scrollbar styles for the servers scroller */}
      <style jsx global>{`
        .thin-scrollbar {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: #d1d5db transparent; /* thumb color, track color */
        }
        .thin-scrollbar::-webkit-scrollbar {
          height: 6px; /* horizontal scrollbar height */
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d1d5db; /* light grey */
          border-radius: 9999px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </ProtectedRoute>
  );
}
