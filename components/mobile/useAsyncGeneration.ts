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
  uploadedVideoUrl: string | null;
}

// Simulated progress messages
const PROGRESS_MESSAGES = [
  "Analyzing content...",
  "Reconstructing UI...",
  "Generating code...",
  "Applying styles...",
  "Finalizing..."
];

export function useAsyncGeneration(
  onComplete: (code: string, title?: string, videoUrl?: string) => void,
  onError: (error: string) => void
): UseAsyncGenerationResult {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Poll status from server
  const pollStatus = useCallback(async (jobId: string, videoUrl: string) => {
    if (!jobId) return;
    
    try {
      const res = await fetch(`/api/generations?id=${jobId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          // Job might not be committed to DB yet, keep waiting
          console.log("Job not found yet, retrying...");
          return;
        }
        throw new Error(`Polling error: ${res.status}`);
      }
      
      const data = await res.json();
      if (!data.success || !data.generation) return;
      
      const gen = data.generation;
      
      if (gen.status === "complete") {
        stopPolling();
        setJobStatus({
          status: "complete",
          progress: 100,
          message: "Complete!",
          code: gen.code,
          title: gen.title,
        });
        onComplete(gen.code, gen.title, videoUrl);
      } else if (gen.status === "failed") {
        stopPolling();
        setJobStatus({
          status: "failed",
          progress: 0,
          message: "Generation failed",
          error: "Server processing failed",
        });
        onError("Generation failed on server");
      } else {
        // Still processing
        // Just update message/progress slightly
        setJobStatus(prev => {
          // Increment progress slowly up to 90%
          const currentProgress = prev?.progress || 30;
          const nextProgress = Math.min(currentProgress + 2, 90);
          return {
            status: "processing",
            progress: nextProgress,
            message: "Processing on server...",
            ...prev
          } as JobStatus;
        });
      }
      
    } catch (err) {
      console.warn("Polling failed:", err);
      // Don't stop polling on transient errors
    }
  }, [stopPolling, onComplete, onError]);

  // Start polling loop
  const startPolling = useCallback((jobId: string, videoUrl: string) => {
    stopPolling();
    setIsPolling(true);
    currentJobIdRef.current = jobId;
    
    pollRef.current = setInterval(() => {
      pollStatus(jobId, videoUrl);
    }, 3000); // Check every 3s
  }, [stopPolling, pollStatus]);

  // Start generation - Calls Async Endpoint
  const startGeneration = useCallback(async (videoUrl: string, styleDirective: string): Promise<{ jobId: string; videoUrl: string } | null> => {
    try {
      setUploadedVideoUrl(videoUrl);
      
      // Reset state
      setJobStatus({ status: "processing", progress: 5, message: "Checking credits..." });
      
      // STEP 1: Spend credits FIRST
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
        const errorMsg = spendData.error || "Insufficient credits";
        setJobStatus({ status: "failed", progress: 0, message: errorMsg, error: errorMsg });
        onError(errorMsg);
        return null;
      }

      // STEP 2: Trigger Async Generation
      setJobStatus({ status: "processing", progress: 10, message: "Starting server job..." });
      
      console.log("[useAsyncGeneration] Calling /api/generate/async...");

      const res = await fetch("/api/generate/async", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl,
          styleDirective,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || "Failed to start job";
        setJobStatus({ status: "failed", progress: 0, message: errorMsg, error: errorMsg });
        onError(errorMsg);
        return null;
      }

      const jobId = data.jobId;
      console.log("[useAsyncGeneration] Job started:", jobId);
      
      // STEP 3: Start Polling
      setJobStatus({ status: "processing", progress: 20, message: "Job queued..." });
      startPolling(jobId, videoUrl);
      
      return { jobId, videoUrl };
      
    } catch (err) {
      console.error("[useAsyncGeneration] Error:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to start";
      setJobStatus({ status: "failed", progress: 0, message: errorMsg, error: errorMsg });
      onError(errorMsg);
      return null;
    }
  }, [onError, startPolling]);

  // Reset job state
  const resetJob = useCallback(() => {
    stopPolling();
    setJobStatus(null);
    setUploadedVideoUrl(null);
  }, [stopPolling]);

  return {
    startGeneration,
    jobStatus,
    isPolling,
    stopPolling,
    resetJob,
    uploadedVideoUrl,
  };
}
