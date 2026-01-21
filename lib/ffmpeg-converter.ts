"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;
let loadPromise: Promise<FFmpeg> | null = null;

// Load FFmpeg (only once, with proper singleton pattern)
async function loadFFmpeg(): Promise<FFmpeg> {
  // Return existing instance if already loaded
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }
  
  // If loading in progress, wait for it
  if (loadPromise) {
    return loadPromise;
  }
  
  // Start loading
  loadPromise = (async () => {
    try {
      ffmpeg = new FFmpeg();
      
      // Use direct CDN URLs instead of blob URLs for better mobile compatibility
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      
      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });
      
      isLoaded = true;
      console.log("[FFmpeg] Loaded successfully");
      
      return ffmpeg;
    } catch (error) {
      // Reset state on failure
      ffmpeg = null;
      isLoaded = false;
      loadPromise = null;
      throw error;
    }
  })();
  
  return loadPromise;
}

// Convert video to MP4 H.264 (Gemini-compatible format)
export async function convertToMP4(
  inputBlob: Blob, 
  onProgress?: (progress: number) => void
): Promise<Blob> {
  console.log("[FFmpeg] Starting conversion, input size:", inputBlob.size, "bytes");
  
  const ff = await loadFFmpeg();
  
  // Set up progress tracking
  if (onProgress) {
    ff.on("progress", ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }
  
  // Use unique filenames to avoid conflicts
  const timestamp = Date.now();
  const inputFileName = `input_${timestamp}.webm`;
  const outputFileName = `output_${timestamp}.mp4`;
  
  try {
    // Write input file
    await ff.writeFile(inputFileName, await fetchFile(inputBlob));
    
    // Convert to MP4 with H.264 codec
    // Using simpler settings for mobile compatibility:
    // -c:v libx264 - use H.264 video codec
    // -preset veryfast - good balance of speed/quality
    // -crf 28 - slightly lower quality for smaller file
    // -vf scale=-2:720 - scale to 720p for faster processing
    // -c:a aac - use AAC audio codec
    // -movflags +faststart - optimize for streaming
    await ff.exec([
      "-i", inputFileName,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "28",
      "-vf", "scale=-2:720",
      "-c:a", "aac",
      "-b:a", "96k",
      "-movflags", "+faststart",
      "-y",
      outputFileName
    ]);
    
    // Read output file
    const data = await ff.readFile(outputFileName);
    
    // Clean up
    try {
      await ff.deleteFile(inputFileName);
      await ff.deleteFile(outputFileName);
    } catch {
      // Ignore cleanup errors
    }
    
    // Convert to Blob
    const outputBlob = new Blob([data], { type: "video/mp4" });
    console.log("[FFmpeg] Conversion complete, output size:", outputBlob.size, "bytes");
    
    return outputBlob;
  } catch (error) {
    // Clean up on error
    try {
      await ff.deleteFile(inputFileName);
      await ff.deleteFile(outputFileName);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

// Check if FFmpeg is supported
export function isFFmpegSupported(): boolean {
  // Check for WebAssembly support
  if (typeof WebAssembly === "undefined") {
    console.log("[FFmpeg] WebAssembly not supported");
    return false;
  }
  
  // Check for SharedArrayBuffer (required for FFmpeg threading)
  // Note: This requires COOP/COEP headers to be set
  if (typeof SharedArrayBuffer === "undefined") {
    console.log("[FFmpeg] SharedArrayBuffer not available - FFmpeg may run slower");
    // Still return true - FFmpeg can work without it, just slower
  }
  
  return true;
}
