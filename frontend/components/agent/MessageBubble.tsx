import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Loader2 } from "lucide-react";
import { StreamChunk } from "@/lib/validators";
import { format } from "date-fns";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  chunks?: StreamChunk[];
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  chunks,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-primary" : "bg-secondary"
        }`}>
          {isUser ? (
            <User className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-secondary-foreground" />
          )}
        </div>
        <Card className={`${isUser ? "bg-primary/10" : "bg-card"}`}>
          <CardContent className="p-4">
            <div className="space-y-2">
              {chunks && chunks.length > 0 && (
                <div className="space-y-1 mb-2">
                  {chunks.map((chunk, idx) => (
                    <div key={idx} className="text-xs">
                      {chunk.type === "thinking" && (
                        <Badge variant="outline" className="mr-2">
                          Thinking
                        </Badge>
                      )}
                      {chunk.type === "tool" && (
                        <Badge variant="secondary" className="mr-2">
                          {chunk.tool}
                        </Badge>
                      )}
                      {chunk.content && (
                        <span className="text-muted-foreground">
                          {chunk.content}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="whitespace-pre-wrap">{content}</div>
              {isStreaming && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Streaming...</span>
                </div>
              )}
              {timestamp && (
                <div className="text-xs text-muted-foreground mt-2">
                  {format(timestamp, "HH:mm:ss")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
