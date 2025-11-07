"use client";

import * as React from "react";
import { IconPlus, IconMessageCircle, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
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
  return (
    <>
      {/* Wrapper for sidebar and toggle button - overflow-visible to show button */}
      <div className="relative flex h-full" style={{ overflow: 'visible' }}>
        {/* Sidebar Container */}
        <div
          className={cn(
            "flex h-full flex-col border-r transition-all duration-300 overflow-hidden relative",
            isCollapsed ? "w-0 overflow-hidden border-r-0" : "w-[250px]"
          )}
          style={{ backgroundColor: isCollapsed ? "transparent" : "#FAFAFA" }}
        >
          {!isCollapsed && (
            <>
              {/* Server Selector */}
              <div className="border-b p-4 flex-shrink-0">
                <Select 
                  value={selectedServerId} 
                  onValueChange={onServerChange}
                  disabled={isLoadingServers}
                >
                  <SelectTrigger className="w-full" style={{ backgroundColor: "#FFFFFF" }}>
                    <SelectValue placeholder={isLoadingServers ? "Loading servers..." : "Select server..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[300px]">
                      {servers.length === 0 && !isLoadingServers ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No servers available
                        </div>
                      ) : (
                        servers.map((server) => (
                          <SelectItem key={server.id} value={server.id}>
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
                    className="w-full justify-start gap-2 shadow-xs"
                    onClick={onNewThread}
                  >
                    <IconPlus className="!size-4" />
                    <span className="text-sm font-medium">New Thread</span>
                  </Button>

                  {/* Thread List */}
                  <div className="mt-2 flex flex-col gap-1">
                    {chatThreads.map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => onThreadSelect(thread.id)}
                        className={cn(
                          "flex w-full flex-col items-start gap-1 rounded-md px-3 py-2 text-left transition-colors",
                          selectedThreadId === thread.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <div className="flex w-full items-center gap-2">
                          <IconMessageCircle className="!size-4 shrink-0" />
                          <span className="truncate text-sm font-medium">
                            {thread.title}
                          </span>
                        </div>
                        {thread.lastMessage && (
                          <span
                            className={cn(
                              "line-clamp-1 w-full text-xs",
                              selectedThreadId === thread.id
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            )}
                          >
                            {thread.lastMessage}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Always Visible Toggle Button - Positioned on the right edge */}
        {onToggleCollapse && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-300",
              isCollapsed ? "left-0" : "left-[250px]"
            )}
            style={{ pointerEvents: 'auto' }}
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
                "group",
                isCollapsed 
                  ? "rounded-l-2xl border-l" 
                  : "rounded-l-none border-l-0"
              )}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{ 
                minWidth: '2rem',
                minHeight: '4rem'
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
