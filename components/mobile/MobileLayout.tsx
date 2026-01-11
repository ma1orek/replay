"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MobileHeader from "./MobileHeader";
import MobileConfigureView from "./MobileConfigureView";
import MobilePreviewView from "./MobilePreviewView";
import FloatingIsland from "./FloatingIsland";
import { useAsyncGeneration } from "./useAsyncGeneration";
import { useMobileVideoProcessor } from "./useMobileVideoProcessor";

interface MobileLayoutProps {
  user: any;
  isPro: boolean;
  plan: string;
  credits?: number;
  creditsLoading?: boolean;
  onLogin: () => void;
  onOpenCreditsModal?: () => void;
  onCreditsRefresh?: () => void;
  onSaveGeneration?: (data: { title: string; code: string; videoUrl?: string }) => void;
}

// Keys for localStorage
const STORAGE_KEY_VIDEO = "replay_mobile_pending_video";
const STORAGE_KEY_NAME = "replay_mobile_pending_name";

export default function MobileLayout({ user, isPro, plan, credits, creditsLoading, onLogin, onOpenCreditsModal, onCreditsRefresh, onSaveGeneration }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<"configure" | "preview">("configure");
  const [projectName, setProjectName] = useState("New Project");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [style, setStyle] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Wake Lock implementation to prevent screen from turning off during processing
  // This is critical for keeping the compression/upload process alive
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock is active');
        }
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    if (isProcessing) {
      requestWakeLock();
    } else {
      if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
    }

    return () => {
      if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
    };
  }, [isProcessing]);

  // Video Processor (FFmpeg + Direct Upload)
  const { processAndUpload, status: uploadStatus, reset: resetUpload } = useMobileVideoProcessor();

  // Handle generation completion
  const handleGenerationComplete = useCallback((code: string, title?: string, videoUrl?: string) => {
    console.log("[MobileLayout] Generation complete!", { codeLength: code.length, title, videoUrl, codePreview: code.substring(0, 200) });
    
    // Store the code
    setGeneratedCode(code);
    
    // Log code preview for debugging
    console.log("[MobileLayout] Code received, length:", code.length);
    console.log("[MobileLayout] Code starts with:", code.substring(0, 200));
    
    // Update state synchronously to ensure proper rendering
    // No need for blob URL - we use srcdoc now
    setPreviewUrl(null); // Clear old blob URL if any
    setHasGenerated(true);
    setIsProcessing(false);
    
    // Switch to preview tab after state updates
    setActiveTab("preview");
    
    // Update project name from AI
    const finalTitle = (title && title !== "Untitled Project") ? title : projectName;
    if (title && title !== "Untitled Project") {
      setProjectName(title);
    }
    
    // Save generation to history
    if (onSaveGeneration) {
      console.log("[MobileLayout] Saving generation to history...");
      onSaveGeneration({
        title: finalTitle,
        code,
        videoUrl: videoUrl || undefined,
      });
    }
    
    // Refresh credits
    if (onCreditsRefresh) onCreditsRefresh();
  }, [onCreditsRefresh, onSaveGeneration, projectName]);

  // Handle generation error
  const handleGenerationError = useCallback((error: string) => {
    console.error("[MobileLayout] Generation error:", error);
    setGenerationError(error);
    setIsProcessing(false);
    setActiveTab("configure");
    alert(`Generation failed: ${error}`);
  }, []);

  // Async generation hook - uses server-side processing with polling
  const { startGeneration, jobStatus, isPolling, resetJob } = useAsyncGeneration(
    handleGenerationComplete,
    handleGenerationError
  );
  
  // Restore video from localStorage after login
  useEffect(() => {
    if (user && !videoBlob) {
      try {
        const savedVideoData = localStorage.getItem(STORAGE_KEY_VIDEO);
        const savedName = localStorage.getItem(STORAGE_KEY_NAME);
        
        if (savedVideoData) {
          // Convert base64 back to Blob
          const byteString = atob(savedVideoData.split(",")[1] || savedVideoData);
          const mimeType = savedVideoData.match(/data:([^;]+);/)?.[1] || "video/webm";
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeType });
          setVideoBlob(blob);
          if (savedName) setProjectName(savedName);
          
          // Clear storage
          localStorage.removeItem(STORAGE_KEY_VIDEO);
          localStorage.removeItem(STORAGE_KEY_NAME);
          
          console.log("Restored video from localStorage after login");
        }
      } catch (err) {
        console.error("Failed to restore video:", err);
      }
    }
  }, [user, videoBlob]);
  
  // Create video URL when blob changes
  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [videoBlob]);
  
  // Handle video capture
  const handleVideoCapture = useCallback((blob: Blob, name: string) => {
    setVideoBlob(blob);
    setProjectName(name || "New Project");
  }, []);
  
  // Handle video upload
  const handleVideoUpload = useCallback((file: File) => {
    setVideoBlob(file);
    const cleanName = file.name.replace(/\.[^.]+$/, "");
    setProjectName(cleanName || "New Project");
  }, []);
  
  // Remove video
  const handleRemoveVideo = useCallback(() => {
    setVideoBlob(null);
    setVideoUrl(null);
    setPreviewUrl(null);
    setProjectName("New Project");
    setHasGenerated(false);
    setActiveTab("configure");
  }, []);
  
  // Save video to localStorage before login redirect
  const saveVideoForLogin = useCallback(async () => {
    if (!videoBlob) return;
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        localStorage.setItem(STORAGE_KEY_VIDEO, base64);
        localStorage.setItem(STORAGE_KEY_NAME, projectName);
        console.log("Saved video to localStorage before login");
      };
      reader.readAsDataURL(videoBlob);
    } catch (err) {
      console.error("Failed to save video:", err);
    }
  }, [videoBlob, projectName]);
  
  // Reconstruct - the main action (uses async server-side processing)
  const handleReconstruct = useCallback(async () => {
    if (!videoBlob) return;
    
    // Check if user is logged in
    if (!user) {
      pendingLoginRef.current = true;
      await saveVideoForLogin();
      onLogin();
      return;
    }
    
    // Wait for credits to load
    if (creditsLoading) {
      console.log("[MOBILE] Waiting for credits to load...");
      return;
    }
    
    // Clear any previous error
    setGenerationError(null);
    setIsProcessing(true);
    setActiveTab("preview");
    
    console.log("[MobileLayout] Starting pipeline with blob:", videoBlob.size, videoBlob.type);
    
    try {
      // 1. COMPRESS & UPLOAD (The "WhatsApp" Pipeline)
      // This happens entirely on the client (FFmpeg) -> Supabase (Direct)
      // Bypasses Vercel's 4.5MB limit and 403 blocks
      let finalVideoUrl: string;
      
      // If we already have a URL (e.g. from previous upload), use it? 
      // For now, always re-upload to ensure freshness, unless it's a URL-based flow (not implemented)
      
      // Convert Blob to File if needed
      const videoFile = videoBlob instanceof File 
        ? videoBlob 
        : new File([videoBlob], "recording.mp4", { type: "video/mp4" });
        
      console.log("[MobileLayout] Step 1: Compressing & Uploading...");
      finalVideoUrl = await processAndUpload(videoFile);
      
      if (!finalVideoUrl) {
        throw new Error("Upload failed - no URL returned");
      }
      
      console.log("[MobileLayout] Step 1 Complete. URL:", finalVideoUrl);

      // Build style directive from user inputs
      let styleDirective = style || "Modern, clean design with Tailwind CSS";
      if (context.trim()) {
        styleDirective += `. Additional context: ${context.trim()}`;
      }

      // 2. GENERATE (AI)
      // Send ONLY the URL to the API
      console.log("[MobileLayout] Step 2: Starting AI Generation...");
      const result = await startGeneration(finalVideoUrl, styleDirective);
      
      if (!result) {
        // Error already handled by hook
        setIsProcessing(false);
        setActiveTab("configure");
      }
      
    } catch (error: any) {
      console.error("[MobileLayout] Pipeline Error:", error);
      setGenerationError(error.message || "Processing failed");
      setIsProcessing(false);
      setActiveTab("configure");
      alert(`Error: ${error.message || "Processing failed"}`);
    }
    
  }, [videoBlob, user, onLogin, saveVideoForLogin, creditsLoading, style, context, processAndUpload, startGeneration]);
  
  // Handle back - goes back in flow or to landing page
  const handleBack = useCallback(() => {
    if (activeTab === "preview" && !isProcessing) {
      setActiveTab("configure");
    } else if (activeTab === "configure") {
      // If there's a video, clear it first, then go home
      if (videoBlob) {
        handleRemoveVideo();
      }
      // Navigate to landing page
      window.location.href = "/";
    }
  }, [activeTab, isProcessing, videoBlob, handleRemoveVideo]);
  
  // Calculate progress combining both hooks
  let processingProgress = 0;
  let processingMessage = "Starting...";

  if (uploadStatus.stage === "compressing" || uploadStatus.stage === "uploading") {
    // Phase 1: Upload (0-30% of total perceived progress)
    processingProgress = Math.round(uploadStatus.progress * 0.3); 
    processingMessage = uploadStatus.message;
  } else if (jobStatus) {
    // Phase 2: Generation (30-100% of total perceived progress)
    // Map 0-100 from jobStatus to 30-100 total
    processingProgress = 30 + Math.round(jobStatus.progress * 0.7);
    processingMessage = jobStatus.message;
  } else if (isProcessing) {
    // Fallback
    processingMessage = "Initializing...";
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header - always visible in configure, hidden in preview when not processing */}
      {(activeTab === "configure" || isProcessing) && (
        <MobileHeader
          projectName={projectName}
          onProjectNameChange={setProjectName}
          isPro={isPro}
          plan={plan}
          credits={credits}
          onBack={handleBack}
          onOpenCreditsModal={onOpenCreditsModal}
        />
      )}
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "configure" ? (
          <MobileConfigureView
            videoBlob={videoBlob}
            videoUrl={videoUrl}
            onVideoCapture={handleVideoCapture}
            onVideoUpload={handleVideoUpload}
            onRemoveVideo={handleRemoveVideo}
            context={context}
            onContextChange={setContext}
            style={style}
            onStyleChange={setStyle}
            onReconstruct={handleReconstruct}
            isProcessing={isProcessing}
          />
        ) : (
          <MobilePreviewView
            previewUrl={previewUrl}
            previewCode={generatedCode}
            isProcessing={isProcessing || isPolling}
            processingProgress={processingProgress}
            processingMessage={processingMessage}
            projectName={projectName}
          />
        )}
      </div>
      
      {/* Floating Island - ONLY after generation is complete */}
      {hasGenerated && !isProcessing && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
          <FloatingIsland
            activeTab={activeTab}
            onChange={setActiveTab}
            disabled={isProcessing}
          />
        </div>
      )}
    </div>
  );
}
