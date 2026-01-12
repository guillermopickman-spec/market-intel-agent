"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { HealthIndicator } from "@/components/dashboard/HealthIndicator";
import { useHealthCheck, useMissionStats } from "@/lib/queries";
import { Activity, Database, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: health, isLoading: healthLoading } = useHealthCheck();
  const { data: stats, isLoading: statsLoading } = useMissionStats();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Market Intelligence Agent</h1>
            <p className="text-muted-foreground mt-2">
              Autonomous Market Auditing & Technical Reconnaissance Engine
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/agent">
              <Button>Agent Terminal</Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline">Reports</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="System Health"
            value={<HealthIndicator status={health?.status || "loading"} />}
            icon={Activity}
            isLoading={healthLoading}
          />
          <StatCard
            title="Total Missions"
            value={stats?.total_missions || 0}
            description="All time executions"
            icon={Database}
            isLoading={statsLoading}
          />
          <StatCard
            title="Completed"
            value={stats?.completed_missions || 0}
            description="Successful missions"
            icon={Zap}
            isLoading={statsLoading}
          />
          <StatCard
            title="Failed"
            value={stats?.failed_missions || 0}
            description="Failed missions"
            icon={TrendingUp}
            isLoading={statsLoading}
          />
        </div>

        {health && (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Database Status"
              value={health.database === "up" ? "Online" : "Offline"}
              description={health.database}
            />
            <StatCard
              title="ChromaDB Status"
              value={health.chromadb === "up" ? "Online" : "Offline"}
              description={health.chromadb}
            />
            <StatCard
              title="Server Time"
              value={new Date(health.server_time).toLocaleTimeString()}
              description="UTC"
            />
          </div>
        )}

        {stats && stats.recent_price_data && stats.recent_price_data.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Recent Price Data</h2>
            <div className="grid gap-2">
              {stats.recent_price_data.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.product}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.source}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {item.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
