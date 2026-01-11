"use client";

import { useState, useCallback, useEffect } from "react";
import MobileHome from "./MobileHome";
import MobileProcessing from "./MobileProcessing";
import MobileResult from "./MobileResult";
import { useMobileVideoProcessor } from "./useMobileVideoProcessor";

export type MobileView = "home" | "processing" | "result";

interface MobileLayoutProps {
  user: any;
  onLogin: () => void;
  onGenerate: (videoBlob: Blob, videoName: string) => Promise<{ code: string; previewUrl: string } | null>;
}

export default function MobileLayout({ user, onLogin, onGenerate }: MobileLayoutProps) {
  const [view, setView] = useState<MobileView>("home");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoName, setVideoName] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  
  const videoProcessor = useMobileVideoProcessor();
  
  // Store pending generation in localStorage for post-auth restoration
  useEffect(() => {
    const pendingVideoId = localStorage.getItem("replay_pending_mobile_video");
    if (pendingVideoId && user) {
      localStorage.removeItem("replay_pending_mobile_video");
    }
  }, [user]);
  
  // Handle video capture from camera
  const handleVideoCapture = useCallback(async (blob: Blob, name: string) => {
    console.log("Video captured:", name, (blob.size / 1024 / 1024).toFixed(2), "MB");
    
    setView("processing");
    setProcessingMessage("Optimizing video...");
    setGenerationProgress(0);
    setVideoBlob(blob);
    setVideoName(name);
    
    // Process video (compress if needed)
    const result = await videoProcessor.processVideo(blob, name);
    
    if (!result) {
      setView("home");
      return;
    }
    
    // Now generate code
    setProcessingMessage("Sending to AI...");
    setGenerationProgress(50);
    
    try {
      const genResult = await onGenerate(result.blob, name);
      
      if (genResult) {
        setGeneratedCode(genResult.code);
        setPreviewUrl(genResult.previewUrl);
        setGenerationProgress(100);
        setView("result");
      } else {
        throw new Error("Generation failed");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setView("home");
    }
  }, [videoProcessor, onGenerate]);
  
  // Handle video upload from library
  const handleVideoUpload = useCallback(async (file: File) => {
    console.log("Video uploaded:", file.name, (file.size / 1024 / 1024).toFixed(2), "MB");
    
    setView("processing");
    setProcessingMessage("Analyzing video...");
    setGenerationProgress(0);
    setVideoBlob(file);
    setVideoName(file.name.replace(/\.[^.]+$/, ""));
    
    // Process video
    const result = await videoProcessor.processVideo(file, file.name);
    
    if (!result) {
      setView("home");
      return;
    }
    
    // Generate code
    setProcessingMessage("Reconstructing UI...");
    setGenerationProgress(50);
    
    try {
      const genResult = await onGenerate(result.blob, file.name);
      
      if (genResult) {
        setGeneratedCode(genResult.code);
        setPreviewUrl(genResult.previewUrl);
        setGenerationProgress(100);
        setView("result");
      } else {
        throw new Error("Generation failed");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setView("home");
    }
  }, [videoProcessor, onGenerate]);
  
  // Reset to home
  const handleReset = useCallback(() => {
    setView("home");
    setVideoBlob(null);
    setVideoName("");
    setGeneratedCode(null);
    setPreviewUrl(null);
    setGenerationProgress(0);
    videoProcessor.reset();
  }, [videoProcessor]);
  
  // Handle auth for lazy-auth flow
  const handleAuthRequest = useCallback(() => {
    if (videoBlob) {
      localStorage.setItem("replay_pending_mobile_video", "pending");
    }
    onLogin();
  }, [videoBlob, onLogin]);
  
  // Calculate combined progress
  const combinedProgress = videoProcessor.state === "compressing" 
    ? videoProcessor.progress * 0.4  // 0-40%
    : videoProcessor.state === "uploading" || videoProcessor.state === "done"
    ? 40 + generationProgress * 0.6  // 40-100%
    : generationProgress;
  
  // Get processing message
  const getMessage = () => {
    if (videoProcessor.state === "analyzing") return "Analyzing format...";
    if (videoProcessor.state === "compressing") return "Compressing video...";
    if (videoProcessor.state === "uploading") return "Uploading...";
    return processingMessage;
  };
  
  return (
    <div className="fixed inset-0 bg-black">
      {view === "home" && (
        <MobileHome
          onVideoCapture={handleVideoCapture}
          onVideoUpload={handleVideoUpload}
          user={user}
          onLogin={onLogin}
        />
      )}
      
      {view === "processing" && (
        <MobileProcessing
          progress={combinedProgress}
          message={getMessage()}
          videoBlob={videoBlob}
          onCancel={handleReset}
        />
      )}
      
      {view === "result" && (
        <MobileResult
          videoBlob={videoBlob}
          previewUrl={previewUrl}
          generatedCode={generatedCode}
          isAuthenticated={!!user}
          onLogin={handleAuthRequest}
          onNewScan={handleReset}
          videoName={videoName}
        />
      )}
    </div>
  );
}
