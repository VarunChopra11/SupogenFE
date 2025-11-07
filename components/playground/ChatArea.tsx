"use client";

import * as React from "react";
import { IconSend, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
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
  { icon: "☀️", title: "What's the weather", subtitle: "in San Francisco?" },
  { icon: "⚛️", title: "Explain React hooks", subtitle: "like useState and useEffect" },
  { icon: "💾", title: "Write a SQL query", subtitle: "to find top customers" },
  { icon: "🍽️", title: "Create a meal plan", subtitle: "for healthy weight loss" },
];

export function ChatArea({ threadId, messages, isLoading = false, onSendMessage }: ChatAreaProps) {
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

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const visibleMessages = messages.filter((msg) => msg.role !== "system");
  const showEmptyState = !threadId || visibleMessages.length === 0;

  return (
    <div className="flex h-full flex-1 flex-col bg-gradient-to-b from-muted/40 via-background to-background overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center px-4 overflow-y-auto animate-fade-in">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-4xl font-semibold tracking-tight">Hello there!</h2>
              <p className="text-muted-foreground text-lg">How can I help you today?</p>
            </div>

            <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
              {STARTER_PROMPTS.map((prompt, index) => (
                <Card
                  key={index}
                  className="cursor-pointer rounded-2xl border border-transparent bg-card transition-all hover:scale-[1.03] hover:shadow-md hover:border-primary/40"
                  onClick={() => handlePromptClick(`${prompt.title} ${prompt.subtitle}`)}
                >
                  <div className="flex items-start gap-3 p-5">
                    <span className="text-2xl">{prompt.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{prompt.title}</p>
                      <p className="text-muted-foreground text-xs">{prompt.subtitle}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-6">
              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full animate-fade-in",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-5 py-3 shadow-md transition-all duration-300",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        message.role === "user"
                          ? "text-primary-foreground/60"
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
              ))}

              {isLoading && (
                <div className="flex w-full justify-start animate-fade-in">
                  <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 shadow-md">
                    <IconLoader2 className="!size-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Updated Chat Input Bar (floating / neumorphic style) */}
      <div className="border-t bg-background/80 backdrop-blur-md p-5 flex-shrink-0">
        <div className="relative mx-auto flex w-full max-w-3xl items-center gap-3 rounded-full border bg-card shadow-lg py-2 px-4 transition-all focus-within:ring-2 focus-within:ring-primary/60">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm"
          />

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="rounded-full h-9 w-9 shadow-md hover:scale-105 transition-all"
          >
            {isLoading ? <IconLoader2 className="!size-4 animate-spin" /> : <IconSend className="!size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
