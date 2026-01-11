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

// Polling interval in ms
const POLL_INTERVAL = 2000;

export function useAsyncGeneration(
  onComplete: (code: string, title?: string) => void,
  onError: (error: string) => void
): UseAsyncGenerationResult {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Poll for job status
  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/generate/status/${jobId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          // Job not found yet, keep polling
          return;
        }
        throw new Error("Failed to get status");
      }

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      setJobStatus({
        status: data.status,
        progress: data.progress,
        message: data.message,
        code: data.code,
        title: data.title,
        error: data.error,
      });

      // Check if job is done
      if (data.status === "complete" && data.code) {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setIsPolling(false);
        onComplete(data.code, data.title);
      } else if (data.status === "failed") {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setIsPolling(false);
        onError(data.error || "Generation failed");
      }
    } catch (err) {
      console.error("[useAsyncGeneration] Poll error:", err);
      // Don't stop polling on transient errors
    }
  }, [onComplete, onError]);

  // Start generation
  const startGeneration = useCallback(async (videoBlob: Blob, styleDirective: string): Promise<string | null> => {
    try {
      // Reset state
      setJobStatus({ status: "pending", progress: 0, message: "Starting..." });
      
      // Create form data
      const formData = new FormData();
      formData.append("video", videoBlob, `video.${videoBlob.type.includes("webm") ? "webm" : "mp4"}`);
      formData.append("styleDirective", styleDirective);

      // Start generation
      const res = await fetch("/api/generate/start", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.status === 401) {
        onError("Please log in to continue");
        return null;
      }

      const data = await res.json();

      if (!data.success || !data.jobId) {
        onError(data.error || "Failed to start generation");
        return null;
      }

      const jobId = data.jobId;
      jobIdRef.current = jobId;

      console.log("[useAsyncGeneration] Job started:", jobId);

      // Update status
      setJobStatus({ status: "processing", progress: 10, message: "Uploading..." });

      // Start polling
      setIsPolling(true);
      pollingRef.current = setInterval(() => pollStatus(jobId), POLL_INTERVAL);

      // Also poll immediately
      await pollStatus(jobId);

      return jobId;
    } catch (err) {
      console.error("[useAsyncGeneration] Start error:", err);
      onError(err instanceof Error ? err.message : "Failed to start generation");
      return null;
    }
  }, [pollStatus, onError]);

  // Stop polling manually
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Reset job state
  const resetJob = useCallback(() => {
    stopPolling();
    setJobStatus(null);
    jobIdRef.current = null;
  }, [stopPolling]);

  return {
    startGeneration,
    jobStatus,
    isPolling,
    stopPolling,
    resetJob,
  };
}
