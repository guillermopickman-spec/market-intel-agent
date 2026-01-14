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
  | { type: "complete"; report: string }
  | { type: "error"; error: string };

// Streaming state type
export interface StreamingState {
  isStreaming: boolean;
  currentThinking: string;
  toolExecutions: Array<{ tool: string; status: string; result?: string }>;
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
  const [currentThinking, setCurrentThinking] = useState("");
  const [toolExecutions, setToolExecutions] = useState<Array<{ tool: string; status: string; result?: string }>>([]);
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
      setCurrentThinking("");
      setToolExecutions([]);
      setPartialReport("");
      setFinalReport(null);
      setError(null);

      if (useMockApi()) {
        // Mock streaming for testing
        const mockSteps = [
          { type: "thinking", content: "Analyzing mission..." },
          { type: "thinking", content: "Plan generated with 3 steps" },
          { type: "tool", tool: "web_search", result: "Executing web_search..." },
          { type: "tool", tool: "web_search", result: "Completed: Found results..." },
          { type: "thinking", content: "Synthesizing final report..." },
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
      
      case "tool":
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
        setError(new Error(message.error));
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
    currentThinking,
    toolExecutions,
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
