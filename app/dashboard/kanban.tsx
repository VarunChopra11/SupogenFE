"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import type { Chat, ChatResponse } from "@/types/chat";
import { Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MarkdownRenderer } from "@/components/playground/MarkdownRenderer";

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

const Kanban = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  // State for In Progress chats
  const [inProgressChats, setInProgressChats] = useState<Chat[]>([]);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [inProgressHasMore, setInProgressHasMore] = useState(true);
  const [inProgressLoading, setInProgressLoading] = useState(false);
  const inProgressObserver = useRef<IntersectionObserver | null>(null);
  
  // State for Done chats
  const [doneChats, setDoneChats] = useState<Chat[]>([]);
  const [donePage, setDonePage] = useState(1);
  const [doneHasMore, setDoneHasMore] = useState(true);
  const [doneLoading, setDoneLoading] = useState(false);
  const doneObserver = useRef<IntersectionObserver | null>(null);
  
  // State for expanded chat cards
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const pageSize = 10;

  // Fetch In Progress chats
  const fetchInProgressChats = useCallback(async (page: number, append = false) => {
    if (inProgressLoading) return;
    setInProgressLoading(true);
    try {
      const response = await authenticatedFetch(
        `/analytics/discord/chats/unresolved?page=${page}&page_size=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch in-progress chats");
      }
      
      const data: ChatResponse = await response.json();
      
      if (append) {
        setInProgressChats((prev) => [...prev, ...data.data.chats]);
      } else {
        setInProgressChats(data.data.chats);
      }
      
      setInProgressHasMore(data.data.pagination.has_next);
    } catch (error) {
      console.error("Error fetching in-progress chats:", error);
      if (!append) {
        setInProgressChats([]);
      }
    } finally {
      setInProgressLoading(false);
    }
  }, [authenticatedFetch, pageSize, inProgressLoading]);

  // Fetch Done chats
  const fetchDoneChats = useCallback(async (page: number, append = false) => {
    if (doneLoading) return;
    setDoneLoading(true);
    try {
      const response = await authenticatedFetch(
        `/analytics/discord/chats/resolved?page=${page}&page_size=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch done chats");
      }
      
      const data: ChatResponse = await response.json();
      
      if (append) {
        setDoneChats((prev) => [...prev, ...data.data.chats]);
      } else {
        setDoneChats(data.data.chats);
      }
      
      setDoneHasMore(data.data.pagination.has_next);
    } catch (error) {
      console.error("Error fetching done chats:", error);
      if (!append) {
        setDoneChats([]);
      }
    } finally {
      setDoneLoading(false);
    }
  }, [authenticatedFetch, pageSize, doneLoading]);

  // Initial fetch
  useEffect(() => {
    fetchInProgressChats(1, false);
    fetchDoneChats(1, false);
  }, []);

  // Load more for In Progress
  const loadMoreInProgress = useCallback(() => {
    if (inProgressHasMore && !inProgressLoading) {
      const nextPage = inProgressPage + 1;
      setInProgressPage(nextPage);
      fetchInProgressChats(nextPage, true);
    }
  }, [inProgressHasMore, inProgressLoading, inProgressPage, fetchInProgressChats]);

  // Load more for Done
  const loadMoreDone = useCallback(() => {
    if (doneHasMore && !doneLoading) {
      const nextPage = donePage + 1;
      setDonePage(nextPage);
      fetchDoneChats(nextPage, true);
    }
  }, [doneHasMore, doneLoading, donePage, fetchDoneChats]);

  // Intersection observer callback for In Progress
  const lastInProgressElementRef = useCallback((node: HTMLDivElement | null) => {
    if (inProgressLoading) return;
    if (inProgressObserver.current) inProgressObserver.current.disconnect();
    
    inProgressObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && inProgressHasMore) {
        loadMoreInProgress();
      }
    });
    
    if (node) inProgressObserver.current.observe(node);
  }, [inProgressLoading, inProgressHasMore, loadMoreInProgress]);

  // Intersection observer callback for Done
  const lastDoneElementRef = useCallback((node: HTMLDivElement | null) => {
    if (doneLoading) return;
    if (doneObserver.current) doneObserver.current.disconnect();
    
    doneObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && doneHasMore) {
        loadMoreDone();
      }
    });
    
    if (node) doneObserver.current.observe(node);
  }, [doneLoading, doneHasMore, loadMoreDone]);

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

  const renderChatMessages = (chat: Chat) => {
    return (
      <div className="space-y-3 border-t pt-3 mt-3">
        {chat.messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col gap-1 rounded-md p-3",
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
            <div className="text-xs leading-relaxed">
              <MarkdownRenderer 
                content={message.content} 
                isUser={message.role === "user"}
                className="prose-xs max-w-none"
              />
            </div>
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
    <div className="px-4 lg:px-6 flex-shrink-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - var(--header-height) - 230px)' }}>
        {/* In Progress Column */}
        <div className="flex flex-col border rounded-md overflow-hidden bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
          <div className="flex items-center gap-2 p-3 border-b bg-background/50 backdrop-blur-sm flex-shrink-0">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "#F59E0B" }}
            />
            <span className="font-semibold text-sm">In Progress</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {/* Initial Loading State */}
            {inProgressLoading && inProgressChats.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground text-sm">
                  Loading chats...
                </span>
              </div>
            )}

            {/* Empty State */}
            {!inProgressLoading && inProgressChats.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <span className="text-muted-foreground text-sm">
                  No chats in progress
                </span>
              </div>
            )}

            {/* Chat Cards */}
            {inProgressChats.map((chat, index) => {
              const isLast = index === inProgressChats.length - 1;
              return (
                <div
                  key={chat.chat_id}
                  ref={isLast ? lastInProgressElementRef : null}
                >
                  <Collapsible
                    open={expandedCards.has(chat.chat_id)}
                    onOpenChange={() => toggleCardExpansion(chat.chat_id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="cursor-pointer rounded-md border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-1">
                          <p className="m-0 flex-1 font-medium text-sm line-clamp-2">
                            {chat.messages.find((m) => m.role === "user")?.content || "No message"}
                          </p>
                        </div>
                        <p className="m-0 text-muted-foreground text-xs mt-2">
                          {shortDateFormatter.format(new Date(chat.created_at))} -{" "}
                          {dateFormatter.format(new Date(chat.updated_at))}
                        </p>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 rounded-md border bg-card p-3 shadow-sm">
                        {renderChatMessages(chat)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}

            {/* Loading More Indicator */}
            {inProgressLoading && inProgressChats.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground text-xs">
                  Loading more...
                </span>
              </div>
            )}

            {/* End of List Indicator */}
            {!inProgressHasMore && inProgressChats.length > 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No more chats
              </div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="flex flex-col border rounded-md overflow-hidden bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs">
          <div className="flex items-center gap-2 p-3 border-b bg-background/50 backdrop-blur-sm flex-shrink-0">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "#10B981" }}
            />
            <span className="font-semibold text-sm">Done</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {/* Initial Loading State */}
            {doneLoading && doneChats.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground text-sm">
                  Loading chats...
                </span>
              </div>
            )}

            {/* Empty State */}
            {!doneLoading && doneChats.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <span className="text-muted-foreground text-sm">
                  No completed chats
                </span>
              </div>
            )}

            {/* Chat Cards */}
            {doneChats.map((chat, index) => {
              const isLast = index === doneChats.length - 1;
              return (
                <div
                  key={chat.chat_id}
                  ref={isLast ? lastDoneElementRef : null}
                >
                  <Collapsible
                    open={expandedCards.has(chat.chat_id)}
                    onOpenChange={() => toggleCardExpansion(chat.chat_id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="cursor-pointer rounded-md border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-1">
                          <p className="m-0 flex-1 font-medium text-sm line-clamp-2">
                            {chat.messages.find((m) => m.role === "user")?.content || "No message"}
                          </p>
                        </div>
                        <p className="m-0 text-muted-foreground text-xs mt-2">
                          {shortDateFormatter.format(new Date(chat.created_at))} -{" "}
                          {dateFormatter.format(new Date(chat.updated_at))}
                        </p>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 rounded-md border bg-card p-3 shadow-sm">
                        {renderChatMessages(chat)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}

            {/* Loading More Indicator */}
            {doneLoading && doneChats.length > 0 && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground text-xs">
                  Loading more...
                </span>
              </div>
            )}

            {/* End of List Indicator */}
            {!doneHasMore && doneChats.length > 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No more chats
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kanban;
