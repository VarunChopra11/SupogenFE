"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PlaygroundSidebar } from "@/components/playground/PlaygroundSidebar";
import { ChatArea } from "@/components/playground/ChatArea";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { useIsMobile } from "@/hooks/use-mobile";

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

export interface MessageType {
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

// Backend API types
interface BackendMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface BackendChatHistory {
  chat_id: string;
  user_id: string;
  server_id: string;
  messages: BackendMessage[];
  created_at: string;
  updated_at: string;
}

export default function PlaygroundPage() {
  const { authenticatedFetch, apiBaseUrl } = useAuthenticatedFetch();
  const isMobile = useIsMobile();
  const [servers, setServers] = React.useState<Server[]>([]);
  const [isLoadingServers, setIsLoadingServers] = React.useState(true);
  const [selectedServerId, setSelectedServerId] = React.useState<
    string | undefined
  >();
  const [selectedThreadId, setSelectedThreadId] = React.useState<
    string | undefined
  >();
  const [chatThreads, setChatThreads] = React.useState<ChatThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = React.useState(false);
  const [messages, setMessages] = React.useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const [status, setStatus] = React.useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");

  // Auto-collapse sidebar on mobile
  React.useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobile]);

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

  // Fetch chat history when server changes
  React.useEffect(() => {
    const fetchChatHistory = async () => {
      if (!selectedServerId) {
        setChatThreads([]);
        return;
      }

      try {
        setIsLoadingThreads(true);
        const response = await authenticatedFetch(
          `/chat_history?server_id=${selectedServerId}&limit=20`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch chat history");
        }

        const chatHistoryData: BackendChatHistory[] = await response.json();

        // Transform backend chat history to ChatThread format
        const transformedThreads: ChatThread[] = chatHistoryData.map((chat) => {
          const lastMessage =
            chat.messages.length > 0
              ? chat.messages[chat.messages.length - 1].content
              : "";
          const firstUserMessage =
            chat.messages.find((msg) => msg.role === "user")?.content ||
            "New Chat";

          return {
            id: chat.chat_id,
            title:
              firstUserMessage.substring(0, 30) +
              (firstUserMessage.length > 30 ? "..." : ""),
            lastMessage:
              lastMessage.substring(0, 50) +
              (lastMessage.length > 50 ? "..." : ""),
            timestamp: new Date(chat.updated_at),
          };
        });

        setChatThreads(transformedThreads);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setChatThreads([]);
      } finally {
        setIsLoadingThreads(false);
      }
    };

    fetchChatHistory();
  }, [selectedServerId, authenticatedFetch]);

  const handleServerChange = (serverId: string) => {
    setSelectedServerId(serverId);
    setSelectedThreadId(undefined);
    setMessages([]);
  };

  const handleThreadSelect = async (threadId: string) => {
    setSelectedThreadId(threadId);

    try {
      // Use a separate loading state or don't set isLoading here
      // since isLoading should only be for sending messages
      const response = await authenticatedFetch(`/chat/${threadId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat");
      }

      const chatData: BackendChatHistory = await response.json();

      // Transform backend messages to Message format
      const transformedMessages: MessageType[] = chatData.messages.map(
        (msg, index) => ({
          id: `${chatData.chat_id}-${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        })
      );

      setMessages(transformedMessages);
    } catch (error) {
      console.error("Error fetching chat:", error);
      setMessages([]);
    }
  };

  const handleNewThread = () => {
    // Clear the selected thread and messages to start a new conversation
    // The actual thread will be created on the backend when the first message is sent
    setSelectedThreadId(undefined);
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Check if a server is selected
    if (!selectedServerId) {
      setStatus("error");
      console.error("No server selected");
      const errorMessage: MessageType = {
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
    const userMessage: MessageType = {
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
      // Include chat_id if a thread is selected (continuing existing chat)
      // Otherwise, backend will create a new chat
      const requestBody: {
        query: string;
        server_id: string;
        top_k: number;
        chat_id?: string;
      } = {
        query: content,
        server_id: selectedServerId,
        top_k: 4,
      };

      setStatus("submitted");
      // Only include chat_id if we're in an existing chat thread
      if (selectedThreadId) {
        requestBody.chat_id = selectedThreadId;
      }

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
      const assistantMessage: MessageType = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      let buffer = "";

      while (true) {
        setStatus("streaming");
        const { done, value } = await reader.read();

        if (done) {
          setStatus("ready");
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
                    msg.id === assistantMessageId ? { ...msg, sources } : msg
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
              if (
                e instanceof Error &&
                e.message !== "Unexpected end of JSON input"
              ) {
                console.error("SSE parse error:", e);
                throw e;
              }
            }
          }
        }
      }

      // After message is sent successfully, refresh chat history to get the updated/new chat
      if (selectedServerId) {
        try {
          const historyResponse = await authenticatedFetch(
            `/chat_history?server_id=${selectedServerId}&limit=20`,
            {
              method: "GET",
            }
          );

          if (historyResponse.ok) {
            const chatHistoryData: BackendChatHistory[] =
              await historyResponse.json();

            const transformedThreads: ChatThread[] = chatHistoryData.map(
              (chat) => {
                const lastMessage =
                  chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].content
                    : "";
                const firstUserMessage =
                  chat.messages.find((msg) => msg.role === "user")?.content ||
                  "New Chat";

                return {
                  id: chat.chat_id,
                  title:
                    firstUserMessage.substring(0, 30) +
                    (firstUserMessage.length > 30 ? "..." : ""),
                  lastMessage:
                    lastMessage.substring(0, 50) +
                    (lastMessage.length > 50 ? "..." : ""),
                  timestamp: new Date(chat.updated_at),
                };
              }
            );

            setChatThreads(transformedThreads);

            // If this was a new thread, select the most recent one
            if (!selectedThreadId && transformedThreads.length > 0) {
              setSelectedThreadId(transformedThreads[0].id);
            }
          }
        } catch (error) {
          console.error("Error refreshing chat history:", error);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus("error");
      // Add error message
      const errorMessage: MessageType = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
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
        className="h-screen overflow-hidden"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "3rem",
          } as React.CSSProperties
        }
      >
        {/* Global App Sidebar - Now visible on all screen sizes */}
        <AppSidebar variant="inset" />

        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <SiteHeader />
          <div className="flex h-[calc(100vh-3rem)] md:h-[calc(100vh-var(--header-height))] flex-1 relative overflow-hidden">
            {/* Internal Playground Sidebar - Responsive */}
            <div className="relative" style={{ overflow: "visible" }}>
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
            </div>

            {/* Chat Area - Full width on mobile, adjusted on desktop */}
            <div className="flex-1 min-w-0">
              <ChatArea
                threadId={selectedThreadId}
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                status={status}
              />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
