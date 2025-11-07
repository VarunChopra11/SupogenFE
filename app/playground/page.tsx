"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PlaygroundSidebar } from "@/components/playground/PlaygroundSidebar";
import { ChatArea } from "@/components/playground/ChatArea";

// Mock data - replace with actual data fetching
const MOCK_SERVERS = [
  { id: "1", name: "Production Server" },
  { id: "2", name: "Development Server" },
  { id: "3", name: "Staging Server" },
];

const MOCK_THREADS = [
  {
    id: "1",
    title: "Welcome Chat",
    lastMessage: "How can I help you today?",
    timestamp: new Date(),
  },
  {
    id: "2",
    title: "Bug Investigation",
    lastMessage: "Let me check the logs...",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: "3",
    title: "Feature Request",
    lastMessage: "That sounds like a great idea!",
    timestamp: new Date(Date.now() - 7200000),
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function PlaygroundPage() {
  const [selectedServerId, setSelectedServerId] = React.useState<
    string | undefined
  >(MOCK_SERVERS[0]?.id);
  const [selectedThreadId, setSelectedThreadId] = React.useState<
    string | undefined
  >();
  const [chatThreads, setChatThreads] = React.useState(MOCK_THREADS);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const handleServerChange = (serverId: string) => {
    setSelectedServerId(serverId);
    // Optionally reload threads for the new server
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    // Load messages for the selected thread
    // For now, using mock data
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "Hello! How can I assist you today?",
        timestamp: new Date(Date.now() - 60000),
      },
    ]);
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

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate loading
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content:
          "This is a simulated response. In a real implementation, this would connect to your backend API.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Update thread last message
      if (selectedThreadId) {
        setChatThreads((prev) =>
          prev.map((thread) =>
            thread.id === selectedThreadId
              ? { ...thread, lastMessage: content, timestamp: new Date() }
              : thread
          )
        );
      }
    }, 1000);
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
              servers={MOCK_SERVERS}
              chatThreads={chatThreads}
              selectedServerId={selectedServerId}
              selectedThreadId={selectedThreadId}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
              onServerChange={handleServerChange}
              onThreadSelect={handleThreadSelect}
              onNewThread={handleNewThread}
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
