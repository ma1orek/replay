"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  onOpenHistory?: () => void;
}

// Keys for localStorage
const STORAGE_KEY_VIDEO = "replay_mobile_pending_video";
const STORAGE_KEY_NAME = "replay_mobile_pending_name";
const STORAGE_KEY_LOAD_PROJECT = "replay_mobile_load_project";

export default function MobileLayout({ user, isPro, plan, credits, creditsLoading, onLogin, onOpenCreditsModal, onCreditsRefresh, onSaveGeneration, onOpenHistory }: MobileLayoutProps) {
  const searchParams = useSearchParams();
  const autoStartCamera = searchParams?.get("camera") === "true";
  
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
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  
  const pendingLoginRef = useRef(false);
  
  // Check for project to load from history
  useEffect(() => {
    const loadProjectData = localStorage.getItem(STORAGE_KEY_LOAD_PROJECT);
    console.log("[MobileLayout] Checking for project to load, found:", !!loadProjectData);
    if (loadProjectData) {
      try {
        const project = JSON.parse(loadProjectData);
        console.log("[MobileLayout] Loading project from history:", project.title, "videoUrl:", project.videoUrl);
        
        // Set project data
        setProjectName(project.title || "Loaded Project");
        setLoadedProjectId(project.id);
        
        // Always set videoUrl if it exists (even if no code)
        if (project.videoUrl) {
          console.log("[MobileLayout] Setting videoUrl:", project.videoUrl);
          setVideoUrl(project.videoUrl);
        }
        
        if (project.code) {
          setGeneratedCode(project.code);
          const blob = new Blob([project.code], { type: "text/html" });
          setPreviewUrl(URL.createObjectURL(blob));
          setHasGenerated(true);
          setActiveTab("preview");
        }
        
        if (project.publishedSlug) {
          setPublishedUrl(`https://www.replay.build/p/${project.publishedSlug}`);
        }
        
        // Clear the storage
        localStorage.removeItem(STORAGE_KEY_LOAD_PROJECT);
      } catch (e) {
        console.error("[MobileLayout] Failed to load project:", e);
        localStorage.removeItem(STORAGE_KEY_LOAD_PROJECT);
      }
    }
  }, []);

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
    console.log("[MobileLayout] Generation complete!", { codeLength: code.length, title, videoUrl });
    
    // Store the code
    setGeneratedCode(code);
    
    // Create blob URL for iframe (same approach as desktop - this works better on mobile Safari)
    const blob = new Blob([code], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    console.log("[MobileLayout] Created blob URL:", blobUrl);
    setPreviewUrl(blobUrl);
    
    setHasGenerated(true);
    setIsProcessing(false);
    
    // Switch to preview tab after state updates
    setActiveTab("preview");
    
    // Update project name from AI
    const finalTitle = (title && title !== "Untitled Project") ? title : projectName;
    if (title && title !== "Untitled Project") {
      setProjectName(title);
    }
    
    // NOTE: Don't call onSaveGeneration here!
    // The /api/generate/async endpoint already saves the generation to DB.
    // Calling onSaveGeneration would create a duplicate "Untitled Project".
    
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
  const { startGeneration, jobStatus, isPolling, resetJob, checkForPendingJob } = useAsyncGeneration(
    handleGenerationComplete,
    handleGenerationError
  );

  // Listen for page visibility changes to recover pending jobs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[MobileLayout] Page became visible, checking for pending jobs...");
        checkForPendingJob();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkForPendingJob]);
  
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
  // Create blob URL for video recording
  // NOTE: Don't reset videoUrl to null when videoBlob is null - it might be loaded from a project
  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    // Don't set videoUrl to null here - it could be from a loaded project (Cloudinary URL)
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
    // Need either a videoBlob (new recording) or videoUrl (loaded project)
    if (!videoBlob && !videoUrl) return;
    
    // Check if user is logged in
    if (!user) {
      if (videoBlob) {
        pendingLoginRef.current = true;
        await saveVideoForLogin();
      }
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
    
    try {
      let finalVideoUrl: string;
      
      if (videoBlob) {
        // NEW RECORDING: Compress & Upload
        console.log("[MobileLayout] Starting pipeline with blob:", videoBlob.size, videoBlob.type);
        
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
      } else if (videoUrl) {
        // LOADED PROJECT: Use existing URL
        console.log("[MobileLayout] Using existing video URL:", videoUrl);
        finalVideoUrl = videoUrl;
      } else {
        throw new Error("No video available");
      }

      // Build style directive from user inputs
      // Empty style = Auto-Detect (AI analyzes video and matches its visual style)
      let styleDirective = style || "";
      if (context.trim()) {
        styleDirective = styleDirective 
          ? `${styleDirective}. Additional context: ${context.trim()}`
          : `Additional context: ${context.trim()}`;
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
    
  }, [videoBlob, videoUrl, user, onLogin, saveVideoForLogin, creditsLoading, style, context, processAndUpload, startGeneration]);
  
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
  
  // Handle publish - calls the same API as desktop
  const handlePublish = useCallback(async (): Promise<string | null> => {
    if (!generatedCode) return null;
    
    setIsPublishing(true);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: generatedCode,
          title: projectName || "Untitled Project",
          thumbnailDataUrl: null,
          existingSlug: null, // Always create new for mobile
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        setPublishedUrl(data.url);
        return data.url;
      } else {
        console.error("[MobileLayout] Publish failed:", data.error);
        alert("Failed to publish: " + (data.error || "Unknown error"));
        return null;
      }
    } catch (error: any) {
      console.error("[MobileLayout] Publish error:", error);
      alert("Failed to publish: " + error.message);
      return null;
    } finally {
      setIsPublishing(false);
    }
  }, [generatedCode, projectName]);

  // Calculate progress combining both hooks
  let processingProgress = 0;
  let processingMessage = "Starting...";

  if (uploadStatus.stage === "uploading") {
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
          user={user}
          isPro={isPro}
          plan={plan}
          credits={credits}
          onBack={handleBack}
          onLogin={onLogin}
          onOpenCreditsModal={onOpenCreditsModal}
          onOpenHistory={onOpenHistory}
        />
      )}
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
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
            autoStartCamera={autoStartCamera}
            isLoadedProject={!!loadedProjectId}
          />
        ) : (
          <MobilePreviewView
            previewUrl={previewUrl}
            previewCode={generatedCode}
            isProcessing={isProcessing || isPolling}
            processingProgress={processingProgress}
            processingMessage={processingMessage}
            projectName={projectName}
            onPublish={handlePublish}
            publishedUrl={publishedUrl}
            isPublishing={isPublishing}
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
