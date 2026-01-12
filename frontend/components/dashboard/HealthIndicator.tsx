import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface HealthIndicatorProps {
  status: "ok" | "degraded" | "error" | "loading";
}

export function HealthIndicator({ status }: HealthIndicatorProps) {
  if (status === "loading") {
    return (
      <Badge variant="outline" className="animate-pulse">
        Checking...
      </Badge>
    );
  }

  if (status === "ok") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Healthy
      </Badge>
    );
  }

  if (status === "degraded") {
    return (
      <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700">
        <AlertCircle className="h-3 w-3 mr-1" />
        Degraded
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <XCircle className="h-3 w-3 mr-1" />
      Error
    </Badge>
  );
}
