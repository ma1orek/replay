"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import MobileHeader from "./MobileHeader";
import MobileConfigureView from "./MobileConfigureView";
import MobileBottomNav, { MobileTab } from "./MobileBottomNav";
import MobileProjectFeed from "./MobileProjectFeed";
import { useAsyncGeneration } from "./useAsyncGeneration";
import { useMobileVideoProcessor } from "./useMobileVideoProcessor";
import { MobileLiveCollaboration } from "./MobileLiveCollaboration";
import MobilePreviewWithComments from "./MobilePreviewWithComments";

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

const STORAGE_KEY_NAME = "replay_mobile_pending_name";
const STORAGE_KEY_LOAD_PROJECT = "replay_mobile_load_project";

const openVideoDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("replay_videos", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos");
      }
    };
  });
};

export default function MobileLayout({ user, isPro, plan, credits, creditsLoading, onLogin, onOpenCreditsModal, onCreditsRefresh, onSaveGeneration, onOpenHistory }: MobileLayoutProps) {
  const searchParams = useSearchParams();
  const autoStartCamera = searchParams?.get("camera") === "true";
  
  // Simple 2-tab navigation: feed | capture (when no preview) or feed | preview (when has preview)
  const [mainTab, setMainTab] = useState<MobileTab>("capture");
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
    if (loadProjectData) {
      try {
        const project = JSON.parse(loadProjectData);
        setProjectName(project.title || "Loaded Project");
        setLoadedProjectId(project.id);
        
        if (project.videoUrl) {
          setVideoUrl(project.videoUrl);
        }
        
        if (project.code) {
          setGeneratedCode(project.code);
          const blob = new Blob([project.code], { type: "text/html" });
          setPreviewUrl(URL.createObjectURL(blob));
          setHasGenerated(true);
          setMainTab("preview");
        }
        
        if (project.publishedSlug) {
          setPublishedUrl(`https://www.replay.build/p/${project.publishedSlug}`);
        }
        
        localStorage.removeItem(STORAGE_KEY_LOAD_PROJECT);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY_LOAD_PROJECT);
      }
    }
  }, []);

  // Wake Lock during processing
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
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
      }
    };
  }, [isProcessing]);

  const { processAndUpload, status: uploadStatus, reset: resetUpload } = useMobileVideoProcessor();

  const handleGenerationComplete = useCallback((code: string, title?: string, videoUrl?: string) => {
    setGeneratedCode(code);
    const blob = new Blob([code], { type: "text/html" });
    setPreviewUrl(URL.createObjectURL(blob));
    setHasGenerated(true);
    setIsProcessing(false);
    setMainTab("preview");
    
    if (title && title !== "Untitled Project") {
      setProjectName(title);
    }
    
    if (onCreditsRefresh) onCreditsRefresh();
  }, [onCreditsRefresh]);

  const handleGenerationError = useCallback((error: string) => {
    setGenerationError(error);
    setIsProcessing(false);
    setMainTab("capture");
    alert(`Generation failed: ${error}`);
  }, []);

  const { startGeneration, jobStatus, isPolling, checkForPendingJob } = useAsyncGeneration(
    handleGenerationComplete,
    handleGenerationError
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForPendingJob();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkForPendingJob]);
  
  // Restore video from IndexedDB after login
  useEffect(() => {
    if (user && !videoBlob) {
      const restoreVideo = async () => {
        try {
          const db = await openVideoDB();
          const tx = db.transaction("videos", "readonly");
          const store = tx.objectStore("videos");
          const request = store.get("pending_video");
          
          request.onsuccess = () => {
            if (request.result) {
              const { blob, name } = request.result;
              setVideoBlob(blob);
              if (name) setProjectName(name);
              
              const deleteTx = db.transaction("videos", "readwrite");
              deleteTx.objectStore("videos").delete("pending_video");
            }
          };
        } catch (err) {}
        
        try {
          const savedName = localStorage.getItem(STORAGE_KEY_NAME);
          if (savedName) {
            setProjectName(savedName);
            localStorage.removeItem(STORAGE_KEY_NAME);
          }
        } catch (e) {}
      };
      restoreVideo();
    }
  }, [user, videoBlob]);
  
  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);
  
  const handleVideoCapture = useCallback((blob: Blob, name: string) => {
    setVideoBlob(blob);
    setProjectName(name || "New Project");
  }, []);
  
  const handleVideoUpload = useCallback((file: File) => {
    setVideoBlob(file);
    const cleanName = file.name.replace(/\.[^.]+$/, "");
    setProjectName(cleanName || "New Project");
  }, []);
  
  const handleRemoveVideo = useCallback(() => {
    setVideoBlob(null);
    setVideoUrl(null);
    setPreviewUrl(null);
    setProjectName("New Project");
    setHasGenerated(false);
    setLoadedProjectId(null);
  }, []);
  
  const saveVideoForLogin = useCallback(async () => {
    if (!videoBlob) return;
    
    try {
      const db = await openVideoDB();
      const tx = db.transaction("videos", "readwrite");
      const store = tx.objectStore("videos");
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ blob: videoBlob, name: projectName }, "pending_video");
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      try {
        localStorage.setItem(STORAGE_KEY_NAME, projectName);
      } catch (e) {}
    } catch (err) {}
  }, [videoBlob, projectName]);
  
  const handleReconstruct = useCallback(async () => {
    if (!videoBlob && !videoUrl) return;
    
    if (!user) {
      if (videoBlob) {
        pendingLoginRef.current = true;
        await saveVideoForLogin();
      }
      onLogin();
      return;
    }
    
    if (creditsLoading) return;
    
    setGenerationError(null);
    setIsProcessing(true);
    
    try {
      let finalVideoUrl: string;
      
      if (videoBlob) {
        const videoFile = videoBlob instanceof File 
          ? videoBlob 
          : new File([videoBlob], "recording.mp4", { type: "video/mp4" });
          
        finalVideoUrl = await processAndUpload(videoFile);
        
        if (!finalVideoUrl) {
          throw new Error("Upload failed");
        }
      } else if (videoUrl) {
        finalVideoUrl = videoUrl;
      } else {
        throw new Error("No video available");
      }

      let styleDirective = style || "";
      if (context.trim()) {
        styleDirective = styleDirective 
          ? `${styleDirective}. Additional context: ${context.trim()}`
          : `Additional context: ${context.trim()}`;
      }

      const result = await startGeneration(finalVideoUrl, styleDirective);
      
      if (!result) {
        setIsProcessing(false);
        setMainTab("capture");
      }
      
    } catch (error: any) {
      setGenerationError(error.message || "Processing failed");
      setIsProcessing(false);
      setMainTab("capture");
      alert(`Error: ${error.message || "Processing failed"}`);
    }
    
  }, [videoBlob, videoUrl, user, onLogin, saveVideoForLogin, creditsLoading, style, context, processAndUpload, startGeneration]);
  
  const handleBack = useCallback(() => {
    if (mainTab === "preview") {
      // Go back to new project
      handleRemoveVideo();
      setMainTab("capture");
    } else if (mainTab === "capture") {
      if (videoBlob) {
        handleRemoveVideo();
      }
    }
  }, [mainTab, videoBlob, handleRemoveVideo]);
  
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
          existingSlug: null,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        setPublishedUrl(data.url);
        return data.url;
      } else {
        return null;
      }
    } catch (error: any) {
      return null;
    } finally {
      setIsPublishing(false);
    }
  }, [generatedCode, projectName]);

  let processingProgress = 0;
  let processingMessage = "Starting...";

  if (uploadStatus.stage === "uploading") {
    processingProgress = Math.round(uploadStatus.progress * 0.3); 
    processingMessage = uploadStatus.message;
  } else if (jobStatus) {
    processingProgress = 30 + Math.round(jobStatus.progress * 0.7);
    processingMessage = jobStatus.message;
  } else if (isProcessing) {
    processingMessage = "Initializing...";
  }

  const handleSelectProject = useCallback(async (project: any) => {
    setProjectName(project.title || "Loaded Project");
    setLoadedProjectId(project.id);
    
    try {
      const response = await fetch(`/api/generations?id=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.generation) {
          const gen = data.generation;
          
          if (gen.code) {
            setGeneratedCode(gen.code);
            const blob = new Blob([gen.code], { type: "text/html" });
            setPreviewUrl(URL.createObjectURL(blob));
            setHasGenerated(true);
          }
          
          if (gen.videoUrl) {
            setVideoUrl(gen.videoUrl);
          }
          
          if (gen.publishedSlug) {
            setPublishedUrl(`https://www.replay.build/p/${gen.publishedSlug}`);
          }
        }
      }
    } catch (error) {}
    
    setMainTab("preview");
  }, []);

  const handleMainTabChange = useCallback((tab: MobileTab) => {
    setMainTab(tab);
  }, []);

  // Determine which content to show
  const showHeader = mainTab === "feed" || (mainTab === "capture" && !isProcessing);
  const showConfigure = mainTab === "capture" && !hasGenerated && !isProcessing;
  const showPreview = mainTab === "preview" || (mainTab === "capture" && (hasGenerated || isProcessing));

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden">
      {/* Header */}
      {showHeader && (
        <MobileHeader
          projectName={mainTab === "feed" ? "Projects" : projectName}
          onProjectNameChange={mainTab === "capture" ? setProjectName : () => {}}
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
        {mainTab === "feed" && (
          <MobileProjectFeed onSelectProject={handleSelectProject} />
        )}
        
        {showConfigure && (
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
        )}
        
        {showPreview && (
          <MobileLiveCollaboration projectId={loadedProjectId}>
            <MobilePreviewWithComments
              previewUrl={previewUrl}
              previewCode={generatedCode}
              isProcessing={isProcessing || isPolling}
              processingProgress={processingProgress}
              processingMessage={processingMessage}
              projectName={projectName}
              projectId={loadedProjectId}
              onPublish={handlePublish}
              publishedUrl={publishedUrl}
              isPublishing={isPublishing}
            />
          </MobileLiveCollaboration>
        )}
      </div>
      
      {/* Bottom Navigation - only when not in fullscreen preview */}
      {!showPreview && (
        <MobileBottomNav
          activeTab={mainTab}
          onChange={handleMainTabChange}
          disabled={isProcessing}
          hasPreview={hasGenerated}
        />
      )}
    </div>
  );
}
