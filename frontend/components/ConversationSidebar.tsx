"use client";

import { useState } from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversations, type Conversation } from "@/lib/queries";
import { api } from "@/lib/api";

interface ConversationSidebarProps {
  activeConversationId: number | undefined;
  onSelectConversation: (conversationId: number | undefined) => void;
  onNewConversation: () => void;
}

export default function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const { conversations, isLoading, error, refetch } = useConversations();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    setDeletingId(conversationId);
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      // If deleted conversation was active, switch to new chat
      if (conversationId === activeConversationId) {
        onNewConversation();
      }
      // Refresh conversation list
      refetch();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      alert("Failed to delete conversation. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older conversations, show date
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="w-64 border-r border-border bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewConversation}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Loading conversations...
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-destructive text-center">
              Failed to load conversations
            </div>
          )}

          {!isLoading && !error && conversations.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No conversations yet. Start a new chat!
            </div>
          )}

          {!isLoading && !error && conversations.length > 0 && (
            <div className="space-y-1">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`
                      group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer
                      transition-colors
                      ${isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-accent"
                      }
                    `}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {conv.title || "New Chat"}
                      </div>
                      <div className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatTime(conv.updated_at)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`
                        h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity
                        ${isActive ? "hover:bg-primary-foreground/20" : ""}
                      `}
                      onClick={(e) => handleDelete(conv.id, e)}
                      disabled={deletingId === conv.id}
                    >
                      {deletingId === conv.id ? (
                        <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
