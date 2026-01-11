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

const STORAGE_KEY_JOB = "replay_mobile_pending_job";

export function useAsyncGeneration(
  onComplete: (code: string, title?: string, videoUrl?: string) => void,
  onError: (error: string) => void
): UseAsyncGenerationResult {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  const hasRecoveredRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  // Recovery: Check for pending job on mount (after screen wake)
  useEffect(() => {
    if (hasRecoveredRef.current) return;
    hasRecoveredRef.current = true;
    
    const stored = localStorage.getItem(STORAGE_KEY_JOB);
    if (stored) {
      try {
        const { jobId, videoUrl } = JSON.parse(stored);
        if (jobId) {
          console.log("[useAsyncGeneration] Recovering pending job:", jobId);
          // Check job status immediately
          checkAndRecoverJob(jobId, videoUrl);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY_JOB);
      }
    }
  }, []);
  
  // Check job status and recover
  const checkAndRecoverJob = async (jobId: string, videoUrl: string) => {
    try {
      const res = await fetch(`/api/generations?id=${jobId}`);
      if (!res.ok) {
        localStorage.removeItem(STORAGE_KEY_JOB);
        return;
      }
      
      const data = await res.json();
      if (!data.success || !data.generation) {
        localStorage.removeItem(STORAGE_KEY_JOB);
        return;
      }
      
      const gen = data.generation;
      
      if (gen.status === "complete" && gen.output_code) {
        console.log("[useAsyncGeneration] Job already complete, recovering...");
        localStorage.removeItem(STORAGE_KEY_JOB);
        setJobStatus({
          status: "complete",
          progress: 100,
          message: "Complete!",
          code: gen.output_code,
          title: gen.title,
        });
        onComplete(gen.output_code, gen.title, videoUrl);
      } else if (gen.status === "failed") {
        localStorage.removeItem(STORAGE_KEY_JOB);
        setJobStatus({
          status: "failed",
          progress: 0,
          message: "Generation failed",
          error: gen.error || "Server processing failed",
        });
      } else if (gen.status === "running") {
        // Still processing, resume polling
        console.log("[useAsyncGeneration] Job still running, resuming poll...");
        setJobStatus({ status: "processing", progress: 50, message: "Resuming..." });
        currentJobIdRef.current = jobId;
        setUploadedVideoUrl(videoUrl);
        startPolling(jobId, videoUrl);
      }
    } catch (err) {
      console.error("[useAsyncGeneration] Recovery failed:", err);
      localStorage.removeItem(STORAGE_KEY_JOB);
    }
  };

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
        localStorage.removeItem(STORAGE_KEY_JOB); // Clear pending job
        setJobStatus({
          status: "complete",
          progress: 100,
          message: "Complete!",
          code: gen.output_code || gen.code,
          title: gen.title,
        });
        onComplete(gen.output_code || gen.code, gen.title, videoUrl);
      } else if (gen.status === "failed") {
        stopPolling();
        localStorage.removeItem(STORAGE_KEY_JOB); // Clear pending job
        setJobStatus({
          status: "failed",
          progress: 0,
          message: "Generation failed",
          error: gen.error || "Server processing failed",
        });
        onError(gen.error || "Generation failed on server");
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
      console.log("[useAsyncGeneration] API Response:", { jobId, status: data.status, hasCode: !!data.code });
      
      // Check if API returned complete result directly (synchronous mode)
      if (data.status === "complete" && data.code) {
        console.log("[useAsyncGeneration] Got code directly from API!");
        localStorage.removeItem(STORAGE_KEY_JOB); // Clear any pending job
        setJobStatus({
          status: "complete",
          progress: 100,
          message: "Complete!",
          code: data.code,
          title: data.title,
        });
        onComplete(data.code, data.title, videoUrl);
        return { jobId, videoUrl };
      }
      
      // Save job info to localStorage for recovery after screen wake
      localStorage.setItem(STORAGE_KEY_JOB, JSON.stringify({ jobId, videoUrl }));
      
      // If not complete, start polling (fallback for truly async scenarios)
      setJobStatus({ status: "processing", progress: 20, message: "Processing..." });
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
    localStorage.removeItem(STORAGE_KEY_JOB);
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
