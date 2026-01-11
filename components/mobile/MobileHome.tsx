"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Square, Folder } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileHomeProps {
  onVideoCapture: (blob: Blob, name: string) => void;
  onVideoUpload: (file: File) => void;
  user: any;
  onLogin: () => void;
}

// Replay Logo Component
function ReplayLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <rect width="32" height="32" rx="8" fill="url(#replay-gradient)" />
      <path
        d="M12 10v12l10-6-10-6z"
        fill="white"
        fillOpacity="0.9"
      />
      <defs>
        <linearGradient id="replay-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#FF6E3C" />
          <stop offset="1" stopColor="#FF8F5C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function MobileHome({ onVideoCapture, onVideoUpload, user, onLogin }: MobileHomeProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hide hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraReady(false);
      setShowCamera(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied");
      setShowCamera(false);
    }
  };
  
  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setIsRecording(false);
    setRecordingTime(0);
    setShowCamera(false);
  }, []);
  
  const startRecording = () => {
    if (!streamRef.current || !cameraReady) return;
    
    chunksRef.current = [];
    
    const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    let selectedMime = "video/webm";
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }
    
    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMime,
        videoBitsPerSecond: 2500000
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: selectedMime });
          const timestamp = Date.now();
          onVideoCapture(blob, `scan-${timestamp}`);
        }
        stopCamera();
      };
      
      recorderRef.current = recorder;
      recorder.start(500);
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(p => p + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Recording error:", err);
      setCameraError("Failed to start recording");
    }
  };
  
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("video/")) {
      onVideoUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  
  // CAMERA MODE - Fullscreen like Instagram/TikTok
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        {/* Camera feed */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          
          {/* Loading state */}
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="w-16 h-16 border-2 border-[#FF6E3C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/50 text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
              <div className="text-center">
                <p className="text-white mb-4">{cameraError}</p>
                <button onClick={stopCamera} className="px-6 py-3 bg-white/10 rounded-xl text-white">
                  Go Back
                </button>
              </div>
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-600 rounded-full"
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-white"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-white font-mono font-bold text-sm">{formatTime(recordingTime)}</span>
            </motion.div>
          )}
          
          {/* Viewfinder corners */}
          {cameraReady && !cameraError && (
            <div className="absolute inset-8 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FF6E3C]/60" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF6E3C]/60" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FF6E3C]/60" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FF6E3C]/60" />
            </div>
          )}
        </div>
        
        {/* Controls - floating at bottom */}
        <div className="absolute bottom-0 left-0 right-0 pb-10 pt-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="flex items-center justify-center gap-12">
            {/* Close button */}
            <button 
              onClick={stopCamera} 
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Shutter button */}
            {isRecording ? (
              <motion.button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </motion.button>
            ) : (
              <motion.button
                onClick={startRecording}
                disabled={!cameraReady}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <div className={`w-16 h-16 rounded-full ${cameraReady ? 'bg-[#FF6E3C]' : 'bg-white/20'}`} />
              </motion.button>
            )}
            
            {/* Placeholder for balance */}
            <div className="w-14" />
          </div>
        </div>
      </div>
    );
  }
  
  // MAIN HOME - "The Shutter" Design
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px"
        }}
      />
      
      {/* Top logo - centered, subtle */}
      <div className="relative z-10 flex justify-center py-8">
        <ReplayLogo className="w-10 h-10 opacity-60" />
      </div>
      
      {/* Center hint text */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <AnimatePresence>
          {showHint && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.5, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-white/50 text-lg text-center"
            >
              Point at UI or upload recording
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      
      {/* Bottom controls - floating like camera app */}
      <div className="relative z-10 pb-12 px-6">
        <div className="flex items-center justify-center gap-8">
          {/* Gallery/Upload button - left side */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <Folder className="w-6 h-6 text-white/70" />
          </motion.button>
          
          {/* Main shutter button - center */}
          <motion.button
            onClick={startCamera}
            className="relative w-20 h-20 rounded-full"
            whileTap={{ scale: 0.95 }}
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-white/80" />
            {/* Inner circle - orange */}
            <motion.div 
              className="absolute inset-2 rounded-full bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C]"
              animate={{ 
                boxShadow: ["0 0 0 0 rgba(255,110,60,0.4)", "0 0 0 12px rgba(255,110,60,0)", "0 0 0 0 rgba(255,110,60,0.4)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
          
          {/* Placeholder for balance */}
          <div className="w-14" />
        </div>
        
        {/* Labels */}
        <div className="flex items-center justify-center gap-8 mt-4">
          <span className="text-white/30 text-xs w-14 text-center">Gallery</span>
          <span className="text-white/50 text-xs w-20 text-center">Scan</span>
          <div className="w-14" />
        </div>
      </div>
      
      {/* Hidden file input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="video/*" 
        onChange={handleFileSelect} 
        className="hidden" 
      />
    </div>
  );
}
