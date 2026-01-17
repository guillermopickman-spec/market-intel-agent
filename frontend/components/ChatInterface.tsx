"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useChatQuery, useConversation, useConversations } from "@/lib/queries";
import ConversationSidebar from "./ConversationSidebar";
import MissionTabs from "./MissionTabs";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: string;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [selectedMissionId, setSelectedMissionId] = useState<number | undefined>(undefined);
  const { sendChatQuery, isLoading, error } = useChatQuery();
  const { conversation, isLoading: isLoadingConversation, refetch: refetchConversation } = useConversation(conversationId);
  const { refetch: refetchConversations } = useConversations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize on client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation && conversation.messages) {
      const loadedMessages: ChatMessage[] = conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      setMessages(loadedMessages);
    } else if (!conversationId) {
      // New conversation - show welcome message
      setMessages([
        {
          id: 1,
          role: "assistant",
          content: "Hello! I can help you find information from your mission reports. Ask me anything about your past missions!",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [conversation, conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelectConversation = (id: number | undefined) => {
    setConversationId(id);
    setInput("");
  };

  const handleNewConversation = () => {
    setConversationId(undefined);
    setMessages([
      {
        id: 1,
        role: "assistant",
        content: "Hello! I can help you find information from your mission reports. Ask me anything about your past missions!",
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput("");
  };

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Add placeholder assistant message
    const assistantMessageId = Date.now() + 1;
    const placeholderMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "Thinking...",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, placeholderMessage]);

    try {
      // Send query to backend (include selected mission_id for filtering)
      const response = await sendChatQuery(query, conversationId, selectedMissionId);

      // Update placeholder message with response
      setMessages((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((m) => m.id === assistantMessageId);
        if (index >= 0) {
          updated[index] = {
            id: assistantMessageId,
            role: "assistant",
            content: response.response,
            sources: response.sources && response.sources.length > 0 ? response.sources : undefined,
            timestamp: new Date().toISOString(),
          };
        }
        return updated;
      });

      // Update conversation ID if provided
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
        // Refresh conversation to get updated messages
        refetchConversation();
        // Refresh conversation list to show new title
        refetchConversations();
      }
    } catch (err) {
      // Update placeholder message with error
      setMessages((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((m) => m.id === assistantMessageId);
        if (index >= 0) {
          updated[index] = {
            id: assistantMessageId,
            role: "assistant",
            content: `Error: ${err instanceof Error ? err.message : "Failed to get response"}`,
            timestamp: new Date().toISOString(),
          };
        }
        return updated;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    // Use consistent 24-hour format to avoid hydration mismatch
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] max-h-[800px] gap-4">
      {/* Sidebar */}
      <ConversationSidebar
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mission Tabs */}
        <MissionTabs
          selectedMissionId={selectedMissionId}
          onSelectMission={setSelectedMissionId}
        />

        {/* Messages Area */}
        <Card className="flex-1 flex flex-col overflow-hidden mb-4">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {isLoadingConversation ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !isMounted ? (
                // Show placeholder during SSR to avoid hydration mismatch
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="max-w-[80%] rounded-lg p-4 bg-muted text-foreground">
                    <div className="whitespace-pre-wrap break-words">
                      Hello! I can help you find information from your mission reports. Ask me anything about your past missions!
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-medium mb-2">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-background/50"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div
                      className={`text-xs mt-2 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your mission reports..."
            disabled={isLoading || isLoadingConversation}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || isLoadingConversation || !input.trim()}
            size="default"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
