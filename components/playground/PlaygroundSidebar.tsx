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
      {/* Wrapper for sidebar and toggle button */}
      <div className="relative flex h-full">
        {/* Sidebar Container */}
        <div
          className={cn(
            "flex h-full flex-col border-r transition-all duration-300",
            isCollapsed ? "w-0 overflow-hidden border-r-0" : "w-[250px]"
          )}
          style={{ backgroundColor: isCollapsed ? "transparent" : "#FAFAFA" }}
        >
          {!isCollapsed && (
            <>
              {/* Server Selector */}
              <div className="border-b p-4">
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
              <ScrollArea className="flex-1">
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

        {/* Always Visible Toggle Button */}
        {onToggleCollapse && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onToggleCollapse}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-20 transition-all",
              "rounded-r-lg rounded-l-none border-l-0",
              "shadow-md bg-background hover:bg-accent",
              "h-12 w-6",
              isCollapsed ? "left-0 rounded-l-lg border-l" : "-right-6"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <IconChevronRight className="!size-4" />
            ) : (
              <IconChevronLeft className="!size-4" />
            )}
          </Button>
        )}
      </div>
    </>
  );
}
