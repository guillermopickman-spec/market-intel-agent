"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MissionLog } from "@/lib/validators";
import { format } from "date-fns";
import { X } from "lucide-react";

interface ReportViewerProps {
  report: MissionLog;
  onClose: () => void;
}

export function ReportViewer({ report, onClose }: ReportViewerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Mission Report #{report.id} - Conversation {report.conversation_id}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div className="space-y-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Query</p>
              <p className="text-sm">{report.query || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-sm">{report.status || "UNKNOWN"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm">
                {format(new Date(report.created_at), "PPpp")}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-muted-foreground mb-2">Response</p>
            <ScrollArea className="h-full border rounded-md p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {report.response || "No response available"}
              </pre>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
