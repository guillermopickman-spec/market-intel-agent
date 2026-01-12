"use client";

import { ReportsTable } from "@/components/reports/ReportsTable";
import { useReports } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ReportsPage() {
  const { data: reports, isLoading } = useReports();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">Mission Reports</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all mission execution logs
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportsTable reports={reports || []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
