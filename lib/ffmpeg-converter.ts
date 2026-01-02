"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

// Load FFmpeg (only once)
async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();
  
  // Load FFmpeg core from CDN
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  
  isLoaded = true;
  console.log("FFmpeg loaded successfully");
  
  return ffmpeg;
}

// Convert video to MP4 H.264 (Gemini-compatible format)
export async function convertToMP4(
  inputBlob: Blob, 
  onProgress?: (progress: number) => void
): Promise<Blob> {
  console.log("Starting FFmpeg conversion, input size:", inputBlob.size);
  
  const ff = await loadFFmpeg();
  
  // Set up progress tracking
  if (onProgress) {
    ff.on("progress", ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }
  
  // Write input file
  const inputFileName = "input.mov";
  const outputFileName = "output.mp4";
  
  await ff.writeFile(inputFileName, await fetchFile(inputBlob));
  
  // Convert to MP4 with H.264 codec
  // -c:v libx264 - use H.264 video codec
  // -preset ultrafast - fastest encoding (less compression but quick)
  // -crf 28 - quality level (lower = better, 28 is good for mobile)
  // -vf scale=-2:720 - scale to 720p height, auto width (divisible by 2)
  // -c:a aac - use AAC audio codec
  // -movflags +faststart - optimize for streaming
  await ff.exec([
    "-i", inputFileName,
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "28",
    "-vf", "scale=-2:720",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y",
    outputFileName
  ]);
  
  // Read output file
  const data = await ff.readFile(outputFileName);
  
  // Clean up
  await ff.deleteFile(inputFileName);
  await ff.deleteFile(outputFileName);
  
  // Convert to Blob - use any to bypass TypeScript strict checks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outputBlob = new Blob([data as any], { type: "video/mp4" });
  console.log("FFmpeg conversion complete, output size:", outputBlob.size);
  
  return outputBlob;
}

// Check if FFmpeg is supported (WebAssembly required)
export function isFFmpegSupported(): boolean {
  return typeof WebAssembly !== "undefined";
}

