"use client";

import { Activity, Bot, FileText, TrendingUp, Loader2 } from "lucide-react";
import { useHealthCheck, useMissionStats, useActivity } from "@/lib/queries";

export default function Home() {
  const { data: health, isLoading: healthLoading, error: healthError } = useHealthCheck();
  const { data: stats, isLoading: statsLoading, error: statsError } = useMissionStats();
  const { data: activity, isLoading: activityLoading } = useActivity();

  const statCards = [
    {
      title: "Active Missions",
      value: stats?.in_progress?.toString() || "0",
      description: "Currently running",
      icon: Bot,
      color: "text-blue-500",
      loading: statsLoading,
    },
    {
      title: "Reports Generated",
      value: stats?.total?.toString() || "0",
      description: "Total missions",
      icon: FileText,
      color: "text-green-500",
      loading: statsLoading,
    },
    {
      title: "Success Rate",
      value: stats ? `${stats.success_rate.toFixed(1)}%` : "0%",
      description: "Mission completion",
      icon: TrendingUp,
      color: "text-purple-500",
      loading: statsLoading,
    },
    {
      title: "System Health",
      value: health?.status === "healthy" ? "Healthy" : health?.status || "Unknown",
      description: health ? `${health.database}, ${health.chromadb}` : "Checking...",
      icon: Activity,
      color: health?.status === "healthy" ? "text-emerald-500" : "text-yellow-500",
      loading: healthLoading,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Overview of your Market Intelligence Agent
          </p>
          {(healthError || statsError) && (
            <div className="mt-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
              <p className="text-sm text-yellow-500">
                {healthError && `Health check: ${healthError.message}`}
                {healthError && statsError && " • "}
                {statsError && `Stats: ${statsError.message}`}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-card border border-border rounded-lg p-6 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                  {stat.loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.loading ? "..." : stat.value}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {stat.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Recent Activity
          </h2>
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((item) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "completed":
                      return "bg-green-500/20 text-green-500";
                    case "active":
                      return "bg-blue-500/20 text-blue-500";
                    case "processing":
                      return "bg-yellow-500/20 text-yellow-500";
                    case "failed":
                      return "bg-red-500/20 text-red-500";
                    default:
                      return "bg-muted text-muted-foreground";
                  }
                };

                const formatTimeAgo = (timestamp: string) => {
                  const date = new Date(timestamp);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);

                  if (diffMins < 60) return `${diffMins} minutes ago`;
                  if (diffHours < 24) return `${diffHours} hours ago`;
                  return `${diffDays} days ago`;
                };

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                  >
                    <div>
                      <p className="text-foreground font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeAgo(item.timestamp)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
