"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Info } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type Forum = {
  forum_id: string;
  forum_name: string;
};
type Server = {
  server_id: string;
  server_name: string;
  member_count: number;
  forums?: Forum[];
  selected_forums?: string[] | Forum[];
};

type Channel = { id: string; name: string };

type DocumentItem = {
  document_id: string;
  user_id: string;
  server_id: string;
  document_url: string;
  created_at: string;
};

// Tooltip component for info icons
const InfoTooltip = ({ description }: { description: string }) => {
  return (
    <div className="relative inline-block group cursor-default">
      <Info className="h-3 w-3 text-muted-foreground" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[200px] text-center">
        {description}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
      </div>
    </div>
  );
};

export default function Page() {
  const [entries, setEntries] = useState<
    { type: "url" | "pdf"; value: string }[]
  >([]);
  const [url, setUrl] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
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
  const [embedSubmitting, setEmbedSubmitting] = useState<boolean>(false);

  // Channels state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [channelsLoading, setChannelsLoading] = useState<boolean>(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [saveChannelsLoading, setSaveChannelsLoading] = useState(false);
  const [saveChannelsError, setSaveChannelsError] = useState<string | null>(null);

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
      setEmbedSubmitting(false);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to embed document (${res.status})`);
      }
      setUrl("");
      setIsValidUrl(null);
      setSubmitSuccess("Document Added");
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
        const res = await authenticatedFetch("/discord/get_servers", {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Failed to load servers (${res.status})`);
        const data = (await res.json()) as { servers: Server[] };
        console.log(data);

        if (!active) return;
        const serverList = Array.isArray(data?.servers) ? data.servers : [];
        setServers(serverList);
        
        if (serverList.length > 0 && !selectedServerId) {
          setSelectedServerId(serverList[0].server_id);
        }
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

  // Derive channels from selected server
  useEffect(() => {
    if (!selectedServerId) {
      setChannels([]);
      setSelectedChannels([]);
      return;
    }

    const server = servers.find((s) => s.server_id === selectedServerId);
    if (!server) {
      setChannels([]);
      setSelectedChannels([]);
      return;
    }

    setChannelsLoading(true);
    setChannelsError(null);
    try {
      const forums = Array.isArray(server.forums) ? server.forums : [];
      const mapped: Channel[] = forums.map((f) => ({ id: f.forum_id, name: f.forum_name }));
      setChannels(mapped);

      if (Array.isArray(server.selected_forums)) {
        const sel = (server.selected_forums as any[]).map((sf) =>
          typeof sf === "string" ? sf : sf?.forum_id
        );
        setSelectedChannels(sel.filter(Boolean));
      } else {
        setSelectedChannels([]);
      }
    } catch (e: any) {
      setChannelsError(e?.message || "Failed to load channels from server data");
      setChannels([]);
      setSelectedChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  }, [servers, selectedServerId]);

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAllChannels = () => {
    if (selectedChannels.length === channels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(channels.map(ch => ch.id));
    }
  };

  const allChannelsSelected = useMemo(
    () => channels.length > 0 && selectedChannels.length === channels.length,
    [channels, selectedChannels]
  );

  const someChannelsSelected = useMemo(
    () => selectedChannels.length > 0 && selectedChannels.length < channels.length,
    [channels, selectedChannels]
  );

  const handleSaveChannels = async () => {
    if (!selectedServerId) return;
    setSaveChannelsError(null);
    try {
      setSaveChannelsLoading(true);
      // Build payload as array of objects with forum_id and forum_name
      const selectedForumsPayload = selectedChannels.map((id) => {
        const ch = channels.find((c) => c.id === id);
        return {
          forum_id: id,
          forum_name: ch?.name ?? "",
        };
      });

      const res = await authenticatedFetch(
        "/discord/update_selected_forums",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            server_id: selectedServerId,
            selected_forums: selectedForumsPayload,
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to save (${res.status})`);
      }
      toast.success("Channels updated successfully");
    } catch (e: any) {
      const msg = e?.message || "Failed to update channels";
      setSaveChannelsError(msg);
      toast.error(msg);
    } finally {
      setSaveChannelsLoading(false);
    }
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
          <div className="flex flex-1 flex-col p-4 md:p-6 gap-6 max-w-7xl mx-auto w-full">
            {/* Server Selection */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Select Server</CardTitle>
                  <InfoTooltip description="Choose the Discord server where you want to add resources and configure channels for context" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {serversLoading ? (
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-10 w-full max-w-md" />
                    </div>
                  ) : serversError ? (
                    <p className="text-sm text-red-500">{serversError}</p>
                  ) : servers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No servers found.</p>
                  ) : (
                    <Select
                      value={selectedServerId || undefined}
                      onValueChange={(val) => setSelectedServerId(val)}
                    >
                      <SelectTrigger className="w-full max-w-md cursor-pointer">
                        <SelectValue placeholder="Select a server" />
                      </SelectTrigger>
                      <SelectContent>
                        {servers.map((s) => (
                          <SelectItem 
                            key={s.server_id} 
                            value={s.server_id}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{s.server_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add Your Resources Section */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Add Your Resources</CardTitle>
                  <InfoTooltip description="Add documentation URLs or PDF files that will be used to provide context for AI responses in your Discord server" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* URL Input */}
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium">Documentation URL</label>
                  <Input
                    placeholder="https://example.com/docs/introduction"
                    value={url}
                    onChange={handleUrlChange}
                    className={`${isValidUrl === false ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {isValidUrl === false && (
                    <p className="text-sm text-red-500">
                      Please enter a valid URL starting with https://
                    </p>
                  )}
                </div>

                {/* PDF Upload (disabled for now) */}
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium">PDF File</label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    disabled
                    className="cursor-not-allowed opacity-50"
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
                    className="w-full max-w-xs cursor-pointer transition-all duration-200 hover:shadow-md"
                    size="lg"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Resource
                      </>
                    )}
                  </Button>
                  {submitError && (
                    <p className="mt-3 text-sm text-red-500">{submitError}</p>
                  )}
                  {submitSuccess && (
                    <p className="mt-3 text-sm text-green-600 font-medium">
                      {submitSuccess}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Channel Selection */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Select Channels for Context</CardTitle>
                  <InfoTooltip description="Select the channels whose messages will be used as context by the bot when responding to bot-tagged queries in the Discord server." />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {!selectedServerId && (
                  <p className="text-sm text-muted-foreground">Select a server first to view available channels.</p>
                )}

                {selectedServerId && channelsLoading && (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-5 flex-1" />
                      </div>
                    ))}
                  </div>
                )}

                {selectedServerId && !channelsLoading && channelsError && (
                  <p className="text-sm text-red-500">{channelsError}</p>
                )}

                {selectedServerId && !channelsLoading && !channelsError && channels.length === 0 && (
                  <p className="text-sm text-muted-foreground">No channels available for this server.</p>
                )}

                {selectedServerId && !channelsLoading && !channelsError && channels.length > 0 && (
                  <>
                    <div className="flex flex-col gap-4">
                      {/* Select All checkbox */}
                      <div className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/50">
                        <Checkbox
                          id="select-all-channels"
                          checked={allChannelsSelected || someChannelsSelected}
                          onCheckedChange={toggleAllChannels}
                          className="cursor-pointer"
                        />
                        <label
                          htmlFor="select-all-channels"
                          className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Select All Channels
                        </label>
                      </div>

                      {/* Channels list */}
                      <ScrollArea className="h-[200px] rounded-md border">
                        <div className="p-4 space-y-3">
                          {channels.map((channel) => (
                            <div
                              key={channel.id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => toggleChannel(channel.id)}
                            >
                              <Checkbox
                                id={`channel-${channel.id}`}
                                checked={selectedChannels.includes(channel.id)}
                                onCheckedChange={() => toggleChannel(channel.id)}
                                className="cursor-pointer"
                              />
                              <label
                                htmlFor={`channel-${channel.id}`}
                                className="text-sm font-medium leading-none flex-1 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {channel.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Selected channels summary */}
                      {selectedChannels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground">
                            Selected: {selectedChannels.length} of {channels.length} channels
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Save Changes Button */}
                    <div className="pt-4">
                      <Button
                        onClick={handleSaveChannels}
                        disabled={!selectedServerId || saveChannelsLoading}
                        className="cursor-pointer transition-all duration-200 hover:shadow-md"
                        size="lg"
                      >
                        {saveChannelsLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Channel Selection"
                        )}
                      </Button>
                      {saveChannelsError && (
                        <p className="mt-2 text-sm text-red-500">{saveChannelsError}</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Previously Added Resources */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Previously Added Resources</CardTitle>
                  <InfoTooltip description="View all resources that have been previously added to this server. These resources are used to provide context for AI responses." />
                </div>
              </CardHeader>
              <CardContent>
                {!selectedServerId && (
                  <p className="text-muted-foreground text-sm">
                    Select a server above to view its documents.
                  </p>
                )}

                {selectedServerId && documentsLoading && (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                )}

                {selectedServerId && !documentsLoading && documentsError && (
                  <p className="text-sm text-red-500">{documentsError}</p>
                )}

                {selectedServerId && !documentsLoading && !documentsError && (
                  <div className="flex flex-col gap-4">
                    {documents.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        No resources added yet. Add your first resource above.
                      </p>
                    ) : (
                      <div className="grid gap-3">
                        {documents.map((doc, idx) => (
                          <div
                            key={doc.document_id}
                            className="group flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <a
                                href={doc.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sm text-primary hover:underline truncate font-medium"
                                title={doc.document_url}
                              >
                                {doc.document_url}
                              </a>
                              <p className="text-xs text-muted-foreground mt-1">
                                Added {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              URL
                            </Badge>
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
      
      {/* Loading Overlay */}
      {embedSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border bg-card px-6 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Submitting your resource...</span>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}