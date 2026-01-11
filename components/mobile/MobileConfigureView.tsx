"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, RefreshCw, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

const STYLE_PRESETS = [
  { id: "auto", name: "Auto-detect" },
  { id: "modern", name: "Modern & Clean" },
  { id: "glassmorphism", name: "Glassmorphism" },
  { id: "brutalism", name: "Neo-Brutalism" },
  { id: "minimal", name: "Minimal" },
];

export default function MobileConfigureView({
  videoBlob,
  videoUrl,
  onVideoCapture,
  onVideoUpload,
  onRemoveVideo,
  context,
  onContextChange,
  style,
  onStyleChange,
  onReconstruct,
  isProcessing
}: MobileConfigureViewProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
        onVideoCapture(blob, `scan-${Date.now()}`);
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
  
  const selectedStyle = STYLE_PRESETS.find(s => s.id === style) || STYLE_PRESETS[0];
  
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
            <button onClick={stopCamera} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <X className="w-6 h-6 text-white" />
            </button>
            
            {isRecording ? (
              <button onClick={stopRecording} className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center">
                <div className="w-8 h-8 rounded-sm bg-white" />
              </button>
            ) : (
              <button onClick={startRecording} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#FF6E3C]" />
              </button>
            )}
            
            <div className="w-14" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-auto p-4 pb-32">
      {/* Video Box */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">
          Input Video
        </label>
        
        {videoBlob && videoUrl ? (
          // Filled state
          <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            <video
              ref={previewVideoRef}
              src={videoUrl}
              className="w-full aspect-video object-cover"
              playsInline
              muted
              loop
              autoPlay
            />
            <button
              onClick={onRemoveVideo}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace
            </button>
          </div>
        ) : (
          // Empty state - tap to record/upload
          <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="flex">
              <button
                onClick={startCamera}
                className="flex-1 flex flex-col items-center justify-center py-10 hover:bg-white/5 transition-colors border-r border-white/10"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FF6E3C]/10 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 text-[#FF6E3C]" />
                </div>
                <span className="text-white/80 font-medium text-sm">Record</span>
                <span className="text-white/30 text-xs mt-1">Point at UI</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center py-10 hover:bg-white/5 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7 text-white/60" />
                </div>
                <span className="text-white/80 font-medium text-sm">Upload</span>
                <span className="text-white/30 text-xs mt-1">Screen recording</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Context */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">
          Context <span className="text-white/20">(optional)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="E.g., Make the buttons rounded, use blue accent color..."
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm resize-none focus:outline-none focus:border-[#FF6E3C]/50 transition-colors"
          rows={3}
        />
      </div>
      
      {/* Style */}
      <div className="mb-8">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">
          Style
        </label>
        <button
          onClick={() => setShowStyleDropdown(!showStyleDropdown)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
        >
          <span>{selectedStyle.name}</span>
          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showStyleDropdown ? "rotate-180" : ""}`} />
        </button>
        
        <AnimatePresence>
          {showStyleDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 rounded-xl bg-[#111] border border-white/10 overflow-hidden"
            >
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onStyleChange(preset.id);
                    setShowStyleDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                    style === preset.id 
                      ? "bg-[#FF6E3C]/10 text-[#FF6E3C]" 
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Reconstruct button */}
      <button
        onClick={onReconstruct}
        disabled={!videoBlob || isProcessing}
        className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
          videoBlob && !isProcessing
            ? "bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white shadow-lg shadow-[#FF6E3C]/20"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
