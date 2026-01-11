"use client";

import { useState, useCallback, useRef } from "react";

export type ProcessingState = 
  | "idle" 
  | "analyzing" 
  | "compressing" 
  | "uploading" 
  | "done" 
  | "error";

export interface ProcessingResult {
  blob: Blob;
  originalSize: number;
  finalSize: number;
  wasCompressed: boolean;
  duration?: number;
}

interface VideoProcessorHook {
  state: ProcessingState;
  progress: number;
  error: string | null;
  result: ProcessingResult | null;
  processVideo: (file: File | Blob, filename?: string) => Promise<ProcessingResult | null>;
  reset: () => void;
}

// Constants for the "WhatsApp Preset"
const MAX_DIRECT_UPLOAD_SIZE = 15 * 1024 * 1024; // 15MB
const TARGET_HEIGHT = 720;
const TARGET_BITRATE = 2000000; // 2 Mbps
const TARGET_FPS = 30;

/**
 * Check if video can use Fast Path (direct upload)
 * Conditions: MP4 or WebM, under 15MB
 */
async function canUseFastPath(file: File | Blob): Promise<boolean> {
  // Size check
  if (file.size > MAX_DIRECT_UPLOAD_SIZE) {
    return false;
  }
  
  // Type check - MP4 and WebM can skip compression
  const type = file instanceof File ? file.type : file.type;
  if (type.includes("mp4") || type.includes("webm")) {
    return true;
  }
  
  return false;
}

/**
 * Compress video using Canvas + MediaRecorder
 * Works on all browsers including Safari - no SharedArrayBuffer needed
 */
async function compressWithCanvas(
  file: File | Blob,
  onProgress: (progress: number) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      
      const url = URL.createObjectURL(file);
      video.src = url;
      
      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error("Failed to load video"));
        setTimeout(() => rej(new Error("Video load timeout")), 15000);
      });
      
      // Calculate target dimensions (max 720p height)
      const aspectRatio = video.videoWidth / video.videoHeight;
      let targetHeight = Math.min(video.videoHeight, TARGET_HEIGHT);
      let targetWidth = Math.round(targetHeight * aspectRatio);
      
      // Ensure even dimensions
      targetWidth = Math.floor(targetWidth / 2) * 2;
      targetHeight = Math.floor(targetHeight / 2) * 2;
      
      console.log(`Resizing: ${video.videoWidth}x${video.videoHeight} → ${targetWidth}x${targetHeight}`);
      
      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d")!;
      
      // Setup MediaRecorder
      const stream = canvas.captureStream(TARGET_FPS);
      
      const mimeTypes = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      
      let selectedMime = "video/webm";
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: TARGET_BITRATE,
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      // Start recording
      recorder.start(100);
      
      // Play video and draw frames
      video.currentTime = 0;
      await video.play();
      
      const duration = video.duration;
      let lastProgress = 0;
      
      const drawFrame = () => {
        if (video.ended || video.paused) return;
        
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // Update progress
        const currentProgress = Math.round((video.currentTime / duration) * 100);
        if (currentProgress > lastProgress) {
          lastProgress = currentProgress;
          onProgress(currentProgress);
        }
        
        requestAnimationFrame(drawFrame);
      };
      
      drawFrame();
      
      // Wait for video to end
      await new Promise<void>((res) => {
        video.onended = () => res();
      });
      
      // Stop recorder
      recorder.stop();
      
      await new Promise<void>((res) => {
        recorder.onstop = () => res();
      });
      
      // Cleanup
      URL.revokeObjectURL(url);
      video.remove();
      
      const compressed = new Blob(chunks, { type: selectedMime });
      console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
      
      resolve(compressed);
      
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Try to compress with FFmpeg (single-threaded version for Safari compatibility)
 * Uses unpkg CDN to avoid bundler issues
 */
async function compressWithFFmpeg(
  file: File | Blob,
  onProgress: (progress: number) => void
): Promise<Blob> {
  try {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
    
    const ffmpeg = new FFmpeg();
    
    // Use single-threaded version (no SharedArrayBuffer required)
    // This bypasses COOP/COEP header requirements
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
      });
    } catch (mtError) {
      // Fallback to single-thread version
      console.log("Multi-threaded FFmpeg failed, trying single-thread...");
      const stBaseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${stBaseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${stBaseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
    }
    
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
    
    // Write input
    const inputName = "input.mov";
    const outputName = "output.mp4";
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // Compress with WhatsApp preset
    await ffmpeg.exec([
      "-i", inputName,
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "28",
      "-vf", `scale=-2:${TARGET_HEIGHT}`,
      "-r", String(TARGET_FPS),
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-y",
      outputName
    ]);
    
    // Read output
    const data = await ffmpeg.readFile(outputName);
    
    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    // FileData is Uint8Array or string - handle both
    if (typeof data === "string") {
      // If string, convert to blob via text encoder
      const encoder = new TextEncoder();
      return new Blob([encoder.encode(data)], { type: "video/mp4" });
    }
    // data is Uint8Array - create new ArrayBuffer copy for Blob compatibility
    const arrayBuffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(arrayBuffer).set(data);
    return new Blob([arrayBuffer], { type: "video/mp4" });
    
  } catch (err) {
    console.error("FFmpeg failed:", err);
    throw err;
  }
}

/**
 * Main hook for processing mobile videos
 */
export function useMobileVideoProcessor(): VideoProcessorHook {
  const [state, setState] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const abortRef = useRef(false);
  
  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setError(null);
    setResult(null);
    abortRef.current = false;
  }, []);
  
  const processVideo = useCallback(async (
    file: File | Blob,
    filename?: string
  ): Promise<ProcessingResult | null> => {
    reset();
    abortRef.current = false;
    
    const originalSize = file.size;
    console.log(`Processing video: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
    
    try {
      // Step 1: Analyze
      setState("analyzing");
      setProgress(5);
      
      const fastPath = await canUseFastPath(file);
      
      if (fastPath) {
        // FAST PATH - Direct upload
        console.log("Fast path: Direct upload");
        setState("uploading");
        setProgress(50);
        
        const processingResult: ProcessingResult = {
          blob: file instanceof File ? file : file,
          originalSize,
          finalSize: file.size,
          wasCompressed: false,
        };
        
        setProgress(100);
        setState("done");
        setResult(processingResult);
        return processingResult;
      }
      
      // HEAVY PATH - Compression required
      console.log("Heavy path: Compression required");
      setState("compressing");
      setProgress(10);
      
      let compressedBlob: Blob;
      
      // Try Canvas compression first (most reliable)
      // FFmpeg often fails on mobile due to SharedArrayBuffer requirements
      try {
        compressedBlob = await compressWithCanvas(file, (p) => {
          if (!abortRef.current) {
            setProgress(10 + Math.round(p * 0.7)); // 10-80%
          }
        });
      } catch (canvasError) {
        console.log("Canvas compression failed, trying FFmpeg...");
        // Fallback to FFmpeg
        try {
          compressedBlob = await compressWithFFmpeg(file, (p) => {
            if (!abortRef.current) {
              setProgress(10 + Math.round(p * 0.7));
            }
          });
        } catch (ffmpegError) {
          // Last resort: use original file
          console.log("All compression methods failed, using original");
          compressedBlob = file;
        }
      }
      
      if (abortRef.current) {
        return null;
      }
      
      setProgress(85);
      setState("uploading");
      
      const processingResult: ProcessingResult = {
        blob: compressedBlob,
        originalSize,
        finalSize: compressedBlob.size,
        wasCompressed: compressedBlob !== file,
      };
      
      setProgress(100);
      setState("done");
      setResult(processingResult);
      
      console.log(`Processing complete: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);
      
      return processingResult;
      
    } catch (err) {
      console.error("Video processing error:", err);
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to process video");
      return null;
    }
  }, [reset]);
  
  return {
    state,
    progress,
    error,
    result,
    processVideo,
    reset,
  };
}
