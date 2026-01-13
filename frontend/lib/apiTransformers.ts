// API response transformers
// Maps backend API response format to frontend types

import type { HealthStatus, MissionStats, Report } from "./mockApi";

// Backend health response format
interface BackendHealthResponse {
  status: "ok" | "degraded";
  database: string; // "up" or "error: <message>"
  chromadb: string; // "up" or "error: <message>"
  server_time: string; // ISO timestamp
}

// Backend stats response format
interface BackendStatsResponse {
  total_missions: number;
  completed_missions: number;
  failed_missions: number;
}

/**
 * Transform backend health response to frontend HealthStatus format
 */
export function transformHealthResponse(
  backendResponse: BackendHealthResponse
): HealthStatus {
  // Map status: "ok" -> "healthy", "degraded" -> "degraded"
  const status =
    backendResponse.status === "ok" ? "healthy" : backendResponse.status;

  // Map database: "up" -> "online", anything else -> "offline"
  const database = backendResponse.database === "up" ? "online" : "offline";

  // Map chromadb: "up" -> "online", anything else -> "offline"
  const chromadb = backendResponse.chromadb === "up" ? "online" : "offline";

  return {
    status: status as "healthy" | "degraded" | "down",
    database: database as "online" | "offline",
    chromadb: chromadb as "online" | "offline",
    timestamp: backendResponse.server_time,
  };
}

/**
 * Transform backend stats response to frontend MissionStats format
 */
export function transformStatsResponse(
  backendResponse: BackendStatsResponse
): MissionStats {
  const total = backendResponse.total_missions || 0;
  const completed = backendResponse.completed_missions || 0;
  const failed = backendResponse.failed_missions || 0;

  // Calculate success rate: (completed / total) * 100
  // Handle division by zero
  const success_rate =
    total > 0 ? (completed / total) * 100 : 0;

  // Backend doesn't provide in_progress directly
  // Calculate as: total - completed - failed
  // Note: This assumes all missions are either COMPLETED or FAILED
  // If there are missions with other statuses (PENDING, IN_PROGRESS), they'll show as in_progress
  const in_progress = Math.max(0, total - completed - failed);

  return {
    total,
    completed,
    failed,
    in_progress,
    success_rate: Number(success_rate.toFixed(2)),
  };
}

// Backend reports response format
interface BackendReportResponse {
  id: number;
  conversation_id: number;
  query: string;
  response: string;
  status: string; // "COMPLETED", "FAILED", "PROCESSING", etc.
  created_at: string; // ISO timestamp
}

/**
 * Transform backend reports response to frontend Report format
 */
export function transformReportsResponse(
  backendReports: BackendReportResponse[]
): Report[] {
  return backendReports.map((backendReport) => {
    // Map status: "COMPLETED" -> "completed", "FAILED" -> "failed", etc.
    const statusMap: Record<string, "completed" | "processing" | "failed"> = {
      COMPLETED: "completed",
      FAILED: "failed",
      PROCESSING: "processing",
      PENDING: "processing",
      IN_PROGRESS: "processing",
    };

    const status =
      statusMap[backendReport.status.toUpperCase()] || "processing";

    // Use query as title, or extract from response if query is generic
    const title =
      backendReport.query && backendReport.query !== "Market Intelligence Mission"
        ? backendReport.query
        : extractTitleFromResponse(backendReport.response) ||
          `Mission Report #${backendReport.id}`;

    // Use first part of response as description (truncate to ~150 chars)
    const description = truncateText(
      backendReport.response || "No description available",
      150
    );

    // Calculate size from response length (approximate)
    const size = formatSize(backendReport.response?.length || 0);

    return {
      id: backendReport.id,
      title,
      description,
      date: backendReport.created_at,
      status,
      size,
      mission_type: extractMissionType(backendReport.query, backendReport.response),
    };
  });
}

// Helper function to extract title from response
function extractTitleFromResponse(response: string): string | null {
  if (!response) return null;

  // Try to extract from markdown headers
  const h1Match = response.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Try to extract from first line
  const firstLine = response.split("\n")[0].trim();
  if (firstLine && firstLine.length < 100) {
    return firstLine.replace(/^#+\s*/, "");
  }

  return null;
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

// Helper function to format size
function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Helper function to extract mission type from query or response
function extractMissionType(query: string, response: string): string | undefined {
  const queryLower = query?.toLowerCase() || "";
  const responseLower = response?.toLowerCase() || "";

  if (queryLower.includes("pricing") || responseLower.includes("pricing")) {
    return "pricing_intel";
  }
  if (queryLower.includes("market") || responseLower.includes("market")) {
    return "market_analysis";
  }
  if (queryLower.includes("competitive") || responseLower.includes("competitive")) {
    return "competitive_intel";
  }
  if (queryLower.includes("trend") || responseLower.includes("trend")) {
    return "trend_analysis";
  }

  return undefined;
}
