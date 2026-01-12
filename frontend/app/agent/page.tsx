"use client";

import { useState } from "react";
import { MessageList } from "@/components/agent/MessageList";
import { MissionInput } from "@/components/agent/MissionInput";
import { useStreamingMission } from "@/lib/queries";
import { MissionRequest, StreamChunk } from "@/lib/validators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  chunks?: StreamChunk[];
}

export default function AgentTerminal() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChunks, setCurrentChunks] = useState<StreamChunk[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const streamingMutation = useStreamingMission(
    (chunk: StreamChunk) => {
      if (chunk.type === "thinking") {
        setCurrentChunks((prev) => {
          const updated = [...prev, chunk];
          return updated;
        });
      } else if (chunk.type === "tool") {
        setCurrentChunks((prev) => {
          const updated = [...prev, chunk];
          return updated;
        });
      } else if (chunk.type === "complete") {
        // Final report received - capture chunks before clearing
        setCurrentChunks((prevChunks) => {
          const finalChunks = [...prevChunks];
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: chunk.report || "",
              timestamp: new Date(),
              chunks: finalChunks,
            },
          ]);
          setIsStreaming(false);
          return []; // Clear chunks
        });
      } else if (chunk.type === "error") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${chunk.error || "Unknown error"}`,
            timestamp: new Date(),
          },
        ]);
        setCurrentChunks([]);
        setIsStreaming(false);
      }
    },
    (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
      setCurrentChunks([]);
      setIsStreaming(false);
    }
  );

  const handleSubmit = (data: MissionRequest) => {
    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: data.user_input,
        timestamp: new Date(),
      },
    ]);

    // Start streaming
    setIsStreaming(true);
    setCurrentChunks([]);
    streamingMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Agent Terminal</h1>
            <p className="text-sm text-muted-foreground">
              Interactive mission execution with real-time streaming
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader>
            <CardTitle>Mission Execution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            <div className="flex-1 overflow-hidden">
              <MessageList messages={messages} isStreaming={isStreaming} />
            </div>
            <div className="border-t p-4">
              <MissionInput
                onSubmit={handleSubmit}
                isLoading={isStreaming || streamingMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
