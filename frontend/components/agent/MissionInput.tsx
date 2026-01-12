"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MissionRequestSchema, type MissionRequest } from "@/lib/validators";

interface MissionInputProps {
  onSubmit: (data: MissionRequest) => void;
  isLoading?: boolean;
}

export function MissionInput({ onSubmit, isLoading }: MissionInputProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MissionRequest>({
    resolver: zodResolver(MissionRequestSchema),
  });

  const handleFormSubmit = (data: MissionRequest) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Textarea
          {...register("user_input")}
          placeholder="Enter your mission query... (e.g., 'Find current pricing for NVIDIA H100 GPUs')"
          className="min-h-[100px] resize-none"
          disabled={isLoading}
        />
        {errors.user_input && (
          <p className="text-sm text-destructive">
            {errors.user_input.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Execute Mission
          </>
        )}
      </Button>
    </form>
  );
}
