"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface GenerationJobState {
  jobId: string | null;
  status: "idle" | "pending" | "processing" | "complete" | "failed";
  progress: number;
  message: string;
  code?: string;
  title?: string;
  error?: string;
}

const STORAGE_KEY = "replay_pending_job";
const POLL_INTERVAL = 3000; // 3 seconds

export function useGenerationJob() {
  const [jobState, setJobState] = useState<GenerationJobState>({
    jobId: null,
    status: "idle",
    progress: 0,
    message: "",
  });
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Save pending job to localStorage
  const savePendingJob = useCallback((jobId: string, videoUrl: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        jobId,
        videoUrl,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.error("[Job] Failed to save pending job:", e);
    }
  }, []);

  // Clear pending job from localStorage
  const clearPendingJob = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("[Job] Failed to clear pending job:", e);
    }
  }, []);

  // Get pending job from localStorage
  const getPendingJob = useCallback(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      
      const job = JSON.parse(data);
      // Ignore jobs older than 10 minutes
      if (Date.now() - job.timestamp > 10 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return job;
    } catch (e) {
      console.error("[Job] Failed to get pending job:", e);
      return null;
    }
  }, []);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string): Promise<GenerationJobState | null> => {
    try {
      const res = await fetch(`/api/generate/status/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) {
          // Job not found - might have expired
          return null;
        }
        throw new Error(`Status check failed: ${res.status}`);
      }
      
      const data = await res.json();
      return {
        jobId,
        status: data.status,
        progress: data.progress || 0,
        message: data.message || "",
        code: data.code,
        title: data.title,
        error: data.error,
      };
    } catch (e) {
      console.error("[Job] Poll error:", e);
      return null;
    }
  }, []);

  // Start polling for a job
  const startPolling = useCallback((jobId: string) => {
    if (isPollingRef.current) return;
    
    console.log("[Job] Starting polling for job:", jobId);
    isPollingRef.current = true;
    
    const poll = async () => {
      const result = await pollJobStatus(jobId);
      
      if (!result) {
        // Job not found or error
        setJobState(prev => ({
          ...prev,
          status: "failed",
          error: "Job not found or expired",
        }));
        stopPolling();
        clearPendingJob();
        return;
      }
      
      setJobState(result);
      
      if (result.status === "complete" || result.status === "failed") {
        console.log("[Job] Job finished:", result.status);
        stopPolling();
        clearPendingJob();
      }
    };
    
    // Poll immediately
    poll();
    
    // Then poll at intervals
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
  }, [pollJobStatus, clearPendingJob]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // Start a new generation job
  const startJob = useCallback(async (
    videoUrl: string,
    styleDirective: string
  ): Promise<{ jobId: string } | { error: string }> => {
    try {
      console.log("[Job] Starting async generation job...");
      
      setJobState({
        jobId: null,
        status: "pending",
        progress: 0,
        message: "Starting generation...",
      });
      
      const res = await fetch("/api/generate/async", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, styleDirective }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setJobState({
          jobId: null,
          status: "failed",
          progress: 0,
          message: "",
          error: data.error || "Failed to start job",
        });
        return { error: data.error || "Failed to start job" };
      }
      
      // Job started (might already be complete if fast)
      const jobId = data.jobId;
      
      if (data.status === "complete" && data.code) {
        // Job already completed
        setJobState({
          jobId,
          status: "complete",
          progress: 100,
          message: "Generation complete!",
          code: data.code,
          title: data.title,
        });
        return { jobId };
      }
      
      // Job is processing - save to localStorage and start polling
      savePendingJob(jobId, videoUrl);
      
      setJobState({
        jobId,
        status: "processing",
        progress: 10,
        message: "Processing video...",
      });
      
      startPolling(jobId);
      
      return { jobId };
    } catch (e) {
      console.error("[Job] Start error:", e);
      const error = e instanceof Error ? e.message : "Unknown error";
      setJobState({
        jobId: null,
        status: "failed",
        progress: 0,
        message: "",
        error,
      });
      return { error };
    }
  }, [savePendingJob, startPolling]);

  // Check for and recover pending job
  const recoverPendingJob = useCallback(async (): Promise<GenerationJobState | null> => {
    const pending = getPendingJob();
    if (!pending) return null;
    
    console.log("[Job] Found pending job:", pending.jobId);
    
    // Check job status
    const result = await pollJobStatus(pending.jobId);
    
    if (!result) {
      clearPendingJob();
      return null;
    }
    
    setJobState(result);
    
    if (result.status === "processing" || result.status === "pending") {
      // Still running - resume polling
      startPolling(pending.jobId);
    } else {
      // Complete or failed - clear pending
      clearPendingJob();
    }
    
    return result;
  }, [getPendingJob, pollJobStatus, clearPendingJob, startPolling]);

  // Reset job state
  const resetJob = useCallback(() => {
    stopPolling();
    clearPendingJob();
    setJobState({
      jobId: null,
      status: "idle",
      progress: 0,
      message: "",
    });
  }, [stopPolling, clearPendingJob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    jobState,
    startJob,
    recoverPendingJob,
    resetJob,
    isJobActive: jobState.status === "pending" || jobState.status === "processing",
  };
}
