import { useRef, useState, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { createBrowserClient } from "@supabase/ssr";

export type ProcessingStage = "idle" | "compressing" | "uploading" | "complete" | "error";

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
  
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  // Load FFmpeg from CDN (bypasses local bundle issues)
  const loadFFmpeg = useCallback(async () => {
    const ffmpeg = ffmpegRef.current;
    
    // Using single-threaded core for better compatibility on mobile/Vercel without COOP/COEP headers
    // Or standard core if headers are set correctly. Using standard 0.12.6 from unpkg for now.
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    // Only load if not loaded
    if (!ffmpeg.loaded) {
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        console.log("FFmpeg loaded successfully");
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
        throw new Error("Failed to initialize video processor");
      }
    }
    
    return ffmpeg;
  }, []);

  const processAndUpload = useCallback(async (file: File) => {
    try {
      // 1. COMPRESSION PHASE
      setStatus({ stage: "compressing", progress: 0, message: "Initializing compressor..." });
      
      const ffmpeg = await loadFFmpeg();
      
      setStatus({ stage: "compressing", progress: 5, message: "Compressing video (720p)..." });
      
      // Write file to FFmpeg memory
      const inputName = "input" + (file.name.split('.').pop() ? `.${file.name.split('.').pop()}` : ".mp4");
      const outputName = "output.mp4";
      
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Progress listener
      ffmpeg.on("progress", ({ progress, time }) => {
        // progress is 0-1
        setStatus(prev => ({
          ...prev,
          progress: Math.round(progress * 100),
          message: `Compressing... ${Math.round(progress * 100)}%`
        }));
      });
      
      // Run FFmpeg command: 720p, H.264, ~2Mbps
      // -vf scale=-2:720 ensures height is 720p and width keeps aspect ratio (divisible by 2)
      // -c:v libx264 -crf 26 -preset superfast for speed
      await ffmpeg.exec([
        "-i", inputName,
        "-vf", "scale=-2:720",
        "-c:v", "libx264",
        "-crf", "26",
        "-preset", "superfast",
        "-c:a", "aac",
        "-b:a", "128k",
        outputName
      ]);
      
      // Read output
      const data = await ffmpeg.readFile(outputName);
      const compressedBlob = new Blob([(data as Uint8Array).buffer], { type: "video/mp4" });
      
      console.log(`Compressed: ${file.size} -> ${compressedBlob.size} bytes`);
      
      // 2. UPLOAD PHASE (Direct to Supabase via Signed URL)
      setStatus({ stage: "uploading", progress: 0, message: "Preparing upload..." });
      
      // Get Presigned URL
      const urlRes = await fetch("/api/upload-video/get-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "compressed_video.mp4",
          contentType: "video/mp4",
        }),
      });
      
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, publicUrl } = await urlRes.json();
      
      // Upload to Storage
      setStatus({ stage: "uploading", progress: 20, message: "Uploading optimized video..." });
      
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: compressedBlob,
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
      console.error("Processing error:", error);
      setStatus({ 
        stage: "error", 
        progress: 0, 
        message: "Failed to process video", 
        error: error.message || "Unknown error" 
      });
      throw error;
    }
  }, [loadFFmpeg]);
  
  const reset = useCallback(() => {
    setStatus({ stage: "idle", progress: 0, message: "Ready" });
  }, []);

  return {
    processAndUpload,
    status,
    reset
  };
}

// Helper to convert File to Uint8Array for FFmpeg
async function fetchFile(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
