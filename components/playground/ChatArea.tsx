"use client";

import {
  CheckIcon,
  CopyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import * as React from "react";
import type { MessageType } from "@/app/playground/page";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

interface ChatAreaProps {
  threadId?: string;
  messages: MessageType[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
  status: "error" | "streaming" | "submitted" | "ready";
}

const STARTER_PROMPTS = [
  {
    id: "1",
    title: "explains authentication process",
    subtitle: "in docs",
  },
  {
    id: "2",
    title: "Explain React hooks",
    subtitle: "like useState and useEffect",
  },
  {
    id: "3",
    title: "tell me optimization strategy",
    subtitle: "to find top customers",
  },
  {
    id: "4",
    title: "tell me some best practices",
    subtitle: "for healthy weight loss",
  },
];

export function ChatArea({
  threadId,
  messages,
  isLoading = false,
  onSendMessage,
  status,
}: ChatAreaProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [liked, setLiked] = React.useState<Record<string, boolean>>({});
  const [disliked, setDisliked] = React.useState<Record<string, boolean>>({});
  const [copied, setCopied] = React.useState<Record<string, boolean>>({});

  const handleSend = (message: PromptInputMessage) => {
    onSendMessage(message.text || "hello");
  };

  const handlePromptClick = (prompt: string) => {
    if (!isLoading) {
      onSendMessage(prompt);
    }
  };

  const _handleRetry = () => {
    console.log("Retrying response...");
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);

      setCopied((prev) => ({ ...prev, [id]: true }));

      // reset tick icon after 2 seconds
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.log("Failed to copy:", err);
    }
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  console.log(messages);
  const visibleMessages = messages.filter((msg) => msg.role !== "system");
  const showEmptyState = visibleMessages.length === 0;

  return (
    <div className="flex h-full flex-1 flex-col bg-gradient-to-b from-muted/40 via-background to-background overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8 overflow-y-auto animate-fade-in">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl sm:text-4xl font-semibold tracking-tight">
                Hello there!
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                How can I help you today?
              </p>
            </div>

            {/* Bottom Prompt Cards */}

            <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:gap-4 md:grid-cols-1 px-2 sm:px-0 ">
              <Suggestions>
                {STARTER_PROMPTS.map((suggestion) => (
                  <Suggestion
                    key={suggestion.id}
                    onClick={() =>
                      handlePromptClick(
                        `${suggestion.title} ${suggestion.subtitle}`,
                      )
                    }
                    suggestion={suggestion.title}
                  />
                ))}
              </Suggestions>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-3 sm:p-6 pb-8">
              {visibleMessages.map((message) => (
                <Message from={message.role} key={message.id}>
                  {/* Assistant messages with multiple versions (branches) */}

                  {
                    // @ts-expect-error
                    message.versions?.length > 1 ? (
                      <MessageBranch defaultBranch={0} key={message.id}>
                        <MessageBranchContent>
                          {
                            // @ts-expect-error
                            message.versions.map((version) => (
                              <MessageContent key={version.id}>
                                <MessageResponse>
                                  {version.content}
                                </MessageResponse>
                              </MessageContent>
                            ))
                          }
                        </MessageBranchContent>

                        {message.role === "assistant" && (
                          <MessageToolbar>
                            <MessageBranchSelector from={message.role}>
                              <MessageBranchPrevious />
                              <MessageBranchPage />
                              <MessageBranchNext />
                            </MessageBranchSelector>

                            <MessageActions>
                              {/* <MessageAction
                            label="Retry"
                            onClick={handleRetry}
                            tooltip="Regenerate response"
                          >
                            <RefreshCcwIcon className="size-4" />
                          </MessageAction> */}

                              <MessageAction
                                className="cursor-pointer"
                                label="Like"
                                onClick={() => {
                                  setLiked((prev) => ({
                                    ...prev,
                                    [message.id]: !prev[message.id],
                                  }));

                                  // turn off dislike if user liked
                                  setDisliked((prev) => ({
                                    ...prev,
                                    [message.id]: false,
                                  }));
                                }}
                                tooltip="Like this response"
                              >
                                <ThumbsUpIcon
                                  className="size-4"
                                  fill={
                                    liked[message.id] ? "currentColor" : "none"
                                  }
                                />
                              </MessageAction>

                              <MessageAction
                                className="cursor-pointer"
                                label="Dislike"
                                onClick={() => {
                                  setDisliked((prev) => ({
                                    ...prev,
                                    [message.id]: !prev[message.id],
                                  }));

                                  // turn off like if user disliked
                                  setLiked((prev) => ({
                                    ...prev,
                                    [message.id]: false,
                                  }));
                                }}
                                tooltip="Dislike this response"
                              >
                                <ThumbsDownIcon
                                  className="size-4"
                                  fill={
                                    disliked[message.id]
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </MessageAction>

                              <MessageAction
                                className="cursor-pointer"
                                label="Copy"
                                onClick={() =>
                                  handleCopy(message.content, message.id)
                                }
                                tooltip="Copy to clipboard"
                              >
                                {copied[message.id] ? (
                                  <CheckIcon className="size-4 text-green-500" />
                                ) : (
                                  <CopyIcon className="size-4" />
                                )}
                              </MessageAction>
                            </MessageActions>
                          </MessageToolbar>
                        )}
                      </MessageBranch>
                    ) : (
                      <div>
                        {/* Normal message content */}

                        <MessageContent>
                          {message.role === "assistant" ? (
                            <>
                              <MessageResponse>
                                {isLoading &&
                                message.id === messages[messages.length - 1].id
                                  ? "Thinking..."
                                  : message.content}
                              </MessageResponse>
                              <Sources>
                                <SourcesTrigger
                                  count={message?.sources?.length || 0}
                                />
                                <SourcesContent>
                                  {message?.sources?.map((source) => (
                                    <Source
                                      href={source}
                                      key={source}
                                      title={source}
                                    />
                                  ))}
                                </SourcesContent>
                              </Sources>
                            </>
                          ) : (
                            message.content
                          )}
                        </MessageContent>

                        {/* Actions for normal assistant messages */}
                        {message.role === "assistant" && (
                          <MessageActions>
                            {/* <MessageAction
                          label="Retry"
                          onClick={handleRetry}
                          tooltip="Regenerate response"
                        >
                          <RefreshCcwIcon className="size-4" />
                        </MessageAction> */}

                            <MessageAction
                              className="cursor-pointer"
                              label="Like"
                              onClick={() => {
                                setLiked((prev) => ({
                                  ...prev,
                                  [message.id]: !prev[message.id],
                                }));

                                // turn off dislike if user liked
                                setDisliked((prev) => ({
                                  ...prev,
                                  [message.id]: false,
                                }));
                              }}
                              tooltip="Like this response"
                            >
                              <ThumbsUpIcon
                                className="size-4"
                                fill={
                                  liked[message.id] ? "currentColor" : "none"
                                }
                              />
                            </MessageAction>

                            <MessageAction
                              className="cursor-pointer"
                              label="Dislike"
                              onClick={() => {
                                setDisliked((prev) => ({
                                  ...prev,
                                  [message.id]: !prev[message.id],
                                }));

                                // turn off like if user disliked
                                setLiked((prev) => ({
                                  ...prev,
                                  [message.id]: false,
                                }));
                              }}
                              tooltip="Dislike this response"
                            >
                              <ThumbsDownIcon
                                className="size-4"
                                fill={
                                  disliked[message.id] ? "currentColor" : "none"
                                }
                              />
                            </MessageAction>
                            <MessageAction
                              className="cursor-pointer"
                              label="Copy"
                              onClick={() =>
                                handleCopy(message.content, message.id)
                              }
                              tooltip="Copy to clipboard"
                            >
                              {copied[message.id] ? (
                                <CheckIcon className="size-4 text-green-500" />
                              ) : (
                                <CopyIcon className="size-4" />
                              )}
                            </MessageAction>
                          </MessageActions>
                        )}
                      </div>
                    )
                  }
                </Message>
              ))}

              {/* Loading state */}
              {/* {isLoading && (
              <Message from="assistant">
                <MessageContent>
                  <MessageResponse>Thinking…</MessageResponse>
                </MessageContent>
              </Message>
            )} */}
            </div>
          </div>
        )}
      </div>

      {/* Updated Chat Input Bar (floating / neumorphic style) */}
      <div className="border-t bg-background/80 backdrop-blur-md p-3 sm:p-5 flex-shrink-0">
        <PromptInputProvider>
          <PromptInput globalDrop multiple onSubmit={handleSend}>
            <PromptInputBody>
              <PromptInputTextarea ref={textareaRef} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger className="hidden" />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit className="cursor-pointer" status={status} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  );
}
