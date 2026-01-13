"use client";

import { FileText, Download, Calendar, Search, Loader2 } from "lucide-react";
import { useReports } from "@/lib/queries";

export default function ReportsPage() {
  const { data: reports, isLoading, error } = useReports();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your generated intelligence reports
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports..."
                className="bg-card border border-input rounded-md pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-destructive">Error loading reports: {error.message}</p>
          </div>
        ) : reports && reports.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "completed":
                      return "bg-green-500/20 text-green-500";
                    case "processing":
                      return "bg-yellow-500/20 text-yellow-500";
                    case "failed":
                      return "bg-red-500/20 text-red-500";
                    default:
                      return "bg-muted text-muted-foreground";
                  }
                };

                return (
                  <div
                    key={report.id}
                    className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-primary/20 p-3 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {report.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {report.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(report.date).toLocaleDateString()}
                              </span>
                            </div>
                            <span>•</span>
                            <span>{report.size}</span>
                            <span>•</span>
                            <span
                              className={`px-2 py-1 rounded-full ${getStatusColor(
                                report.status
                              )}`}
                            >
                              {report.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-muted-foreground text-sm">
              Showing {reports.length} reports
              {process.env.NEXT_PUBLIC_USE_MOCK_API === "true" && " • Using mock API"}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            No reports available
          </div>
        )}
      </div>
    </div>
  );
}
