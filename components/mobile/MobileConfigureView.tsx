"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, RefreshCw } from "lucide-react";
import StyleInjector from "@/components/StyleInjector";

interface MobileConfigureViewProps {
  videoBlob: Blob | null;
  videoUrl: string | null;
  onVideoCapture: (blob: Blob, name: string) => void;
  onVideoUpload: (file: File) => void;
  onRemoveVideo: () => void;
  context: string;
  onContextChange: (value: string) => void;
  style: string;
  onStyleChange: (value: string) => void;
  onReconstruct: () => void;
  isProcessing: boolean;
  autoStartCamera?: boolean;
  isLoadedProject?: boolean;
}

export default function MobileConfigureView({
  videoBlob,
  videoUrl,
  onVideoCapture,
  onVideoUpload,
  onRemoveVideo,
  context,
  onContextChange,
  style,
  isLoadedProject = false,
  onStyleChange,
  onReconstruct,
  isProcessing,
  autoStartCamera = false
}: MobileConfigureViewProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const hasAutoStarted = useRef(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);
  
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setShowCamera(false);
    }
  };
  
  const stopCamera = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
    setIsRecording(false);
    setRecordingTime(0);
  };
  
  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    
    const mimeTypes = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
    let mime = "video/webm";
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) { mime = m; break; }
    }
    
    const recorder = new MediaRecorder(streamRef.current, { mimeType: mime, videoBitsPerSecond: 2500000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: mime });
        onVideoCapture(blob, "New Project");
      }
      stopCamera();
    };
    
    recorderRef.current = recorder;
    recorder.start(500);
    setIsRecording(true);
    timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
  };
  
  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecording(false);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("video/")) onVideoUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  
  // Auto-start camera
  useEffect(() => {
    if (autoStartCamera && !hasAutoStarted.current && !videoBlob) {
      hasAutoStarted.current = true;
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [autoStartCamera, videoBlob]);
  
  // Camera overlay
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <video ref={videoRef} className="flex-1 object-cover" playsInline muted autoPlay />
        
        {isRecording && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-600 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-white font-mono text-sm font-bold">{formatTime(recordingTime)}</span>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 pb-10 pt-16 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex items-center justify-center gap-10">
            <button 
              onPointerUp={(e) => {
                e.preventDefault();
                stopCamera();
              }}
              className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center touch-manipulation active:scale-95"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {isRecording ? (
              <button 
                onPointerUp={(e) => {
                  e.preventDefault();
                  stopRecording();
                }}
                className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center touch-manipulation active:scale-95"
              >
                <div className="w-8 h-8 rounded-sm bg-white" />
              </button>
            ) : (
              <button 
                onPointerUp={(e) => {
                  e.preventDefault();
                  startRecording();
                }}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center touch-manipulation active:scale-95"
              >
                <div className="w-14 h-14 rounded-full bg-white" />
              </button>
            )}
            
            <div className="w-14" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-36 bg-[#0a0a0a]">
      {/* Video Box */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">
          Input Video
        </label>
        
        {videoUrl ? (
          // Filled state
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <video
              ref={previewVideoRef}
              src={videoUrl}
              className="w-full max-h-[50vh] object-contain"
              playsInline
              muted
              loop
              autoPlay
            />
            {videoBlob && (
              <button
                onPointerUp={(e) => {
                  e.preventDefault();
                  onRemoveVideo();
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-sm text-zinc-400 touch-manipulation active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {!videoBlob && (
              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-zinc-400 text-xs font-medium">
                Original Input
              </div>
            )}
            <button
              onPointerUp={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 backdrop-blur-sm text-zinc-300 text-xs touch-manipulation active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace
            </button>
          </div>
        ) : (
          // Empty state
          <div className="rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="flex">
              <button
                onPointerUp={(e) => {
                  e.preventDefault();
                  startCamera();
                }}
                className="flex-1 flex flex-col items-center justify-center py-10 active:bg-zinc-800/50 border-r border-zinc-800 touch-manipulation"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 text-zinc-400" />
                </div>
                <span className="text-zinc-300 font-medium text-sm">Record</span>
                <span className="text-zinc-600 text-xs mt-1 text-center px-2">Products, screens, sketches</span>
              </button>
              
              <button
                onPointerUp={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
                className="flex-1 flex flex-col items-center justify-center py-10 active:bg-zinc-800/50 touch-manipulation"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7 text-zinc-400" />
                </div>
                <span className="text-zinc-300 font-medium text-sm">Upload</span>
                <span className="text-zinc-600 text-xs mt-1 text-center px-2">Videos, photos, mockups</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Context */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">
          Context <span className="text-zinc-600">(optional)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="E.g., Make the buttons rounded, use blue accent color..."
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm resize-none focus:outline-none focus:border-zinc-700"
          rows={3}
        />
      </div>
      
      {/* Style */}
      <div className="mb-8">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">
          Style <span className="text-zinc-600">(optional)</span>
        </label>
        <StyleInjector
          value={style}
          onChange={onStyleChange}
          disabled={isProcessing}
        />
      </div>
      
      {/* Reconstruct button */}
      <button
        onPointerUp={(e) => {
          e.preventDefault();
          if ((videoBlob || isLoadedProject) && !isProcessing) {
            onReconstruct();
          }
        }}
        disabled={(!videoBlob && !isLoadedProject) || isProcessing}
        className={`w-full py-4 rounded-xl font-bold text-base touch-manipulation active:scale-[0.98] transition-transform ${
          (videoBlob || isLoadedProject) && !isProcessing
            ? "bg-white text-black"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          "Reconstruct"
        )}
      </button>
      
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
