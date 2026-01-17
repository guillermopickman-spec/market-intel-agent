"use client";

import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMissions, type Mission } from "@/lib/queries";

interface MissionTabsProps {
  selectedMissionId: number | undefined;
  onSelectMission: (missionId: number | undefined) => void;
}

export default function MissionTabs({
  selectedMissionId,
  onSelectMission,
}: MissionTabsProps) {
  const { missions, isLoading, error } = useMissions();

  const getStatusIcon = (status: string) => {
    if (status === "COMPLETED") {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    } else if (status === "FAILED") {
      return <XCircle className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="border-b border-border pb-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">Filter by Mission:</span>
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {/* "All Missions" tab */}
          <Button
            variant={selectedMissionId === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectMission(undefined)}
            className="flex-shrink-0"
          >
            All Missions
          </Button>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading missions...
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="px-3 py-2 text-sm text-destructive">
              Failed to load missions
            </div>
          )}

          {/* Mission tabs */}
          {!isLoading && !error && missions.map((mission) => {
            const isSelected = selectedMissionId === mission.conversation_id;
            return (
              <Button
                key={mission.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectMission(mission.conversation_id)}
                className="flex-shrink-0 flex items-center gap-2"
              >
                {getStatusIcon(mission.status)}
                <span className="truncate max-w-[200px]">
                  {mission.title}
                </span>
              </Button>
            );
          })}

          {/* Empty state */}
          {!isLoading && !error && missions.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No missions available. Run a mission first to query it here.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
