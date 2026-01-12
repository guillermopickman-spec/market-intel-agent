import { z } from "zod"

// Mission request schema for executing missions
export const MissionRequestSchema = z.object({
  user_input: z.string().min(1, "Mission input is required"),
  conversation_id: z.number().int().positive().optional(),
})

export type MissionRequest = z.infer<typeof MissionRequestSchema>

// Mission log/report schema
export const MissionLogSchema = z.object({
  id: z.number().int(),
  conversation_id: z.number().int().nullable(),
  query: z.string().nullable(),
  response: z.string().nullable(),
  status: z.enum(["COMPLETED", "FAILED", "PENDING", "IN_PROGRESS"]).nullable(),
  created_at: z.string().datetime().nullable(),
})

export type MissionLog = z.infer<typeof MissionLogSchema>

// Stream chunk schemas for SSE responses
export const ThinkingChunkSchema = z.object({
  type: z.literal("thinking"),
  content: z.string(),
})

export const ToolChunkSchema = z.object({
  type: z.literal("tool"),
  tool: z.string().optional(),
  result: z.string().optional(),
})

export const CompleteChunkSchema = z.object({
  type: z.literal("complete"),
  report: z.string().optional(),
})

export const ErrorChunkSchema = z.object({
  type: z.literal("error"),
  error: z.string(),
})

export const StreamChunkSchema = z.discriminatedUnion("type", [
  ThinkingChunkSchema,
  ToolChunkSchema,
  CompleteChunkSchema,
  ErrorChunkSchema,
])

export type StreamChunk = z.infer<typeof StreamChunkSchema>
