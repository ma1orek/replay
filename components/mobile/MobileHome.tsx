"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, X, Circle, Square, ChevronRight, Zap, User, History, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MobileHomeProps {
  onVideoCapture: (blob: Blob, name: string) => void;
  onVideoUpload: (file: File) => void;
  user: any;
  onLogin: () => void;
}

type HomeMode = "main" | "camera" | "import-guide";

export default function MobileHome({ onVideoCapture, onVideoUpload, user, onLogin }: MobileHomeProps) {
  const [mode, setMode] = useState<HomeMode>("main");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraReady(false);
      setMode("camera");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
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
      setCameraError("Camera access denied. Please allow camera permissions.");
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
    setMode("main");
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
      setMode("main");
      onVideoUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  
  // CAMERA MODE - Fullscreen
  if (mode === "camera") {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center">
                <Camera className="w-12 h-12 text-white/30 mx-auto mb-3 animate-pulse" />
                <p className="text-white/50">Starting camera...</p>
              </div>
            </div>
          )}
          
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-6">
              <div className="text-center">
                <Camera className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-white mb-4">{cameraError}</p>
                <button onClick={stopCamera} className="px-6 py-3 bg-white/10 rounded-xl text-white">
                  Go Back
                </button>
              </div>
            </div>
          )}
          
          {isRecording && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <span className="text-white font-mono font-bold">{formatTime(recordingTime)}</span>
            </div>
          )}
          
          {cameraReady && !cameraError && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-16 left-6 w-12 h-12 border-t-2 border-l-2 border-[#FF6E3C]" />
              <div className="absolute top-16 right-6 w-12 h-12 border-t-2 border-r-2 border-[#FF6E3C]" />
              <div className="absolute bottom-36 left-6 w-12 h-12 border-b-2 border-l-2 border-[#FF6E3C]" />
              <div className="absolute bottom-36 right-6 w-12 h-12 border-b-2 border-r-2 border-[#FF6E3C]" />
            </div>
          )}
        </div>
        
        <div className="bg-black px-6 py-8 pb-12 border-t border-white/10">
          <div className="flex items-center justify-center gap-16">
            <button onClick={stopCamera} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <X className="w-6 h-6 text-white" />
            </button>
            
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/50"
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={!cameraReady}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                  cameraReady ? "bg-[#FF6E3C] shadow-lg shadow-[#FF6E3C]/50" : "bg-white/20"
                )}
              >
                <Circle className="w-14 h-14 text-white stroke-[3]" />
              </button>
            )}
            
            <div className="w-14" />
          </div>
          <p className="text-center text-white/50 text-sm mt-4">
            {isRecording ? "Tap to stop" : cameraReady ? "Tap to record" : "Waiting..."}
          </p>
        </div>
      </div>
    );
  }
  
  // IMPORT GUIDE MODE
  if (mode === "import-guide") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button onClick={() => setMode("main")} className="p-2 -ml-2">
            <X className="w-6 h-6 text-white/60" />
          </button>
          <span className="text-white font-medium">Import Recording</span>
          <div className="w-10" />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Animated instruction */}
          <div className="relative w-36 h-64 bg-gradient-to-b from-white/10 to-white/5 rounded-[2rem] border-2 border-white/20 overflow-hidden mb-8">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-black rounded-full" />
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <motion.div
                className="w-8 h-8 rounded-full bg-[#FF6E3C] flex items-center justify-center"
                animate={{ y: [0, 25, 25, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <ChevronRight className="w-5 h-5 text-white rotate-90" />
              </motion.div>
              <motion.div
                className="w-5 h-5 rounded-full bg-red-500"
                animate={{ scale: [0, 0, 1.2, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1] }}
              />
            </motion.div>
          </div>
          
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Record Your Screen</h3>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] flex items-center justify-center font-bold text-sm">1</span>
                <span className="text-white/70">Swipe down from top-right</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] flex items-center justify-center font-bold text-sm">2</span>
                <span className="text-white/70">Tap Screen Record 🔴</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] flex items-center justify-center font-bold text-sm">3</span>
                <span className="text-white/70">Browse any app, then stop</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs py-4 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-[#FF6E3C]/30"
          >
            <Upload className="w-5 h-5" />
            Select from Library
          </button>
          
          <p className="text-white/30 text-sm mt-4">MP4, MOV, WebM</p>
        </div>
        
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </div>
    );
  }
  
  // MAIN HOME - Two Big Buttons
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">Replay</span>
        </div>
        
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 relative">
          {user ? (
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C]/20 flex items-center justify-center">
              <span className="text-[#FF6E3C] text-sm font-bold">
                {user.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          ) : (
            <User className="w-6 h-6 text-white/50" />
          )}
        </button>
      </div>
      
      {/* Menu dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 right-4 bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden z-50 min-w-[200px]"
          >
            {user ? (
              <>
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white text-sm font-medium truncate">{user.email}</p>
                  <p className="text-white/40 text-xs">Free Plan</p>
                </div>
                <button className="w-full px-4 py-3 flex items-center gap-3 text-white/70 hover:bg-white/5">
                  <History className="w-4 h-4" />
                  <span className="text-sm">History</span>
                </button>
                <button className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-white/5">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </>
            ) : (
              <button onClick={() => { onLogin(); setShowMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-white/5">
                <User className="w-4 h-4" />
                <span className="text-sm">Sign In</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">Scan any UI</h1>
          <p className="text-white/50">Turn interfaces into React code</p>
        </div>
        
        {/* PRIMARY: Scan Reality */}
        <motion.button
          onClick={startCamera}
          className="w-full max-w-sm aspect-[2/1] rounded-3xl bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex flex-col items-center justify-center gap-3 shadow-2xl shadow-[#FF6E3C]/30 relative overflow-hidden"
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SCAN REALITY</span>
            <span className="text-white/70 text-sm">Point camera at any screen</span>
          </div>
        </motion.button>
        
        {/* SECONDARY: Import Recording */}
        <motion.button
          onClick={() => setMode("import-guide")}
          className="w-full max-w-sm aspect-[2.5/1] rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-white/70" />
          </div>
          <span className="text-lg font-semibold text-white/80">Import Screen Recording</span>
          <span className="text-white/40 text-xs">Pixel-perfect quality</span>
        </motion.button>
        
        <p className="text-white/25 text-xs text-center mt-2">
          Like Shazam for UI
        </p>
      </div>
      
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
