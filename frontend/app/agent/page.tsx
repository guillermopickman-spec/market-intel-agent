"use client";

import { Bot, Send, Loader2, CheckCircle2, Circle, Search, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useMissionExecutionStream, useReports, type MissionRequest } from "@/lib/queries";

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
  const {
    executeMissionStream,
    cancelStream,
    isStreaming,
    currentStep,
    totalSteps,
    progressPercentage,
    currentThinking,
    toolExecutions,
    actions,
    finalReport,
    error: executionError,
  } = useMissionExecutionStream();
  const { refetch: refetchReports } = useReports();
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);

  // Update streaming message when state changes
  useEffect(() => {
    if (isStreaming && streamingMessageId !== null) {
      setMessages((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((m) => m.id === streamingMessageId);
        
        if (index >= 0) {
          let content = "";
          
          // Add thinking steps
          if (currentThinking) {
            content += `🧠 ${currentThinking}\n\n`;
          }
          
          // Add tool executions
          if (toolExecutions.length > 0) {
            content += "**Tools Executed:**\n";
            toolExecutions.forEach((tool) => {
              const icon = tool.status === "completed" ? "✅" : "⏳";
              const toolName = tool.tool === "web_search" ? "Web Search" : 
                              tool.tool === "web_research" ? "Web Research" : 
                              tool.tool;
              content += `${icon} ${toolName}\n`;
            });
            content += "\n";
          }
          
          // Add final report if available
          if (finalReport) {
            content = finalReport;
          }
          
          updated[index] = {
            ...updated[index],
            content: content || "Processing...",
          };
        }
        
        return updated;
      });
    } else if (!isStreaming && finalReport && streamingMessageId !== null) {
      // Finalize the message with the complete report
      setMessages((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((m) => m.id === streamingMessageId);
        
        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            content: finalReport,
          };
        }
        
        return updated;
      });
      setStreamingMessageId(null);
      
      // Refresh reports list
      if (refetchReports) {
        setTimeout(() => {
          refetchReports();
        }, 1000);
      }
    }
  }, [isStreaming, currentStep, totalSteps, progressPercentage, currentThinking, toolExecutions, actions, finalReport, streamingMessageId, refetchReports]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    // Create placeholder assistant message for streaming
    const assistantMessageId = messages.length + 2;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "Starting mission execution...",
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    try {
      // Execute mission via streaming API
      const request: MissionRequest = {
        user_input: currentInput,
      };
      
      await executeMissionStream(request);
    } catch (error) {
      // Handle error
      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to execute mission. Please try again."}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((m) => m.id === assistantMessageId);
        if (index >= 0) {
          updated[index] = errorMessage;
        }
        return updated;
      });
      setStreamingMessageId(null);
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
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="text-red-500 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-500 mb-1">Execution Error</p>
                  <p className="text-sm text-red-400">{executionError.message}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs text-red-300 hover:text-red-100 underline"
                  >
                    Reload page to retry
                  </button>
                </div>
              </div>
            </div>
          )}
          {isStreaming && (
            <div className="mt-4 space-y-3">
              {/* Progress Bar */}
              {totalSteps > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-blue-500">
                      Step {currentStep} of {totalSteps}
                    </p>
                    <p className="text-sm text-blue-400">{progressPercentage}%</p>
                  </div>
                  <div className="w-full bg-blue-500/20 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Tool Executions */}
              {toolExecutions.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-500 mb-3">Tools Executing:</p>
                  <div className="space-y-2">
                    {toolExecutions.map((tool, idx) => (
                      <div key={idx} className="bg-background/50 rounded-md p-3 border border-border">
                        <div className="flex items-center space-x-2 mb-1">
                          {tool.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : tool.status === "failed" ? (
                            <Circle className="h-4 w-4 text-red-500 fill-red-500 flex-shrink-0" />
                          ) : (
                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {tool.tool === "web_search" ? "Web Search" : 
                             tool.tool === "web_research" ? "Web Research" : 
                             tool.tool}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            tool.status === "completed" ? "bg-green-500/20 text-green-500" :
                            tool.status === "failed" ? "bg-red-500/20 text-red-500" :
                            "bg-blue-500/20 text-blue-500"
                          }`}>
                            {tool.status}
                          </span>
                        </div>
                        {tool.args && (
                          <div className="ml-6 mt-1">
                            {tool.args.query && (
                              <p className="text-xs text-muted-foreground">
                                Query: <span className="font-mono">{tool.args.query}</span>
                              </p>
                            )}
                            {tool.args.url && (
                              <p className="text-xs text-muted-foreground">
                                URL: <span className="font-mono text-blue-400">{tool.args.url}</span>
                              </p>
                            )}
                          </div>
                        )}
                        {tool.summary && (
                          <p className="ml-6 mt-1 text-xs text-muted-foreground italic">
                            {tool.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              {actions.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-purple-500 mb-3">Actions:</p>
                  <div className="space-y-2">
                    {actions.map((action, idx) => (
                      <div key={idx} className="bg-background/50 rounded-md p-3 border border-border">
                        <div className="flex items-center space-x-2">
                          {action.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : action.status === "failed" ? (
                            <Circle className="h-4 w-4 text-red-500 fill-red-500 flex-shrink-0" />
                          ) : (
                            <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {action.action === "save_to_notion" ? "Save to Notion" :
                             action.action === "dispatch_email" ? "Send Email" :
                             action.action}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            action.status === "completed" ? "bg-green-500/20 text-green-500" :
                            action.status === "failed" ? "bg-red-500/20 text-red-500" :
                            "bg-purple-500/20 text-purple-500"
                          }`}>
                            {action.status}
                          </span>
                        </div>
                        {action.result && (
                          <p className="ml-6 mt-1 text-xs text-muted-foreground">
                            {action.result}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            {isStreaming && currentThinking && (
              <div className="flex items-start space-x-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-lg p-4 max-w-[80%]">
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs font-semibold text-primary">Thinking...</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentThinking}</p>
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
                onKeyPress={(e) => e.key === "Enter" && !isStreaming && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-background border border-input rounded-md px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isStreaming}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isStreaming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Streaming...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
              {isStreaming && (
                <button
                  onClick={cancelStream}
                  className="bg-red-500/20 text-red-500 px-4 py-2 rounded-md hover:bg-red-500/30 flex items-center space-x-2"
                >
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
