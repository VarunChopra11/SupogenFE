"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PlaygroundSidebar } from "@/components/playground/PlaygroundSidebar";
import { ChatArea } from "@/components/playground/ChatArea";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";

// Types based on backend schema
interface DiscordBotPermissions {
  permissions_value?: number | null;
  is_authenticated: boolean;
  admin: boolean;
}

interface DiscordServer {
  user_id: string;
  server_id: string;
  server_name: string;
  owner_username?: string | null;
  member_count?: number | null;
  bot_permissions: DiscordBotPermissions;
  joined_at: string;
}

interface Server {
  id: string;
  name: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  sources?: string[];
}

interface ChatThread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export default function PlaygroundPage() {
  const { authenticatedFetch, apiBaseUrl } = useAuthenticatedFetch();
  const [servers, setServers] = React.useState<Server[]>([]);
  const [isLoadingServers, setIsLoadingServers] = React.useState(true);
  const [selectedServerId, setSelectedServerId] = React.useState<
    string | undefined
  >();
  const [selectedThreadId, setSelectedThreadId] = React.useState<
    string | undefined
  >();
  const [chatThreads, setChatThreads] = React.useState<ChatThread[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Fetch servers on component mount
  React.useEffect(() => {
    const fetchServers = async () => {
      try {
        setIsLoadingServers(true);
        const response = await authenticatedFetch("/auth/discord/get_servers", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch servers");
        }

        const data = await response.json();
        const discordServers: DiscordServer[] = data.servers || [];
        
        // Transform Discord servers to Server format
        const transformedServers: Server[] = discordServers.map((server) => ({
          id: server.server_id,
          name: server.server_name,
        }));

        setServers(transformedServers);
        
        // Auto-select first server if available
        if (transformedServers.length > 0) {
          setSelectedServerId(transformedServers[0].id);
        }
      } catch (error) {
        console.error("Error fetching servers:", error);
        // Optionally show toast notification
      } finally {
        setIsLoadingServers(false);
      }
    };

    fetchServers();
  }, [authenticatedFetch]);

  const handleServerChange = (serverId: string) => {
    setSelectedServerId(serverId);
    // Optionally reload threads for the new server
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    // TODO: Load messages for the selected thread from backend/local storage
    // For now, just clear messages when switching threads
    setMessages([]);
  };

  const handleNewThread = () => {
    const newThread = {
      id: `thread-${Date.now()}`,
      title: "New Chat",
      lastMessage: "",
      timestamp: new Date(),
    };
    setChatThreads([newThread, ...chatThreads]);
    setSelectedThreadId(newThread.id);
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Check if a server is selected
    if (!selectedServerId) {
      console.error("No server selected");
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "Please select a server before sending a message.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Auto-create thread if none exists
    let currentThreadId = selectedThreadId;
    if (!currentThreadId) {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: content.substring(0, 30) + (content.length > 30 ? "..." : ""),
        lastMessage: content,
        timestamp: new Date(),
      };
      setChatThreads((prev) => [newThread, ...prev]);
      setSelectedThreadId(newThread.id);
      currentThreadId = newThread.id;
    }

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Start loading
    setIsLoading(true);

    try {
      // Prepare request body according to ChatRequest schema
      const requestBody = {
        query: content,
        server_id: selectedServerId,
        top_k: 4,
      };

      const response = await authenticatedFetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      // Handle SSE streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let assistantMessageId = `msg-${Date.now() + 1}`;
      let accumulatedContent = "";
      let sources: string[] = [];

      // Add initial empty assistant message
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: false });
        const lines = buffer.split("\n");
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse SSE format: "event: eventName" or "data: json"
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7).trim();
            
            if (eventType === "done") {
              // Stream complete
              break;
            } else if (eventType === "error") {
              // Error event will have data in next line
              continue;
            } else if (eventType === "sources") {
              // Sources event will have data in next line
              continue;
            }
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            
            if (dataStr === "null" || dataStr === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);

              // Check if it's sources array
              if (Array.isArray(parsed)) {
                sources = parsed;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, sources }
                      : msg
                  )
                );
              } 
              // Check if it's a content delta (from OpenAI streaming)
              else if (typeof parsed === "string") {
                accumulatedContent += parsed;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }
              // Handle error event data
              else if (parsed.message) {
                throw new Error(parsed.message);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                console.error("SSE parse error:", e);
                throw e;
              }
            }
          }
        }
      }

      // Update thread last message and title if auto-created
      if (currentThreadId) {
        setChatThreads((prev) =>
          prev.map((thread) =>
            thread.id === currentThreadId
              ? {
                  ...thread,
                  lastMessage: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
                  timestamp: new Date(),
                }
              : thread
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
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
          <div className="flex h-[calc(100vh-var(--header-height))] flex-1">
            {/* Internal Playground Sidebar */}
            <PlaygroundSidebar
              servers={servers}
              chatThreads={chatThreads}
              selectedServerId={selectedServerId}
              selectedThreadId={selectedThreadId}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
              onServerChange={handleServerChange}
              onThreadSelect={handleThreadSelect}
              onNewThread={handleNewThread}
              isLoadingServers={isLoadingServers}
            />

            {/* Chat Area */}
            <ChatArea
              threadId={selectedThreadId}
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
