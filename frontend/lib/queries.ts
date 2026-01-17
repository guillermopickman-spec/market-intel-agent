"use client";

import { useState, useEffect } from "react";
import { mockApi, type HealthStatus, type MissionStats, type Report, type Activity } from "./mockApi";
import { api } from "./api";
import { transformHealthResponse, transformStatsResponse, transformReportsResponse } from "./apiTransformers";

const isDevelopment = process.env.NODE_ENV === "development";

// Check if we should use mock API (works on both server and client)
const useMockApi = () => {
  // In Next.js, NEXT_PUBLIC_* env vars are available on both server and client
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
};

// Mission request type
export interface MissionRequest {
  user_input: string;
  conversation_id?: number;
}

// Mission execution response type
export interface MissionExecutionResponse {
  status: "complete" | "failed";
  mission_id: number;
  report: string;
  trace: Array<{ tool: string; status?: string; result?: string }>;
}

// Stream message types
export type StreamMessage = 
  | { type: "thinking"; content: string }
  | { type: "tool"; tool: string; result: string }
  | { type: "progress"; step: number; total: number; percentage: number }
  | { type: "tool_start"; tool: string; args?: any }
  | { type: "tool_complete"; tool: string; summary: string; error?: boolean }
  | { type: "action_start"; action: string; title: string }
  | { type: "action_complete"; action: string; result: string; error?: boolean }
  | { type: "complete"; report: string }
  | { type: "error"; error: string; context?: string };

// Streaming state type
export interface StreamingState {
  isStreaming: boolean;
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
  currentThinking: string;
  toolExecutions: Array<{
    tool: string;
    status: "executing" | "completed" | "failed";
    args?: any;
    result?: string;
    summary?: string;
  }>;
  actions: Array<{
    action: string;
    status: "executing" | "completed" | "failed";
    result?: string;
  }>;
  partialReport: string;
  finalReport: string | null;
  error: Error | null;
}

// Mission execution hook for Phase 5 (non-streaming)
export function useMissionExecution() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeMission = async (request: MissionRequest): Promise<MissionExecutionResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockApi()) {
        // Mock execution for testing
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          status: "complete",
          mission_id: 999,
          report: `Mock mission execution result for: "${request.user_input}"\n\nThis is a mock response. Set NEXT_PUBLIC_USE_MOCK_API=false to use real backend.`,
          trace: [
            { tool: "web_search", status: "Gathered" },
            { tool: "web_research", status: "Gathered" },
          ],
        };
      } else {
        // Real API call to /execute endpoint
        const response = await api.post<MissionExecutionResponse>("/execute", request);
        return response;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { executeMission, isLoading, error };
}

// Mission execution hook for Phase 6 (streaming)
export function useMissionExecutionStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(10);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentThinking, setCurrentThinking] = useState("");
  const [toolExecutions, setToolExecutions] = useState<Array<{
    tool: string;
    status: "executing" | "completed" | "failed";
    args?: any;
    result?: string;
    summary?: string;
  }>>([]);
  const [actions, setActions] = useState<Array<{
    action: string;
    status: "executing" | "completed" | "failed";
    result?: string;
  }>>([]);
  const [partialReport, setPartialReport] = useState("");
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [abortStream, setAbortStream] = useState<(() => void) | null>(null);

  const executeMissionStream = (
    request: MissionRequest,
    onUpdate?: (state: StreamingState) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Reset state
      setIsStreaming(true);
      setCurrentStep(0);
      setTotalSteps(10);
      setProgressPercentage(0);
      setCurrentThinking("");
      setToolExecutions([]);
      setActions([]);
      setPartialReport("");
      setFinalReport(null);
      setError(null);

      if (useMockApi()) {
        // Mock streaming for testing
        const mockSteps: StreamMessage[] = [
          { type: "thinking", content: "Analyzing mission intent..." },
          { type: "progress", step: 1, total: 6, percentage: 16 },
          { type: "thinking", content: "Generating execution plan..." },
          { type: "progress", step: 2, total: 6, percentage: 33 },
          { type: "thinking", content: "Plan generated with 3 steps" },
          { type: "tool_start", tool: "web_search", args: { query: "example query" } },
          { type: "progress", step: 3, total: 6, percentage: 50 },
          { type: "tool_complete", tool: "web_search", summary: "Found results..." },
          { type: "thinking", content: "Synthesizing final report..." },
          { type: "progress", step: 5, total: 6, percentage: 83 },
          { type: "complete", report: `Mock mission execution result for: "${request.user_input}"\n\nThis is a mock response. Set NEXT_PUBLIC_USE_MOCK_API=false to use real backend.` },
        ];

        let stepIndex = 0;
        const interval = setInterval(() => {
          if (stepIndex >= mockSteps.length) {
            clearInterval(interval);
            setIsStreaming(false);
            const finalReport = (mockSteps[mockSteps.length - 1] as { type: "complete"; report: string }).report;
            setFinalReport(finalReport);
            resolve(finalReport);
            return;
          }

          const step = mockSteps[stepIndex] as StreamMessage;
          handleStreamMessage(step, onUpdate);
          stepIndex++;
        }, 1000);

        setAbortStream(() => () => {
          clearInterval(interval);
          setIsStreaming(false);
        });
      } else {
        // Real streaming API call
        const cleanup = api.postStream<StreamMessage>(
          "/execute/stream",
          request,
          (message) => {
            handleStreamMessage(message, onUpdate);
            
            // Handle completion
            if (message.type === "complete") {
              setIsStreaming(false);
              setFinalReport(message.report);
              setAbortStream(null);
              resolve(message.report);
            }
            
            // Handle error
            if (message.type === "error") {
              setIsStreaming(false);
              const error = new Error(message.error);
              setError(error);
              setAbortStream(null);
              reject(error);
            }
          },
          (err) => {
            setIsStreaming(false);
            setError(err);
            setAbortStream(null);
            reject(err);
          }
        );

        setAbortStream(() => cleanup);
      }
    });
  };

  const handleStreamMessage = (message: StreamMessage, onUpdate?: (state: StreamingState) => void) => {
    switch (message.type) {
      case "thinking":
        setCurrentThinking(message.content);
        break;
      
      case "progress":
        setCurrentStep(message.step);
        setTotalSteps(message.total);
        setProgressPercentage(message.percentage);
        break;
      
      case "tool_start":
        setToolExecutions((prev) => {
          // Check if tool already exists
          const existing = prev.findIndex((t) => t.tool === message.tool && t.status === "executing");
          
          if (existing >= 0) {
            // Update existing execution
            const updated = [...prev];
            updated[existing] = {
              tool: message.tool,
              status: "executing",
              args: message.args,
            };
            return updated;
          } else {
            // Add new execution
            return [
              ...prev,
              {
                tool: message.tool,
                status: "executing",
                args: message.args,
              },
            ];
          }
        });
        break;
      
      case "tool_complete":
        setToolExecutions((prev) => {
          const existing = prev.findIndex((t) => t.tool === message.tool);
          
          if (existing >= 0) {
            // Update existing execution
            const updated = [...prev];
            updated[existing] = {
              ...updated[existing],
              status: message.error ? "failed" : "completed",
              summary: message.summary,
            };
            return updated;
          } else {
            // Add new execution (shouldn't happen, but handle it)
            return [
              ...prev,
              {
                tool: message.tool,
                status: message.error ? "failed" : "completed",
                summary: message.summary,
              },
            ];
          }
        });
        break;
      
      case "action_start":
        setActions((prev) => {
          // Check if action already exists
          const existing = prev.findIndex((a) => a.action === message.action && a.status === "executing");
          
          if (existing >= 0) {
            // Update existing action
            const updated = [...prev];
            updated[existing] = {
              action: message.action,
              status: "executing",
            };
            return updated;
          } else {
            // Add new action
            return [
              ...prev,
              {
                action: message.action,
                status: "executing",
              },
            ];
          }
        });
        break;
      
      case "action_complete":
        setActions((prev) => {
          const existing = prev.findIndex((a) => a.action === message.action);
          
          if (existing >= 0) {
            // Update existing action
            const updated = [...prev];
            updated[existing] = {
              action: message.action,
              status: message.error ? "failed" : "completed",
              result: message.result,
            };
            return updated;
          } else {
            // Add new action (shouldn't happen, but handle it)
            return [
              ...prev,
              {
                action: message.action,
                status: message.error ? "failed" : "completed",
                result: message.result,
              },
            ];
          }
        });
        break;
      
      case "tool":
        // Legacy tool message type (for backward compatibility)
        setToolExecutions((prev) => {
          const existing = prev.findIndex((t) => t.tool === message.tool && t.status === "executing");
          
          if (existing >= 0) {
            // Update existing execution
            const updated = [...prev];
            updated[existing] = {
              tool: message.tool,
              status: message.result.includes("Executing") ? "executing" : "completed",
              result: message.result,
            };
            return updated;
          } else {
            // Add new execution
            return [
              ...prev,
              {
                tool: message.tool,
                status: message.result.includes("Executing") ? "executing" : "completed",
                result: message.result,
              },
            ];
          }
        });
        break;
      
      case "complete":
        setFinalReport(message.report);
        break;
      
      case "error":
        setError(new Error(message.error + (message.context ? ` (${message.context})` : "")));
        break;
    }
    
    // Note: onUpdate callback is optional and can be used by components
    // that need immediate notification. Most components will read state directly.
  };

  const cancelStream = () => {
    if (abortStream) {
      abortStream();
      setIsStreaming(false);
      setAbortStream(null);
    }
  };

  return {
    executeMissionStream,
    cancelStream,
    isStreaming,
    currentStep,
    totalSteps,
    progressPercentage,
    currentThinking,
    toolExecutions,
    actions,
    partialReport,
    finalReport,
    error,
  };
}

// Health check hook
export function useHealthCheck() {
  const [data, setData] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const fetchHealth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (useMockApi()) {
          const health = await mockApi.getHealth();
          setData(health);
        } else {
          // Real API call with transformation
          const backendResponse = await api.get<{
            status: "ok" | "degraded";
            database: string;
            chromadb: string;
            server_time: string;
          }>("/health");
          const transformed = transformHealthResponse(backendResponse);
          setData(transformed);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealth();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
}

// Mission statistics hook
export function useMissionStats() {
  const [data, setData] = useState<MissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const isMock = useMockApi();
        if (isDevelopment && typeof window !== "undefined") {
          console.log(`[Stats] Using ${isMock ? "MOCK" : "REAL"} API. NEXT_PUBLIC_USE_MOCK_API=${process.env.NEXT_PUBLIC_USE_MOCK_API}`);
        }
        
        if (isMock) {
          const stats = await mockApi.getStats();
          setData(stats);
        } else {
          // Real API call with transformation
          const backendResponse = await api.get<{
            total_missions: number;
            completed_missions: number;
            failed_missions: number;
          }>("/stats");
          const transformed = transformStatsResponse(backendResponse);
          if (isDevelopment && typeof window !== "undefined") {
            console.log(`[Stats] Backend response:`, backendResponse);
            console.log(`[Stats] Transformed:`, transformed);
          }
          setData(transformed);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
}

// Reports hook
export function useReports() {
  const [data, setData] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (useMockApi()) {
          const reports = await mockApi.getReports();
          setData(reports);
        } else {
          // Real API call with transformation
          const backendReports = await api.get<Array<{
            id: number;
            conversation_id: number;
            query: string;
            response: string;
            status: string;
            created_at: string;
          }>>("/reports");
          const transformed = transformReportsResponse(backendReports);
          setData(transformed);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  return { data, isLoading, error, refetch: () => {
    if (typeof window === "undefined") return;
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (useMockApi()) {
          const reports = await mockApi.getReports();
          setData(reports);
        } else {
          // Real API call with transformation
          const backendReports = await api.get<Array<{
            id: number;
            conversation_id: number;
            query: string;
            response: string;
            status: string;
            created_at: string;
          }>>("/reports");
          const transformed = transformReportsResponse(backendReports);
          setData(transformed);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }};
}

// Recent activity hook
export function useActivity() {
  const [data, setData] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const fetchActivity = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (useMockApi()) {
          const activity = await mockApi.getActivity();
          setData(activity);
        } else {
          // Real API call would go here
          throw new Error("Real API not yet implemented");
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
}

// Chat query types
export interface ChatResponse {
  query: string;
  conversation_id: number | null;
  title?: string | null;
  mission_id?: number | null;
  response: string;
  sources: string[];
  status: string;
}

// Conversation types
export interface Conversation {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: Array<{
    id: number;
    role: string;
    content: string;
    timestamp: string;
  }>;
}

// Mission types
export interface Mission {
  id: number;
  conversation_id: number;
  query: string;
  title: string;
  status: string;
  created_at: string;
}

// Chat query hook
export function useChatQuery() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendChatQuery = async (
    query: string,
    conversationId?: number,
    missionId?: number
  ): Promise<ChatResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockApi()) {
        // Mock response for testing
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return {
          query,
          conversation_id: conversationId || null,
          response: `Mock RAG response for: "${query}"\n\nThis is a mock response. Set NEXT_PUBLIC_USE_MOCK_API=false to use real backend.`,
          sources: ["Mock Report 1", "Mock Report 2"],
          status: "success",
        };
      } else {
        // #region debug log
        const queryStartTime = Date.now();
        fetch('http://127.0.0.1:7243/ingest/9b049a5e-546a-4d09-9a9f-aeb8a9e76b6a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queries.ts:650',message:'sendChatQuery start',data:{query,conversationId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion

        // Real API call to /chat/ask endpoint using POST (60 seconds timeout for RAG queries)
        // #region debug log
        fetch('http://127.0.0.1:7243/ingest/9b049a5e-546a-4d09-9a9f-aeb8a9e76b6a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queries.ts:657',message:'Calling api.post for /chat/ask',data:{endpoint:'/chat/ask',conversationId,missionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const response = await api.post<ChatResponse>("/chat/ask", {
          query,
          conversation_id: conversationId || null,
          mission_id: missionId || null,
        });
        // #region debug log
        const queryElapsed = Date.now() - queryStartTime;
        fetch('http://127.0.0.1:7243/ingest/9b049a5e-546a-4d09-9a9f-aeb8a9e76b6a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queries.ts:658',message:'sendChatQuery success',data:{query,elapsed:queryElapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return response;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendChatQuery, isLoading, error };
}

// Conversation hooks
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockApi()) {
        // Mock conversations
        await new Promise((resolve) => setTimeout(resolve, 500));
        setConversations([
          {
            id: 1,
            title: "Mock Conversation 1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: 5,
          },
          {
            id: 2,
            title: "Mock Conversation 2",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: 3,
          },
        ]);
      } else {
        const data = await api.get<Conversation[]>("/chat/conversations");
        setConversations(data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return { conversations, isLoading, error, refetch: fetchConversations };
}

export function useConversation(conversationId: number | undefined) {
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversation = async () => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (useMockApi()) {
        // Mock conversation with messages
        await new Promise((resolve) => setTimeout(resolve, 500));
        setConversation({
          id: conversationId,
          title: "Mock Conversation",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [
            {
              id: 1,
              role: "user",
              content: "What missions have been completed?",
              timestamp: new Date().toISOString(),
            },
            {
              id: 2,
              role: "assistant",
              content: "Mock response about missions.",
              timestamp: new Date().toISOString(),
            },
          ],
        });
      } else {
        const data = await api.get<ConversationWithMessages>(`/chat/conversations/${conversationId}`);
        setConversation(data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Failed to fetch conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  return { conversation, isLoading, error, refetch: fetchConversation };
}

// Mission hooks
export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockApi()) {
        // Mock missions
        await new Promise((resolve) => setTimeout(resolve, 500));
        setMissions([
          {
            id: 1,
            conversation_id: 123,
            query: "Find iPhone prices",
            title: "Find iPhone prices",
            status: "COMPLETED",
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            conversation_id: 456,
            query: "Research Tesla stock",
            title: "Research Tesla stock",
            status: "COMPLETED",
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        const data = await api.get<Mission[]>("/chat/missions");
        setMissions(data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Failed to fetch missions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  return { missions, isLoading, error, refetch: fetchMissions };
}
