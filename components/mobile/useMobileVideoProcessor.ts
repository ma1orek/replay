import { useState, useCallback } from "react";

export type ProcessingStage = "idle" | "uploading" | "complete" | "error";

interface ProcessingStatus {
  stage: ProcessingStage;
  progress: number;
  message: string;
  videoUrl?: string;
  error?: string;
}

export function useMobileVideoProcessor() {
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "idle",
    progress: 0,
    message: "Ready",
  });

  const processAndUpload = useCallback(async (file: File) => {
    // 1. DIRECT UPLOAD PHASE (Raw file to Supabase)
    try {
      setStatus({ stage: "uploading", progress: 0, message: "Preparing upload..." });
      
      const filename = `raw_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const contentType = file.type || "video/mp4";

      // Get Presigned URL
      const urlRes = await fetch("/api/upload-video/get-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: filename,
          contentType: contentType,
        }),
      });
      
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, publicUrl } = await urlRes.json();
      
      // Upload to Storage
      setStatus({ stage: "uploading", progress: 10, message: "Uploading raw video..." });
      
      // Use XMLHttpRequest for tracking progress if needed, or simple fetch
      // Simple fetch for reliability
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      
      if (!uploadRes.ok) throw new Error("Upload failed");
      
      setStatus({ 
        stage: "complete", 
        progress: 100, 
        message: "Upload complete!", 
        videoUrl: publicUrl 
      });
      
      return publicUrl;
      
    } catch (error: any) {
      console.error("Upload error:", error);
      setStatus({ 
        stage: "error", 
        progress: 0, 
        message: "Upload failed", 
        error: error.message || "Unknown error" 
      });
      throw error;
    }
  }, []);
  
  const reset = useCallback(() => {
    setStatus({ stage: "idle", progress: 0, message: "Ready" });
  }, []);

  return {
    processAndUpload,
    status,
    reset
  };
}
