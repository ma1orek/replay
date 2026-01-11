import { useRef, useState, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

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

  // Load FFmpeg safely
  const loadFFmpeg = useCallback(async (): Promise<FFmpeg | null> => {
    const ffmpeg = ffmpegRef.current;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    if (ffmpeg.loaded) return ffmpeg;

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      console.log("FFmpeg loaded successfully");
      return ffmpeg;
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      return null;
    }
  }, []);

  const processAndUpload = useCallback(async (file: File) => {
    let blobToUpload: Blob | File = file;
    let contentType = file.type;
    let filename = file.name;

    // 1. COMPRESSION PHASE (Optional / Best Effort)
    try {
      setStatus({ stage: "compressing", progress: 0, message: "Initializing..." });
      
      const ffmpeg = await loadFFmpeg();
      
      if (ffmpeg) {
        setStatus({ stage: "compressing", progress: 5, message: "Optimizing video..." });
        
        // Write file
        const inputName = "input" + (file.name.split('.').pop() ? `.${file.name.split('.').pop()}` : ".mp4");
        const outputName = "output.mp4";
        
        await ffmpeg.writeFile(inputName, await fetchFile(file));
        
        ffmpeg.on("progress", ({ progress }) => {
          setStatus(prev => ({
            ...prev,
            progress: Math.round(progress * 100),
            message: `Optimizing... ${Math.round(progress * 100)}%`
          }));
        });
        
        // Compression command
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
        const u8 = data instanceof Uint8Array ? data : new Uint8Array(data as any);
        blobToUpload = new Blob([u8], { type: "video/mp4" });
        contentType = "video/mp4";
        filename = "compressed_video.mp4";
        
        console.log(`Compressed: ${file.size} -> ${blobToUpload.size} bytes`);
      } else {
        console.warn("FFmpeg not loaded, skipping compression");
        setStatus({ stage: "compressing", progress: 100, message: "Skipping optimization..." });
      }
      
    } catch (error) {
      console.warn("Compression failed, using original:", error);
      // Fallback to original file
      setStatus({ stage: "compressing", progress: 100, message: "Using original video..." });
    }

    // 2. UPLOAD PHASE (Critical)
    try {
      setStatus({ stage: "uploading", progress: 0, message: "Preparing upload..." });
      
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
      
      setStatus({ stage: "uploading", progress: 20, message: "Uploading video..." });
      
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blobToUpload,
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

async function fetchFile(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
