"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CREDIT_COSTS } from "@/lib/credits/context";

interface JobStatus {
  status: "pending" | "processing" | "complete" | "failed";
  progress: number;
  message: string;
  code?: string;
  title?: string;
  error?: string;
}

interface UseAsyncGenerationResult {
  startGeneration: (videoUrl: string, styleDirective: string) => Promise<{ jobId: string; videoUrl: string } | null>;
  jobStatus: JobStatus | null;
  isPolling: boolean;
  stopPolling: () => void;
  resetJob: () => void;
}

// ... imports ...

export function useAsyncGeneration(
  onComplete: (code: string, title?: string, videoUrl?: string) => void,
  onError: (error: string) => void
): UseAsyncGenerationResult {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // ... cleanup effect ...
  // ... progress simulation ...

  // Start generation - calls API with EXISTING video URL
  const startGeneration = useCallback(async (videoUrl: string, styleDirective: string): Promise<{ jobId: string; videoUrl: string } | null> => {
    try {
      // Reset state
      setJobStatus({ status: "processing", progress: 5, message: "Checking credits..." });
      setIsPolling(true);

      // STEP 1: Spend credits FIRST
      console.log("[useAsyncGeneration] Spending credits via /api/credits/spend...");
      const spendRes = await fetch("/api/credits/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cost: CREDIT_COSTS.VIDEO_GENERATE,
          reason: "video_generate",
          referenceId: `mobile_gen_${Date.now()}`,
        }),
      });

      const spendData = await spendRes.json();
      if (!spendRes.ok || !spendData.success) {
        setIsPolling(false);
        setJobStatus({ status: "failed", progress: 0, message: "Insufficient credits", error: spendData.error });
        onError(spendData.error || "Insufficient credits");
        return null;
      }

      // STEP 2: Start generation with video URL (Skip upload logic here - handled by processor)
      setJobStatus({ status: "processing", progress: 30, message: "Starting generation..." });
      startProgressSimulation();

      console.log("[useAsyncGeneration] Calling /api/generate/start with videoUrl:", videoUrl);

      const res = await fetch("/api/generate/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl,
          styleDirective,
        }),
      });

      stopProgressSimulation();

      if (res.status === 401) {
        setIsPolling(false);
        setJobStatus({ status: "failed", progress: 0, message: "Please log in", error: "Unauthorized" });
        onError("Please log in to continue");
        return null;
      }

      // Handle non-JSON responses
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await res.text();
        console.error("[useAsyncGeneration] Non-JSON response:", res.status, textResponse);
        setIsPolling(false);
        setJobStatus({ 
          status: "failed", 
          progress: 0, 
          message: `Server error: ${res.status}`, 
          error: textResponse 
        });
        onError(`Server error: ${res.status}`);
        return null;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setJobStatus({
          status: "failed",
          progress: 0,
          message: data.error || "Generation failed",
          error: data.error,
        });
        setIsPolling(false);
        onError(data.error || "Generation failed");
        return null;
      }

      if (data.success && data.code) {
        setJobStatus({
          status: "complete",
          progress: 100,
          message: "Complete!",
          code: data.code,
          title: data.title,
        });
        setIsPolling(false);
        onComplete(data.code, data.title, videoUrl);
        return { jobId: data.jobId, videoUrl };
      }
      
      return null;
    } catch (err) {
      console.error("[useAsyncGeneration] Error:", err);
      stopProgressSimulation();
      setIsPolling(false);
      const errorMsg = err instanceof Error ? err.message : "Failed to generate";
      setJobStatus({ status: "failed", progress: 0, message: errorMsg, error: errorMsg });
      onError(errorMsg);
      return null;
    }
  }, [startProgressSimulation, stopProgressSimulation, onComplete, onError]);

  const stopPolling = useCallback(() => {
    stopProgressSimulation();
    setIsPolling(false);
  }, [stopProgressSimulation]);

  const resetJob = useCallback(() => {
    stopPolling();
    setJobStatus(null);
  }, [stopPolling]);

  return {
    startGeneration,
    jobStatus,
    isPolling,
    stopPolling,
    resetJob,
  };
}
