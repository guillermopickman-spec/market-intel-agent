// Mock API responses for development and testing
// Simulates backend API responses with realistic delays

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulate network delay (50-200ms)
const simulateDelay = () => delay(50 + Math.random() * 150);

export interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  database: "online" | "offline";
  chromadb: "online" | "offline";
  timestamp: string;
}

export interface MissionStats {
  total: number;
  completed: number;
  failed: number;
  in_progress: number;
  success_rate: number;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  date: string;
  status: "completed" | "processing" | "failed";
  size: string;
  mission_type?: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  status: "completed" | "active" | "processing" | "failed";
}

export const mockApi = {
  // Health check endpoint
  async getHealth(): Promise<HealthStatus> {
    await simulateDelay();
    return {
      status: "healthy",
      database: "online",
      chromadb: "online",
      timestamp: new Date().toISOString(),
    };
  },

  // Mission statistics endpoint
  async getStats(): Promise<MissionStats> {
    await simulateDelay();
    return {
      total: 42,
      completed: 38,
      failed: 4,
      in_progress: 12,
      success_rate: 90.48, // (38/42) * 100
    };
  },

  // Reports endpoint
  async getReports(): Promise<Report[]> {
    await simulateDelay();
    return [
      {
        id: 1,
        title: "Q4 2024 Market Analysis - Tech Sector",
        description: "Comprehensive analysis of technology market trends and competitive landscape",
        date: "2024-12-15T10:30:00Z",
        status: "completed",
        size: "2.4 MB",
        mission_type: "market_analysis",
      },
      {
        id: 2,
        title: "Competitive Intelligence Report - AI Companies",
        description: "Deep dive into AI market leaders and emerging players",
        date: "2024-12-10T14:20:00Z",
        status: "completed",
        size: "1.8 MB",
        mission_type: "competitive_intel",
      },
      {
        id: 3,
        title: "Industry Trend Analysis - Cloud Services",
        description: "Market trends and growth projections for cloud service providers",
        date: "2024-12-05T09:15:00Z",
        status: "completed",
        size: "3.1 MB",
        mission_type: "trend_analysis",
      },
      {
        id: 4,
        title: "Startup Ecosystem Report - FinTech",
        description: "Analysis of financial technology startups and investment patterns",
        date: "2024-11-28T16:45:00Z",
        status: "completed",
        size: "2.7 MB",
        mission_type: "ecosystem_analysis",
      },
      {
        id: 5,
        title: "Market Opportunity Assessment - Healthcare Tech",
        description: "Evaluation of market opportunities in healthcare technology sector",
        date: "2024-11-20T11:00:00Z",
        status: "completed",
        size: "2.2 MB",
        mission_type: "opportunity_assessment",
      },
      {
        id: 6,
        title: "GPU Pricing Intelligence - H100 Analysis",
        description: "Current pricing analysis for NVIDIA H100 GPUs across cloud providers",
        date: "2024-12-12T13:30:00Z",
        status: "processing",
        size: "0.5 MB",
        mission_type: "pricing_intel",
      },
      {
        id: 7,
        title: "Blackwell Architecture Deep Dive",
        description: "Technical analysis of NVIDIA Blackwell architecture and specifications",
        date: "2024-12-08T15:20:00Z",
        status: "completed",
        size: "4.2 MB",
        mission_type: "technical_analysis",
      },
    ];
  },

  // Recent activity endpoint
  async getActivity(): Promise<Activity[]> {
    await simulateDelay();
    return [
      {
        id: 1,
        title: "Market analysis completed for TechCorp",
        description: "Comprehensive market analysis mission completed successfully",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        status: "completed",
      },
      {
        id: 2,
        title: "Competitive intelligence report generated",
        description: "AI companies competitive analysis report ready",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        status: "active",
      },
      {
        id: 3,
        title: "Industry trend analysis in progress",
        description: "Cloud services trend analysis currently processing",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        status: "processing",
      },
      {
        id: 4,
        title: "GPU pricing research mission started",
        description: "H100 pricing intelligence gathering initiated",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        status: "processing",
      },
    ];
  },

  // Error simulation for testing
  async getHealthWithError(): Promise<HealthStatus> {
    await simulateDelay();
    throw new Error("Backend service unavailable");
  },
};
