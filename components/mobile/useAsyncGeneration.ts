"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface JobStatus {
  status: "pending" | "processing" | "complete" | "failed";
  progress: number;
  message: string;
  code?: string;
  title?: string;
  error?: string;
}

interface UseAsyncGenerationResult {
  startGeneration: (videoBlob: Blob, styleDirective: string) => Promise<string | null>;
  jobStatus: JobStatus | null;
  isPolling: boolean;
  stopPolling: () => void;
  resetJob: () => void;
}

// Simulated progress messages
const PROGRESS_MESSAGES = [
  { progress: 10, message: "Uploading video..." },
  { progress: 30, message: "Analyzing content..." },
  { progress: 50, message: "Reconstructing UI..." },
  { progress: 70, message: "Generating code..." },
  { progress: 85, message: "Applying styles..." },
  { progress: 95, message: "Finalizing..." },
];

export function useAsyncGeneration(
  onComplete: (code: string, title?: string) => void,
  onError: (error: string) => void
): UseAsyncGenerationResult {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, []);

  // Simulate progress while waiting for server
  const startProgressSimulation = useCallback(() => {
    let stepIndex = 0;
    
    progressRef.current = setInterval(() => {
      if (stepIndex < PROGRESS_MESSAGES.length) {
        const step = PROGRESS_MESSAGES[stepIndex];
        setJobStatus(prev => prev ? {
          ...prev,
          progress: step.progress,
          message: step.message,
        } : null);
        stepIndex++;
      }
    }, 3000); // Update every 3 seconds
  }, []);

  const stopProgressSimulation = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  // Start generation - calls API and waits for result
  const startGeneration = useCallback(async (videoBlob: Blob, styleDirective: string): Promise<string | null> => {
    try {
      // Reset state
      setJobStatus({ status: "processing", progress: 5, message: "Starting..." });
      setIsPolling(true);
      
      // Start progress simulation
      startProgressSimulation();
      
      // Create form data
      const formData = new FormData();
      formData.append("video", videoBlob, `video.${videoBlob.type.includes("webm") ? "webm" : "mp4"}`);
      formData.append("styleDirective", styleDirective);

      console.log("[useAsyncGeneration] Calling /api/generate/start...");

      // Call API - this will wait for the full result
      const res = await fetch("/api/generate/start", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      // Stop progress simulation
      stopProgressSimulation();

      if (res.status === 401) {
        setIsPolling(false);
        setJobStatus({ status: "failed", progress: 0, message: "Please log in", error: "Unauthorized" });
        onError("Please log in to continue");
        return null;
      }

      if (res.status === 402) {
        setIsPolling(false);
        const data = await res.json();
        setJobStatus({ status: "failed", progress: 0, message: "Insufficient credits", error: data.error });
        onError("Insufficient credits");
        return null;
      }

      const data = await res.json();
      console.log("[useAsyncGeneration] API response:", { success: data.success, hasCode: !!data.code, codeLength: data.code?.length });

      if (data.success && data.code) {
        setJobStatus({
          status: "complete",
          progress: 100,
          message: "Complete!",
          code: data.code,
          title: data.title,
        });
        setIsPolling(false);
        
        // Call completion handler
        onComplete(data.code, data.title);
        
        return data.jobId;
      } else {
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
    } catch (err) {
      console.error("[useAsyncGeneration] Error:", err);
      stopProgressSimulation();
      setIsPolling(false);
      
      const errorMsg = err instanceof Error ? err.message : "Failed to generate";
      setJobStatus({
        status: "failed",
        progress: 0,
        message: errorMsg,
        error: errorMsg,
      });
      onError(errorMsg);
      return null;
    }
  }, [startProgressSimulation, stopProgressSimulation, onComplete, onError]);

  // Stop polling (for compatibility)
  const stopPolling = useCallback(() => {
    stopProgressSimulation();
    setIsPolling(false);
  }, [stopProgressSimulation]);

  // Reset job state
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
