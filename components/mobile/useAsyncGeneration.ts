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
  // SAME FLOW AS DESKTOP: spend credits first, then generate
  const startGeneration = useCallback(async (videoBlob: Blob, styleDirective: string): Promise<string | null> => {
    try {
      // Reset state
      setJobStatus({ status: "processing", progress: 5, message: "Checking credits..." });
      setIsPolling(true);

      // STEP 1: Spend credits FIRST (same as desktop)
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
      console.log("[useAsyncGeneration] Credit spend result:", spendData);

      if (!spendRes.ok || !spendData.success) {
        setIsPolling(false);
        setJobStatus({ status: "failed", progress: 0, message: "Insufficient credits", error: spendData.error });
        onError(spendData.error || "Insufficient credits");
        return null;
      }

      // STEP 2: Upload video DIRECTLY to Supabase (bypasses Vercel WAF!)
      // 1. Get presigned URL (small JSON request - won't be blocked)
      // 2. Upload to Supabase Storage directly (bypasses Vercel entirely)
      setJobStatus({ status: "processing", progress: 10, message: "Preparing upload..." });
      
      console.log("[useAsyncGeneration] Getting presigned URL...");
      
      const extension = videoBlob.type.includes("webm") ? "webm" : "mp4";
      const urlRes = await fetch("/api/upload-video/get-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `video.${extension}`,
          contentType: videoBlob.type,
        }),
      });

      if (!urlRes.ok) {
        const urlError = await urlRes.text();
        console.error("[useAsyncGeneration] Failed to get upload URL:", urlRes.status, urlError);
        setIsPolling(false);
        setJobStatus({ status: "failed", progress: 0, message: "Upload setup failed", error: urlError });
        onError("Failed to prepare upload");
        return null;
      }

      const urlData = await urlRes.json();
      console.log("[useAsyncGeneration] Got presigned URL, uploading directly to Supabase...");
      
      setJobStatus({ status: "processing", progress: 15, message: "Uploading video..." });
      
      // Upload directly to Supabase Storage (bypasses Vercel WAF!)
      const uploadRes = await fetch(urlData.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": videoBlob.type,
        },
        body: videoBlob,
      });

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.text();
        console.error("[useAsyncGeneration] Direct upload failed:", uploadRes.status, uploadError);
        setIsPolling(false);
        setJobStatus({ status: "failed", progress: 0, message: "Upload failed", error: uploadError });
        onError("Failed to upload video");
        return null;
      }

      console.log("[useAsyncGeneration] Video uploaded to Supabase:", urlData.publicUrl);
      const uploadedVideoUrl = urlData.publicUrl;

      // STEP 3: Start generation with video URL (JSON body, not FormData)
      setJobStatus({ status: "processing", progress: 30, message: "Starting generation..." });
      
      // Start progress simulation
      startProgressSimulation();

      console.log("[useAsyncGeneration] Calling /api/generate/start with videoUrl...");

      // Call API with JSON body (avoids 403 from Vercel WAF on FormData)
      const res = await fetch("/api/generate/start", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: uploadedVideoUrl,
          styleDirective,
        }),
      });

      // Stop progress simulation
      stopProgressSimulation();

      if (res.status === 401) {
        setIsPolling(false);
        setJobStatus({ status: "failed", progress: 0, message: "Please log in", error: "Unauthorized" });
        onError("Please log in to continue");
        return null;
      }

      // Handle non-JSON responses (e.g., Vercel WAF 403)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await res.text();
        console.error("[useAsyncGeneration] Non-JSON response:", res.status, textResponse);
        setIsPolling(false);
        setJobStatus({ 
          status: "failed", 
          progress: 0, 
          message: `Server error: ${res.status}`, 
          error: textResponse || "Server returned non-JSON response" 
        });
        onError(`Server error: ${res.status}`);
        return null;
      }

      const data = await res.json();
      console.log("[useAsyncGeneration] API response:", { success: data.success, hasCode: !!data.code, codeLength: data.code?.length });

      if (!res.ok) {
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
