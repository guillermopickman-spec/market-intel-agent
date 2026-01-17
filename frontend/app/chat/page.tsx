"use client";

import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Chat with Reports
          </h1>
          <p className="text-muted-foreground">
            Ask questions about your mission reports using RAG-powered search
          </p>
        </div>
        <ChatInterface />
      </div>
    </div>
  );
}
