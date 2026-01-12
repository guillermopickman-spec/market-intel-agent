"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MissionLog } from "@/lib/validators";
import { format } from "date-fns";
import { Eye, Download } from "lucide-react";
import { useState } from "react";
import { ReportViewer } from "./ReportViewer";

interface ReportsTableProps {
  reports: MissionLog[];
  isLoading?: boolean;
}

export function ReportsTable({ reports, isLoading }: ReportsTableProps) {
  const [selectedReport, setSelectedReport] = useState<MissionLog | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading reports...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reports found.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Conversation ID</TableHead>
            <TableHead>Query</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-mono text-sm">{report.id}</TableCell>
              <TableCell className="font-mono text-sm">
                {report.conversation_id}
              </TableCell>
              <TableCell className="max-w-md truncate">
                {report.query || "N/A"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    report.status === "COMPLETED"
                      ? "default"
                      : report.status === "FAILED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {report.status || "UNKNOWN"}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(report.created_at), "MMM dd, yyyy HH:mm")}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (report.response) {
                        const blob = new Blob([report.response], {
                          type: "text/plain",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `mission-${report.id}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    disabled={!report.response}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedReport && (
        <ReportViewer
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </>
  );
}
