"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { StreamChunk } from "@/lib/validators";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  chunks?: StreamChunk[];
}

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <ScrollArea className="h-full w-full">
      <div ref={containerRef} className="p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start a mission to begin.
          </div>
        ) : (
          messages.map((message, idx) => (
            <MessageBubble
              key={idx}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              chunks={message.chunks}
              isStreaming={isStreaming && idx === messages.length - 1}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
