/**
 * Video compression utilities for client-side processing
 * Reduces video size to stay under Vercel's 4.5MB limit
 */

export interface CompressedVideo {
  base64: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress video by re-encoding at lower quality/resolution
 * Uses MediaRecorder with lower bitrate
 */
export async function compressVideo(
  videoBlob: Blob,
  options: {
    maxSizeMB?: number;
    maxWidth?: number;
    quality?: number;
  } = {}
): Promise<CompressedVideo> {
  const { maxSizeMB = 3, maxWidth = 854, quality = 0.6 } = options;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const originalSize = videoBlob.size;

  console.log(`Original video size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

  // If already small enough, just return it
  if (originalSize <= maxSizeBytes) {
    console.log("Video already small enough, no compression needed");
    const arrayBuffer = await videoBlob.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    return {
      base64,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // Create video element to get frames
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  
  const videoUrl = URL.createObjectURL(videoBlob);
  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Failed to load video"));
  });

  // Calculate new dimensions
  const aspectRatio = video.videoWidth / video.videoHeight;
  let newWidth = Math.min(video.videoWidth, maxWidth);
  let newHeight = Math.round(newWidth / aspectRatio);

  // Ensure even dimensions (required for video encoding)
  newWidth = Math.floor(newWidth / 2) * 2;
  newHeight = Math.floor(newHeight / 2) * 2;

  console.log(`Resizing from ${video.videoWidth}x${video.videoHeight} to ${newWidth}x${newHeight}`);

  // Create canvas for frame extraction
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext("2d")!;

  // Try to use MediaRecorder with lower bitrate first
  const canvasStream = canvas.captureStream(30);
  
  // Check if we can use VideoEncoder (newer API) or fallback to MediaRecorder
  const mimeTypes = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  let selectedMimeType = "video/webm";
  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      selectedMimeType = mimeType;
      break;
    }
  }

  // Calculate target bitrate based on desired file size
  const videoDuration = video.duration;
  const targetBitsPerSecond = Math.floor((maxSizeBytes * 8) / videoDuration * 0.8); // 80% of max to be safe

  console.log(`Target bitrate: ${(targetBitsPerSecond / 1000).toFixed(0)} kbps for ${videoDuration.toFixed(1)}s video`);

  const recorder = new MediaRecorder(canvasStream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: Math.min(targetBitsPerSecond, 1000000), // Cap at 1Mbps
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Start recording
  recorder.start(100);

  // Play video and draw frames to canvas
  video.currentTime = 0;
  await video.play();

  await new Promise<void>((resolve) => {
    const drawFrame = () => {
      if (video.ended || video.paused) {
        resolve();
        return;
      }
      ctx.drawImage(video, 0, 0, newWidth, newHeight);
      requestAnimationFrame(drawFrame);
    };
    drawFrame();

    video.onended = () => resolve();
  });

  // Stop recording
  recorder.stop();
  
  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  // Cleanup
  URL.revokeObjectURL(videoUrl);
  video.remove();

  // Create compressed blob
  const compressedBlob = new Blob(chunks, { type: selectedMimeType });
  const compressedSize = compressedBlob.size;

  console.log(`Compressed video size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Compression ratio: ${(originalSize / compressedSize).toFixed(2)}x`);

  // If still too big, try extracting key frames as images instead
  if (compressedSize > maxSizeBytes) {
    console.log("Still too large, falling back to frame extraction");
    return await extractKeyFrames(videoBlob, maxSizeMB);
  }

  const arrayBuffer = await compressedBlob.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);

  return {
    base64,
    originalSize,
    compressedSize,
    compressionRatio: originalSize / compressedSize,
  };
}

/**
 * Extract key frames from video and encode as images
 * Fallback when video compression isn't enough
 */
async function extractKeyFrames(
  videoBlob: Blob,
  maxSizeMB: number
): Promise<CompressedVideo> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const originalSize = videoBlob.size;

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  
  const videoUrl = URL.createObjectURL(videoBlob);
  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Failed to load video"));
  });

  const duration = video.duration;
  const numFrames = Math.min(Math.ceil(duration * 2), 20); // 2 fps, max 20 frames
  const frameInterval = duration / numFrames;

  const canvas = document.createElement("canvas");
  const maxWidth = 640;
  const aspectRatio = video.videoWidth / video.videoHeight;
  canvas.width = Math.min(video.videoWidth, maxWidth);
  canvas.height = Math.round(canvas.width / aspectRatio);
  const ctx = canvas.getContext("2d")!;

  const frames: string[] = [];

  for (let i = 0; i < numFrames; i++) {
    video.currentTime = i * frameInterval;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameData = canvas.toDataURL("image/jpeg", 0.7);
    frames.push(frameData);
  }

  // Cleanup
  URL.revokeObjectURL(videoUrl);
  video.remove();

  // Combine frames into a simple format (base64 JSON)
  const framesData = JSON.stringify({ frames, duration, width: canvas.width, height: canvas.height });
  const compressedSize = framesData.length;

  console.log(`Extracted ${frames.length} frames, total size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);

  // Encode as base64
  const base64 = btoa(unescape(encodeURIComponent(framesData)));

  return {
    base64,
    originalSize,
    compressedSize,
    compressionRatio: originalSize / compressedSize,
  };
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.slice(i, i + 8192)));
  }
  return btoa(binary);
}

/**
 * Quick check if video needs compression
 */
export function needsCompression(blob: Blob, maxSizeMB: number = 3): boolean {
  return blob.size > maxSizeMB * 1024 * 1024;
}

/**
 * Get human readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

