import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query"
import { MissionRequest, MissionLog, StreamChunk } from "./validators"
import { z } from "zod"

// Get API base URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Health check response schema
const HealthResponseSchema = z.object({
  status: z.string(),
  database: z.string(),
  chromadb: z.string(),
  server_time: z.string(),
})

export type HealthResponse = z.infer<typeof HealthResponseSchema>

// Stats response schema
const StatsResponseSchema = z.object({
  total_missions: z.number(),
  completed_missions: z.number(),
  failed_missions: z.number(),
})

export type StatsResponse = z.infer<typeof StatsResponseSchema>

// Health check hook
export function useHealthCheck() {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/health`)
      if (!response.ok) {
        throw new Error("Health check failed")
      }
      const data = await response.json()
      return HealthResponseSchema.parse(data)
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Mission stats hook
export function useMissionStats() {
  return useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/stats`)
      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }
      const data = await response.json()
      return StatsResponseSchema.parse(data)
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

// Reports hook
export function useReports() {
  return useQuery<MissionLog[]>({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/reports`)
      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }
      const data = await response.json()
      return z.array(z.any()).parse(data) as MissionLog[]
    },
  })
}

// Streaming mission hook
export function useStreamingMission(
  onChunk: (chunk: StreamChunk) => void,
  onError: (error: Error) => void
): UseMutationResult<void, Error, MissionRequest> {
  return useMutation({
    mutationFn: async (request: MissionRequest) => {
      const response = await fetch(`${API_URL}/execute/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true })

          // Process complete lines (NDJSON format)
          const lines = buffer.split("\n")
          buffer = lines.pop() || "" // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const chunk = JSON.parse(line) as StreamChunk
                onChunk(chunk)
              } catch (parseError) {
                console.error("Failed to parse chunk:", line, parseError)
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer) as StreamChunk
            onChunk(chunk)
          } catch (parseError) {
            console.error("Failed to parse final chunk:", buffer, parseError)
          }
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)))
        throw error
      }
    },
  })
}
