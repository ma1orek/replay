"use client";

import { useState, useCallback, useEffect } from "react";
import MobileHeader from "./MobileHeader";
import MobileConfigureView from "./MobileConfigureView";
import MobilePreviewView from "./MobilePreviewView";
import FloatingIsland from "./FloatingIsland";
import { useMobileVideoProcessor } from "./useMobileVideoProcessor";

interface MobileLayoutProps {
  user: any;
  onLogin: () => void;
  onGenerate: (videoBlob: Blob, videoName: string) => Promise<{ code: string; previewUrl: string } | null>;
}

export default function MobileLayout({ user, onLogin, onGenerate }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<"configure" | "preview">("configure");
  const [projectName, setProjectName] = useState("Untitled Project");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [style, setStyle] = useState("auto");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  
  const videoProcessor = useMobileVideoProcessor();
  
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
    setProjectName(name || "Screen Recording");
  }, []);
  
  // Handle video upload
  const handleVideoUpload = useCallback((file: File) => {
    setVideoBlob(file);
    setProjectName(file.name.replace(/\.[^.]+$/, "") || "Uploaded Video");
  }, []);
  
  // Remove video
  const handleRemoveVideo = useCallback(() => {
    setVideoBlob(null);
    setVideoUrl(null);
    setPreviewUrl(null);
  }, []);
  
  // Reconstruct - the main action
  const handleReconstruct = useCallback(async () => {
    if (!videoBlob) return;
    
    // Check if user is logged in
    if (!user) {
      onLogin();
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage("Preparing video...");
    setActiveTab("preview"); // Switch to preview immediately
    
    try {
      // Process video (compress if needed)
      setProcessingMessage("Optimizing video...");
      setProcessingProgress(10);
      
      const processed = await videoProcessor.processVideo(videoBlob);
      
      if (!processed) {
        throw new Error("Video processing failed");
      }
      
      setProcessingProgress(30);
      setProcessingMessage("Uploading to server...");
      
      // Generate code
      setProcessingProgress(50);
      setProcessingMessage("Analyzing UI components...");
      
      const result = await onGenerate(processed.blob, projectName);
      
      if (result) {
        setProcessingProgress(90);
        setProcessingMessage("Rendering preview...");
        
        // Small delay to show final progress
        await new Promise(r => setTimeout(r, 500));
        
        setPreviewUrl(result.previewUrl);
        setProcessingProgress(100);
        setProcessingMessage("Done!");
      } else {
        throw new Error("Generation failed");
      }
      
    } catch (err) {
      console.error("Reconstruction error:", err);
      setActiveTab("configure");
      setProcessingMessage("");
    } finally {
      setIsProcessing(false);
    }
  }, [videoBlob, user, onLogin, videoProcessor, onGenerate, projectName]);
  
  // Handle back
  const handleBack = useCallback(() => {
    if (activeTab === "preview" && !isProcessing) {
      setActiveTab("configure");
    } else {
      // Could navigate to project list in future
    }
  }, [activeTab, isProcessing]);
  
  // Calculate combined progress
  const combinedProgress = videoProcessor.state === "compressing"
    ? 10 + (videoProcessor.progress * 0.2)
    : processingProgress;
  
  // Get current message
  const currentMessage = videoProcessor.state === "compressing"
    ? "Compressing video..."
    : videoProcessor.state === "analyzing"
    ? "Analyzing format..."
    : processingMessage;
  
  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header - only in configure mode */}
      {activeTab === "configure" && (
        <MobileHeader
          projectName={projectName}
          onProjectNameChange={setProjectName}
          credits={user?.credits || 0}
          isPro={user?.isPro || false}
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
      
      {/* Floating Island navigation */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-50">
        <FloatingIsland
          activeTab={activeTab}
          onChange={setActiveTab}
          disabled={isProcessing}
        />
      </div>
    </div>
  );
}
