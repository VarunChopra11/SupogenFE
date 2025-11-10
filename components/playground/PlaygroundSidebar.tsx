"use client";

import * as React from "react";
import {
  IconPlus,
  IconMessageCircle,
  IconChevronLeft,
  IconChevronRight,
  IconMenu2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface Server {
  id: string;
  name: string;
}

interface ChatThread {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp?: Date;
}

interface PlaygroundSidebarProps {
  servers: Server[];
  chatThreads: ChatThread[];
  selectedServerId?: string;
  selectedThreadId?: string;
  isCollapsed?: boolean;
  isLoadingServers?: boolean;
  onToggleCollapse?: () => void;
  onServerChange: (serverId: string) => void;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
}

export function PlaygroundSidebar({
  servers,
  chatThreads,
  selectedServerId,
  selectedThreadId,
  isCollapsed = false,
  isLoadingServers = false,
  onToggleCollapse,
  onServerChange,
  onThreadSelect,
  onNewThread,
}: PlaygroundSidebarProps) {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // Function to truncate text to a specific character limit
  const truncateText = (text: string, maxLength: number = 25): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Handle thread selection and close sheet on mobile
  const handleThreadSelect = (threadId: string) => {
    onThreadSelect(threadId);
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  // Handle new thread and close sheet on mobile
  const handleNewThread = () => {
    onNewThread();
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  // Sidebar content component (reused for both mobile and desktop)
  const SidebarContent = () => (
    <>
      {/* Server Selector */}
      <div className="border-b p-4 flex-shrink-0">
        <Select
          value={selectedServerId}
          onValueChange={onServerChange}
          disabled={isLoadingServers}
        >
          <SelectTrigger
            className="w-full cursor-pointer"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <SelectValue
              placeholder={
                isLoadingServers ? "Loading servers..." : "Select server..."
              }
            />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-auto">
              {servers.length === 0 && !isLoadingServers ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Add server to select and chat.
                </div>
              ) : (
                servers.map((server) => (
                  <SelectItem
                    key={server.id}
                    value={server.id}
                    className="cursor-pointer"
                  >
                    {server.name}
                  </SelectItem>
                ))
              )}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-1 p-2">
          {/* New Thread Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2 shadow-xs cursor-pointer"
            onClick={handleNewThread}
            disabled={!selectedServerId}
          >
            <IconPlus className="!size-4" />
            <span className="text-sm font-medium">New Thread</span>
          </Button>

          {/* Thread List */}
          <div className="mt-2 flex flex-col gap-1">
            {!selectedServerId ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Select server to chat.
              </div>
            ) : chatThreads.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No chat history yet.
              </div>
            ) : (
              chatThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => handleThreadSelect(thread.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 rounded-md px-3 py-2 text-left transition-colors",
                    selectedThreadId === thread.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  style={{ maxWidth: "100%" }}
                >
                  <div
                    className="flex w-full items-center gap-2"
                    style={{ maxWidth: "100%" }}
                  >
                    <IconMessageCircle className="!size-4 shrink-0" />
                    <span
                      className="text-sm font-medium block"
                      style={{
                        maxWidth: "calc(100% - 2rem)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {truncateText(thread.title, 25)}
                    </span>
                  </div>
                  {thread.lastMessage && (
                    <span
                      className={cn(
                        "text-xs block",
                        selectedThreadId === thread.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                      style={{
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {truncateText(thread.lastMessage, 30)}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );

  // Mobile view: Use Sheet (drawer)
  if (isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "fixed top-1/2 -translate-y-1/2 z-50 md:hidden",
              "shadow-md hover:shadow-lg active:shadow-sm",
              "h-16 w-8 rounded-r-2xl",
              "border border-border/60 bg-gradient-to-r from-background to-muted/30",
              "hover:from-accent hover:to-accent/80",
              "transition-all duration-300 ease-in-out",
              "flex items-center justify-center",
              "backdrop-blur-sm",
              "group",
              isSheetOpen
                ? "left-[280px] rounded-l-none border-l-0"
                : "left-0 rounded-l-2xl border-l"
            )}
            aria-label={isSheetOpen ? "Close menu" : "Open menu"}
            style={{
              minWidth: "2rem",
              minHeight: "4rem",
            }}
          >
            {isSheetOpen ? (
              <IconChevronLeft className="!size-4 transition-transform group-hover:-translate-x-0.5" />
            ) : (
              <IconChevronRight className="!size-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          <div
            className="flex-1 flex flex-col"
            style={{ backgroundColor: "#FAFAFA" }}
          >
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop/Tablet view: Collapsible sidebar
  return (
    <>
      {/* Wrapper for sidebar and toggle button - overflow-visible to show button */}
      <div className="relative flex h-full" style={{ overflow: "visible" }}>
        {/* Sidebar Container */}
        <div
          className={cn(
            "flex h-full flex-col border-r transition-all duration-300 overflow-hidden relative",
            isCollapsed
              ? "w-0 overflow-hidden border-r-0"
              : "w-[250px] lg:w-[280px]"
          )}
          style={{ backgroundColor: isCollapsed ? "transparent" : "#FAFAFA" }}
        >
          {!isCollapsed && <SidebarContent />}
        </div>

        {/* Always Visible Toggle Button - Positioned on the right edge at vertical center */}
        {onToggleCollapse && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-300 hidden md:block",
              isCollapsed ? "left-0" : "left-[250px] lg:left-[280px]"
            )}
            style={{ pointerEvents: "auto" }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleCollapse}
              className={cn(
                "shadow-md hover:shadow-lg active:shadow-sm",
                "h-16 w-8 rounded-r-2xl",
                "border border-border/60 bg-gradient-to-r from-background to-muted/30",
                "hover:from-accent hover:to-accent/80",
                "transition-all duration-300 ease-in-out",
                "flex items-center justify-center",
                "backdrop-blur-sm",
                "group cursor-pointer",
                isCollapsed
                  ? "rounded-l-2xl border-l"
                  : "rounded-l-none border-l-0"
              )}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                minWidth: "2rem",
                minHeight: "4rem",
              }}
            >
              {isCollapsed ? (
                <IconChevronRight className="!size-4 transition-transform group-hover:translate-x-0.5" />
              ) : (
                <IconChevronLeft className="!size-4 transition-transform group-hover:-translate-x-0.5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
