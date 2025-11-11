"use client";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import type { Chat, ChatResponse, PaginationInfo } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

const columns = [
  { id: "in-progress", name: "In Progress", color: "#F59E0B" },
  { id: "done", name: "Done", color: "#10B981" },
];

type KanbanItem = {
  id: string;
  name: string;
  column: string;
  chat: Chat;
};

const Kanban = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  // State for In Progress chats
  const [inProgressChats, setInProgressChats] = useState<Chat[]>([]);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [inProgressPagination, setInProgressPagination] = useState<PaginationInfo | null>(null);
  const [inProgressLoading, setInProgressLoading] = useState(false);
  
  // State for Done chats
  const [doneChats, setDoneChats] = useState<Chat[]>([]);
  const [donePage, setDonePage] = useState(1);
  const [donePagination, setDonePagination] = useState<PaginationInfo | null>(null);
  const [doneLoading, setDoneLoading] = useState(false);
  
  // State for expanded chat cards
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const pageSize = 10;

  // Fetch In Progress chats
  const fetchInProgressChats = useCallback(async (page: number) => {
    setInProgressLoading(true);
    try {
      const response = await authenticatedFetch(
        `/analytics/discord/chats/unresolved?page=${page}&page_size=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch in-progress chats");
      }
      
      const data: ChatResponse = await response.json();
      setInProgressChats(data.data.chats);
      setInProgressPagination(data.data.pagination);
    } catch (error) {
      console.error("Error fetching in-progress chats:", error);
      setInProgressChats([]);
    } finally {
      setInProgressLoading(false);
    }
  }, [authenticatedFetch, pageSize]);

  // Fetch Done chats
  const fetchDoneChats = useCallback(async (page: number) => {
    setDoneLoading(true);
    try {
      const response = await authenticatedFetch(
        `/analytics/discord/chats/resolved?page=${page}&page_size=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch done chats");
      }
      
      const data: ChatResponse = await response.json();
      setDoneChats(data.data.chats);
      setDonePagination(data.data.pagination);
    } catch (error) {
      console.error("Error fetching done chats:", error);
      setDoneChats([]);
    } finally {
      setDoneLoading(false);
    }
  }, [authenticatedFetch, pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchInProgressChats(inProgressPage);
    fetchDoneChats(donePage);
  }, [fetchInProgressChats, fetchDoneChats, inProgressPage, donePage]);

  // Convert chats to kanban items
  const kanbanItems: KanbanItem[] = [
    ...inProgressChats.map((chat) => ({
      id: chat.chat_id,
      name: chat.messages.find((m) => m.role === "user")?.content || "No message",
      column: "in-progress",
      chat,
    })),
    ...doneChats.map((chat) => ({
      id: chat.chat_id,
      name: chat.messages.find((m) => m.role === "user")?.content || "No message",
      column: "done",
      chat,
    })),
  ];

  const toggleCardExpansion = (chatId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const renderPaginationControls = (
    pagination: PaginationInfo | null,
    currentPage: number,
    setPage: (page: number) => void,
    loading: boolean
  ) => {
    if (!pagination) return null;

    return (
      <div className="flex items-center justify-between border-t bg-background px-4 py-3 text-xs">
        <div className="text-muted-foreground">
          Page {pagination.page} of {pagination.total_pages} ({pagination.total_count} total)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={!pagination.has_previous || loading}
            className="h-7 px-2"
          >
            <ChevronLeft className="h-3 w-3" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={!pagination.has_next || loading}
            className="h-7 px-2"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  const renderChatMessages = (chat: Chat) => {
    return (
      <div className="space-y-3 border-t pt-3 mt-3">
        {chat.messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col gap-1 rounded-md p-2",
              message.role === "user"
                ? "bg-primary/10 border-l-2 border-primary"
                : "bg-secondary border-l-2 border-muted-foreground"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs capitalize">
                {message.role}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {timeFormatter.format(new Date(message.timestamp))}
              </span>
            </div>
            <p className="text-xs leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {message.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-[10px]"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    Source {idx + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <KanbanProvider
        columns={columns}
        data={kanbanItems}
        onDataChange={() => {}} // Disable drag & drop for now as we're using API data
      >
        {(column) => (
          <KanbanBoard id={column.id} key={column.id}>
            <KanbanHeader>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span>{column.name}</span>
              </div>
            </KanbanHeader>
            
            {/* Loading State */}
            {((column.id === "in-progress" && inProgressLoading) ||
              (column.id === "done" && doneLoading)) && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground text-sm">
                  Loading chats...
                </span>
              </div>
            )}

            {/* Empty State */}
            {((column.id === "in-progress" && !inProgressLoading && inProgressChats.length === 0) ||
              (column.id === "done" && !doneLoading && doneChats.length === 0)) && (
              <div className="flex items-center justify-center py-8">
                <span className="text-muted-foreground text-sm">
                  No chats found
                </span>
              </div>
            )}

            {/* Chat Cards */}
            {((column.id === "in-progress" && !inProgressLoading && inProgressChats.length > 0) ||
              (column.id === "done" && !doneLoading && doneChats.length > 0)) && (
              <KanbanCards id={column.id}>
                {(item: KanbanItem) => (
                  <Collapsible
                    open={expandedCards.has(item.id)}
                    onOpenChange={() => toggleCardExpansion(item.id)}
                  >
                    <KanbanCard
                      column={column.id}
                      id={item.id}
                      key={item.id}
                      name={item.name}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="cursor-pointer">
                          <div className="flex flex-col gap-1">
                            <p className="m-0 flex-1 font-medium text-sm line-clamp-2">
                              {item.name}
                            </p>
                          </div>
                          <p className="m-0 text-muted-foreground text-xs mt-2">
                            {shortDateFormatter.format(new Date(item.chat.created_at))} -{" "}
                            {dateFormatter.format(new Date(item.chat.updated_at))}
                          </p>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {renderChatMessages(item.chat)}
                      </CollapsibleContent>
                    </KanbanCard>
                  </Collapsible>
                )}
              </KanbanCards>
            )}

            {/* Pagination Controls */}
            {column.id === "in-progress" &&
              renderPaginationControls(
                inProgressPagination,
                inProgressPage,
                setInProgressPage,
                inProgressLoading
              )}
            {column.id === "done" &&
              renderPaginationControls(
                donePagination,
                donePage,
                setDonePage,
                doneLoading
              )}
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
};

export default Kanban;
