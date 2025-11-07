"use client";

import * as React from "react";
import { IconSend, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatAreaProps {
  threadId?: string;
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: "☀️",
    title: "What's the weather",
    subtitle: "like in San Francisco?",
  },
  {
    icon: "⚛️",
    title: "Explain React hooks",
    subtitle: "in simple terms",
  },
  {
    icon: "💾",
    title: "Write a SQL query",
    subtitle: "to get top customers",
  },
  {
    icon: "🍽️",
    title: "Create a meal plan",
    subtitle: "for a healthy week",
  },
];

export function ChatArea({
  threadId,
  messages,
  isLoading = false,
  onSendMessage,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (!isLoading) {
      onSendMessage(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter out system messages for display
  const visibleMessages = messages.filter((msg) => msg.role !== "system");
  const showEmptyState = !threadId || visibleMessages.length === 0;

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            {/* Welcome Message */}
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-semibold">Hello there!</h2>
              <p className="text-muted-foreground text-lg">
                How can I help you today?
              </p>
            </div>

            {/* Starter Prompts */}
            <div className="grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
              {STARTER_PROMPTS.map((prompt, index) => (
                <Card
                  key={index}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  onClick={() =>
                    handlePromptClick(`${prompt.title} ${prompt.subtitle}`)
                  }
                >
                  <div className="flex items-start gap-3 p-4">
                    <span className="text-2xl">{prompt.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{prompt.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {prompt.subtitle}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-6">
              {messages.map((message) => {
                // Skip system messages from display
                if (message.role === "system") return null;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-3 shadow-xs",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          message.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex w-full justify-start">
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 shadow-xs">
                    <IconLoader2 className="!size-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Answering...
                    </span>
                  </div>
                </div>
              )}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? (
              <IconLoader2 className="!size-4 animate-spin" />
            ) : (
              <IconSend className="!size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
