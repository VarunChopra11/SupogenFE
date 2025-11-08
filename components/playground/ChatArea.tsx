"use client";

import * as React from "react";
import { IconSend, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "./MarkdownRenderer";

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
  const showEmptyState = visibleMessages.length === 0;

  return (
    <div className="flex h-full flex-1 flex-col bg-gradient-to-b from-muted/40 via-background to-background overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8 overflow-y-auto animate-fade-in">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl sm:text-4xl font-semibold tracking-tight">Hello there!</h2>
              <p className="text-muted-foreground text-base sm:text-lg">How can I help you today?</p>
            </div>

            <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 px-2 sm:px-0">
              {STARTER_PROMPTS.map((prompt, index) => (
                <Card
                  key={index}
                  className="cursor-pointer rounded-2xl border border-transparent bg-card transition-all hover:scale-[1.03] hover:shadow-md hover:border-primary/40"
                  onClick={() => handlePromptClick(`${prompt.title} ${prompt.subtitle}`)}
                >
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                    <span className="text-xl sm:text-2xl">{prompt.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold">{prompt.title}</p>
                      <p className="text-muted-foreground text-xs">{prompt.subtitle}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 pb-8">
              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full animate-fade-in gap-2 sm:gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs sm:text-sm">
                        AI
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-sm border transition-all duration-300",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground border-primary/20 rounded-br-md"
                        : "bg-card border-border rounded-bl-md"
                    )}
                  >
                    <MarkdownRenderer
                      content={message.content}
                      isUser={message.role === "user"}
                    />
                    <p
                      className={cn(
                        "mt-2 sm:mt-3 text-[10px] font-medium",
                        message.role === "user"
                          ? "text-primary-foreground/50"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs sm:text-sm">
                        U
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex w-full justify-start animate-fade-in gap-2 sm:gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs sm:text-sm">
                      AI
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground ml-2">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Updated Chat Input Bar (floating / neumorphic style) */}
      <div className="border-t bg-background/80 backdrop-blur-md p-3 sm:p-5 flex-shrink-0">
        <div className="relative mx-auto flex w-full max-w-3xl items-center gap-2 sm:gap-3 rounded-full border bg-card shadow-lg py-2 px-3 sm:px-4 transition-all focus-within:ring-2 focus-within:ring-primary/60">
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
            className="rounded-full h-8 w-8 sm:h-9 sm:w-9 shadow-md hover:scale-105 transition-all"
          >
            {isLoading ? <IconLoader2 className="!size-4 animate-spin" /> : <IconSend className="!size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
