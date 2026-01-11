"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Loader2, ChevronRight, Scan, Zap, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MobileScannerProps {
  onVideoCapture: (blob: Blob, name: string) => void;
  onVideoUpload: (file: File) => void;
  isProcessing?: boolean;
  compressionProgress?: number;
}

export default function MobileScanner({ 
  onVideoCapture, 
  onVideoUpload, 
  isProcessing = false,
  compressionProgress = 0
}: MobileScannerProps) {
  const [mode, setMode] = useState<"home" | "camera" | "import-guide" | "scanning">("home");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      setMode("camera");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Unable to access camera. Please check permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMode("home");
    setIsRecording(false);
    setRecordingTime(0);
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    
    const mimeTypes = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4"
    ];
    
    let selectedMime = "video/webm";
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }
    
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: selectedMime,
      videoBitsPerSecond: 2500000 // 2.5 Mbps
    });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: selectedMime });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      onVideoCapture(blob, `scan-${timestamp}`);
      stopCamera();
    };
    
    mediaRecorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMode("home");
      onVideoUpload(file);
    }
  };

  // Scanning animation during processing
  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        {/* Laser scanning effect */}
        <div className="relative w-72 h-72 mb-8">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(255,110,60,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,110,60,0.3) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px"
            }} />
          </div>
          
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FF6E3C]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF6E3C]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FF6E3C]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FF6E3C]" />
          
          {/* Scanning laser line */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF6E3C] to-transparent"
            style={{ boxShadow: "0 0 20px #FF6E3C, 0 0 40px #FF6E3C" }}
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Scan className="w-16 h-16 text-[#FF6E3C]" />
            </motion.div>
          </div>
        </div>
        
        {/* Status text */}
        <motion.p
          className="text-xl font-bold text-white mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Scanning Reality...
        </motion.p>
        
        {/* Progress bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C]"
            initial={{ width: "0%" }}
            animate={{ width: `${compressionProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <p className="text-sm text-white/40 mt-3">
          {compressionProgress < 50 ? "Compressing video..." : "Uploading to AI..."}
        </p>
      </div>
    );
  }

  // Camera mode
  if (mode === "camera") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Camera preview */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <div className="text-center">
                <Camera className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-white mb-4">{cameraError}</p>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-white/10 rounded-xl text-white"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-500/90 rounded-full">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <span className="text-white font-mono font-bold">{formatTime(recordingTime)}</span>
            </div>
          )}
          
          {/* Scanning overlay */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers */}
              <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#FF6E3C]/60" />
              <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#FF6E3C]/60" />
              <div className="absolute bottom-32 left-8 w-16 h-16 border-b-2 border-l-2 border-[#FF6E3C]/60" />
              <div className="absolute bottom-32 right-8 w-16 h-16 border-b-2 border-r-2 border-[#FF6E3C]/60" />
              
              {/* Center crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-0.5 h-8 bg-[#FF6E3C]/40 absolute -top-4 left-1/2 -translate-x-1/2" />
                <div className="w-0.5 h-8 bg-[#FF6E3C]/40 absolute -bottom-4 left-1/2 -translate-x-1/2" />
                <div className="h-0.5 w-8 bg-[#FF6E3C]/40 absolute top-1/2 -left-4 -translate-y-1/2" />
                <div className="h-0.5 w-8 bg-[#FF6E3C]/40 absolute top-1/2 -right-4 -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="bg-black/90 backdrop-blur-xl p-6 pb-10 safe-area-bottom">
          <div className="flex items-center justify-center gap-8">
            {/* Close button */}
            <button
              onClick={stopCamera}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Record button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                isRecording 
                  ? "bg-red-500 scale-110" 
                  : "bg-[#FF6E3C] hover:scale-105"
              )}
            >
              {isRecording ? (
                <div className="w-8 h-8 rounded-sm bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-white" />
              )}
            </button>
            
            {/* Placeholder for symmetry */}
            <div className="w-14 h-14" />
          </div>
          
          <p className="text-center text-white/50 text-sm mt-4">
            {isRecording ? "Tap to stop recording" : "Point at any UI and tap to record"}
          </p>
        </div>
      </div>
    );
  }

  // Import guide mode
  if (mode === "import-guide") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button onClick={() => setMode("home")} className="p-2">
            <X className="w-6 h-6 text-white/60" />
          </button>
          <span className="text-white font-medium">Import Screen Recording</span>
          <div className="w-10" />
        </div>
        
        {/* Instruction video/animation */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Animated instruction */}
          <div className="relative w-48 h-80 bg-gradient-to-b from-white/10 to-white/5 rounded-[2rem] border-2 border-white/20 overflow-hidden mb-8">
            {/* Phone frame */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-black rounded-full" />
            
            {/* Animated gesture */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="flex flex-col items-center"
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
              >
                {/* Step 1: Swipe down */}
                <motion.div
                  className="w-10 h-10 rounded-full bg-[#FF6E3C]/80 flex items-center justify-center mb-2"
                  animate={{ y: [0, 40, 40, 0] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
                >
                  <ChevronRight className="w-6 h-6 text-white rotate-90" />
                </motion.div>
                
                {/* Step 2: Record button */}
                <motion.div
                  className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"
                  animate={{ scale: [0, 0, 1.2, 1, 0], opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.5, 0.7, 1] }}
                >
                  <div className="w-3 h-3 rounded-full bg-white" />
                </motion.div>
              </motion.div>
            </div>
          </div>
          
          {/* Instructions text */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white mb-2">How to Record Your Screen</h3>
            <div className="space-y-2 text-white/60">
              <p className="flex items-center justify-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] text-sm flex items-center justify-center">1</span>
                Swipe down from top-right corner
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] text-sm flex items-center justify-center">2</span>
                Tap the Record button 🔴
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] text-sm flex items-center justify-center">3</span>
                Navigate to any app, then stop
              </p>
            </div>
          </div>
          
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs py-4 px-6 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-[#FF6E3C]/30"
          >
            <Upload className="w-5 h-5" />
            Select from Library
          </button>
          
          <p className="text-white/30 text-sm mt-4">
            Supports MP4, MOV, WebM
          </p>
        </div>
        
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

  // Home mode - TWO BIG BUTTONS
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Minimal header */}
      <div className="flex items-center justify-center py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Replay</span>
        </div>
      </div>
      
      {/* Main content - Two big buttons */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Tagline */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">
            Scan any UI
          </h1>
          <p className="text-white/50">
            Turn real-world interfaces into code
          </p>
        </div>
        
        {/* PRIMARY: Scan Reality Button */}
        <motion.button
          onClick={startCamera}
          className="w-full max-w-sm aspect-[2/1] rounded-3xl bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex flex-col items-center justify-center gap-4 shadow-2xl shadow-[#FF6E3C]/30 relative overflow-hidden"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Animated background effect */}
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
            <span className="text-white/70 text-sm">Point camera at any interface</span>
          </div>
        </motion.button>
        
        {/* SECONDARY: Import Recording Button */}
        <motion.button
          onClick={() => setMode("import-guide")}
          className="w-full max-w-sm aspect-[2.5/1] rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-white/70" />
          </div>
          <span className="text-lg font-semibold text-white/80">Import Screen Recording</span>
          <span className="text-white/40 text-sm">For pixel-perfect quality</span>
        </motion.button>
        
        {/* Tip */}
        <p className="text-white/30 text-xs text-center mt-4 max-w-xs">
          Works like Shazam for UI. Point, scan, get code.
        </p>
      </div>
    </div>
  );
}
