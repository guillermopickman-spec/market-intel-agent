"use client";

import { Bot, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMissionExecution, useReports, type MissionRequest } from "@/lib/queries";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your Market Intelligence Agent. I can help you analyze markets, generate reports, and gather competitive intelligence. What would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const { executeMission, isLoading: isExecuting, error: executionError } = useMissionExecution();
  const { refetch: refetchReports } = useReports();

  const handleSend = async () => {
    if (!input.trim() || isExecuting) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    try {
      // Execute mission via backend API
      const request: MissionRequest = {
        user_input: currentInput,
      };
      
      const result = await executeMission(request);

      // Add assistant response
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: result.report || "Mission completed successfully.",
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh reports list to show new mission log
      if (refetchReports) {
        setTimeout(() => {
          refetchReports();
        }, 1000);
      }
    } catch (error) {
      // Handle error
      const errorMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to execute mission. Please try again."}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Agent Terminal</h1>
          <p className="text-muted-foreground mt-2">
            Interact with your Market Intelligence Agent
          </p>
          {executionError && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-500">
                Execution Error: {executionError.message}
              </p>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="bg-primary/20 p-2 rounded-full">
                    <div className="h-5 w-5 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            ))}
            {isExecuting && (
              <div className="flex items-start space-x-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Executing mission...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isExecuting && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-background border border-input rounded-md px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isExecuting}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isExecuting}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
