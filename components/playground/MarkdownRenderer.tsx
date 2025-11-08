"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

function CodeBlock({ language, value, isUser }: { language: string; value: string; isUser: boolean }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {language || "plaintext"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={handleCopy}
        >
          {copied ? (
            <IconCheck className="h-3 w-3" />
          ) : (
            <IconCopy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <div className="overflow-x-auto bg-muted">
        <pre className="!m-0 !bg-muted p-4 !text-foreground">
          <code className={`language-${language} !bg-transparent !text-foreground text-sm leading-relaxed block`}>
            {value}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  className,
  isUser = false,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "markdown-content prose prose-sm dark:prose-invert max-w-none",
        isUser ? "prose-invert" : "",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 pb-2 border-b" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mt-3 mb-2" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-semibold mt-2 mb-1" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-xs font-semibold mt-2 mb-1" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-7 last:mb-0" {...props} />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className={cn(
                "font-medium underline underline-offset-4 transition-colors",
                isUser
                  ? "text-primary-foreground/90 hover:text-primary-foreground"
                  : "text-primary hover:text-primary/80"
              )}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="my-4 ml-6 list-disc [&>li]:mt-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-4 ml-6 list-decimal [&>li]:mt-2" {...props} />
          ),
          li: ({ node, ...props }) => <li className="leading-7" {...props} />,

          // Code blocks
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const inline = !className;
            
            // Properly extract text content from children
            const getTextContent = (child: any): string => {
              if (typeof child === 'string') return child;
              if (Array.isArray(child)) return child.map(getTextContent).join('');
              if (child?.props?.children) return getTextContent(child.props.children);
              return '';
            };
            
            const value = getTextContent(children).replace(/\n$/, "");

            if (inline) {
              return (
                <code
                  className={cn(
                    "relative rounded px-[0.4rem] py-[0.2rem] font-mono text-xs font-semibold",
                    isUser
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={language} value={value} isUser={isUser} />;
          },

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className={cn(
                "mt-4 border-l-4 pl-4 italic",
                isUser
                  ? "border-primary-foreground/50 text-primary-foreground/90"
                  : "border-muted-foreground/50 text-muted-foreground"
              )}
              {...props}
            />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="my-4 w-full overflow-x-auto rounded-lg border">
              <table className="w-full text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              className={cn(
                "border-b font-medium",
                isUser ? "bg-primary-foreground/10" : "bg-muted/50"
              )}
              {...props}
            />
          ),
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => (
            <tr className="border-b last:border-0" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2" {...props} />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr
              className={cn(
                "my-6 border-t",
                isUser ? "border-primary-foreground/30" : "border-border"
              )}
              {...props}
            />
          ),

          // Images
          img: ({ node, ...props }) => (
            <img
              className="my-4 rounded-lg shadow-md max-w-full h-auto"
              {...props}
            />
          ),

          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold" {...props} />
          ),

          // Emphasis/Italic
          em: ({ node, ...props }) => <em className="italic" {...props} />,

          // Delete/Strikethrough
          del: ({ node, ...props }) => (
            <del className="line-through opacity-70" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
