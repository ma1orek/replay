"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MobileHeader from "./MobileHeader";
import MobileConfigureView from "./MobileConfigureView";
import MobilePreviewView from "./MobilePreviewView";
import FloatingIsland from "./FloatingIsland";
import { useMobileVideoProcessor } from "./useMobileVideoProcessor";

interface MobileLayoutProps {
  user: any;
  isPro: boolean;
  plan: string;
  creditsLoading?: boolean;
  onLogin: () => void;
  onGenerate: (videoBlob: Blob, videoName: string) => Promise<{ code: string; previewUrl: string } | null>;
}

// Keys for localStorage
const STORAGE_KEY_VIDEO = "replay_mobile_pending_video";
const STORAGE_KEY_NAME = "replay_mobile_pending_name";

export default function MobileLayout({ user, isPro, plan, creditsLoading, onLogin, onGenerate }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<"configure" | "preview">("configure");
  const [projectName, setProjectName] = useState("New Project");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [style, setStyle] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const videoProcessor = useMobileVideoProcessor();
  const pendingLoginRef = useRef(false);
  
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
  
  // Reconstruct - the main action
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
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage("Starting...");
    setActiveTab("preview");
    
    try {
      // Skip compression - send raw video directly (like desktop does)
      setProcessingProgress(20);
      setProcessingMessage("Uploading video...");
      
      // Directly use the video blob without processing
      // This matches desktop behavior
      setProcessingProgress(40);
      setProcessingMessage("Generating UI...");
      
      console.log("[MobileLayout] Calling onGenerate with blob:", videoBlob.size, videoBlob.type);
      
      const result = await onGenerate(videoBlob, projectName);
      
      console.log("[MobileLayout] onGenerate result:", result);
      
      if (result) {
        setProcessingProgress(90);
        setProcessingMessage("Rendering preview...");
        
        await new Promise(r => setTimeout(r, 200));
        
        setPreviewUrl(result.previewUrl);
        setProcessingProgress(100);
        setProcessingMessage("Done!");
        setHasGenerated(true);
      } else {
        // onGenerate returns null on error (error toast shown there)
        console.error("[MobileLayout] onGenerate returned null");
        setActiveTab("configure");
        setProcessingMessage("");
      }
      
    } catch (err) {
      console.error("[MobileLayout] Reconstruction error:", err);
      setActiveTab("configure");
      setProcessingMessage("");
    } finally {
      setIsProcessing(false);
    }
  }, [videoBlob, user, onLogin, saveVideoForLogin, onGenerate, projectName, creditsLoading]);
  
  // Handle back - goes back in flow or clears video
  const handleBack = useCallback(() => {
    if (activeTab === "preview" && !isProcessing) {
      setActiveTab("configure");
    } else if (activeTab === "configure") {
      // If there's a video, clear it. Otherwise do nothing (or could navigate home)
      if (videoBlob) {
        handleRemoveVideo();
      }
    }
  }, [activeTab, isProcessing, videoBlob, handleRemoveVideo]);
  
  // Calculate progress
  const combinedProgress = videoProcessor.state === "compressing"
    ? 10 + (videoProcessor.progress * 0.2)
    : processingProgress;
  
  // Get message
  const currentMessage = videoProcessor.state === "compressing"
    ? "Compressing..."
    : videoProcessor.state === "analyzing"
    ? "Analyzing..."
    : processingMessage;
  
  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header - always visible in configure, hidden in preview when not processing */}
      {(activeTab === "configure" || isProcessing) && (
        <MobileHeader
          projectName={projectName}
          onProjectNameChange={setProjectName}
          isPro={isPro}
          plan={plan}
          onBack={handleBack}
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
            isProcessing={isProcessing}
            processingProgress={combinedProgress}
            processingMessage={currentMessage}
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
