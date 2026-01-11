"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Scan, Zap, ChevronRight, Square, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MobileScannerProps {
  onVideoCapture: (blob: Blob, name: string) => void;
  onVideoUpload: (file: File) => void;
  isProcessing?: boolean;
  compressionProgress?: number;
  onShowImportGuide?: () => void;
}

export default function MobileScanner({ 
  onVideoCapture, 
  onVideoUpload, 
  isProcessing = false,
  compressionProgress = 0,
}: MobileScannerProps) {
  const [mode, setMode] = useState<"home" | "camera" | "import-guide">("home");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  
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
      setCameraReady(false);
      setMode("camera");
      
      // Request camera with fallback
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
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
      setCameraError("Camera access denied. Check permissions in browser settings.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
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
    setCameraReady(false);
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current || !cameraReady) return;
    
    chunksRef.current = [];
    setRecordingTime(0);
    
    // Find supported mime type
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
    
    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMime,
        videoBitsPerSecond: 2000000
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: selectedMime });
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
          onVideoCapture(blob, `scan-${timestamp}`);
        }
        stopCamera();
      };
      
      recorder.onerror = (e) => {
        console.error("Recorder error:", e);
        stopCamera();
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start(500); // Collect data every 500ms
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Recording error:", err);
      setCameraError("Failed to start recording");
    }
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
    setIsRecording(false);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Handle file upload - SIMPLE VERSION
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setMode("home");
      onVideoUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Scanning animation during processing
  if (isProcessing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-6">
        {/* Laser scanning effect */}
        <div className="relative w-64 h-64 mb-8">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              linear-gradient(rgba(255,110,60,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,110,60,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px"
          }} />
          
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
          Scanning...
        </motion.p>
        
        {/* Progress bar */}
        <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C]"
            style={{ width: `${Math.max(5, compressionProgress)}%` }}
          />
        </div>
        
        <p className="text-sm text-white/40 mt-3">
          {compressionProgress < 30 ? "Compressing video..." : compressionProgress < 80 ? "Uploading..." : "Processing..."}
        </p>
      </div>
    );
  }

  // Camera mode - FULLSCREEN
  if (mode === "camera") {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        {/* Camera preview */}
        <div className="flex-1 relative bg-black">
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
                <Camera className="w-12 h-12 text-white/30 mx-auto mb-4 animate-pulse" />
                <p className="text-white/50">Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
              <div className="text-center">
                <Camera className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-white mb-4">{cameraError}</p>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-white/10 rounded-xl text-white font-medium"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
          
          {/* Recording indicator - TOP */}
          {isRecording && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full shadow-lg">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <span className="text-white font-mono font-bold text-lg">{formatTime(recordingTime)}</span>
            </div>
          )}
          
          {/* Scanning overlay when ready */}
          {cameraReady && !cameraError && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers */}
              <div className="absolute top-12 left-6 w-16 h-16 border-t-2 border-l-2 border-[#FF6E3C]/80" />
              <div className="absolute top-12 right-6 w-16 h-16 border-t-2 border-r-2 border-[#FF6E3C]/80" />
              <div className="absolute bottom-40 left-6 w-16 h-16 border-b-2 border-l-2 border-[#FF6E3C]/80" />
              <div className="absolute bottom-40 right-6 w-16 h-16 border-b-2 border-r-2 border-[#FF6E3C]/80" />
            </div>
          )}
        </div>
        
        {/* Controls - BOTTOM BAR */}
        <div className="bg-black p-6 pb-10 border-t border-white/10">
          <div className="flex items-center justify-around max-w-xs mx-auto">
            {/* Close button */}
            <button
              onClick={stopCamera}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
            >
              <X className="w-7 h-7 text-white" />
            </button>
            
            {/* Record / Stop button - BIG */}
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/50 active:scale-95 transition-transform"
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={!cameraReady}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                  cameraReady 
                    ? "bg-[#FF6E3C] shadow-lg shadow-[#FF6E3C]/50 active:scale-95" 
                    : "bg-white/20"
                )}
              >
                <Circle className="w-16 h-16 text-white stroke-[3]" />
              </button>
            )}
            
            {/* Spacer for symmetry */}
            <div className="w-14 h-14" />
          </div>
          
          <p className="text-center text-white/50 text-sm mt-4">
            {isRecording ? "Tap square to stop" : cameraReady ? "Tap circle to record" : "Waiting for camera..."}
          </p>
        </div>
      </div>
    );
  }

  // Import guide mode
  if (mode === "import-guide") {
    return (
      <div className="flex-1 flex flex-col bg-black">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button onClick={() => setMode("home")} className="p-2 -ml-2">
            <X className="w-6 h-6 text-white/60" />
          </button>
          <span className="text-white font-medium">Import Recording</span>
          <div className="w-10" />
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Animated phone instruction */}
          <div className="relative w-40 h-72 bg-gradient-to-b from-white/10 to-white/5 rounded-[2rem] border-2 border-white/20 overflow-hidden mb-8">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-black rounded-full" />
            
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <motion.div
                className="w-8 h-8 rounded-full bg-[#FF6E3C] flex items-center justify-center mb-2"
                animate={{ y: [0, 30, 30, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <ChevronRight className="w-5 h-5 text-white rotate-90" />
              </motion.div>
              
              <motion.div
                className="w-6 h-6 rounded-full bg-red-500"
                animate={{ scale: [0, 0, 1.2, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.25, 0.5, 0.75, 1] }}
              />
            </motion.div>
          </div>
          
          {/* Instructions */}
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold text-white mb-4">How to Record Screen</h3>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] text-sm flex items-center justify-center font-bold">1</span>
                <span className="text-white/70">Swipe down from top-right</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] text-sm flex items-center justify-center font-bold">2</span>
                <span className="text-white/70">Tap Record 🔴</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] text-sm flex items-center justify-center font-bold">3</span>
                <span className="text-white/70">Navigate any app, then stop</span>
              </div>
            </div>
          </div>
          
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs py-4 px-6 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-[#FF6E3C]/30 active:scale-[0.98] transition-transform"
          >
            <Upload className="w-5 h-5" />
            Select from Library
          </button>
          
          <p className="text-white/30 text-sm mt-4">MP4, MOV, WebM supported</p>
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
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-center py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Replay</span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        {/* Tagline */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-white mb-1">Scan any UI</h1>
          <p className="text-white/50 text-sm">Turn interfaces into code</p>
        </div>
        
        {/* PRIMARY: Scan Reality Button */}
        <motion.button
          onClick={startCamera}
          className="w-full max-w-sm aspect-[2.2/1] rounded-3xl bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex flex-col items-center justify-center gap-3 shadow-2xl shadow-[#FF6E3C]/30 relative overflow-hidden active:scale-[0.98] transition-transform"
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SCAN REALITY</span>
            <span className="text-white/70 text-xs">Point camera at any interface</span>
          </div>
        </motion.button>
        
        {/* SECONDARY: Import Recording Button */}
        <motion.button
          onClick={() => setMode("import-guide")}
          className="w-full max-w-sm aspect-[3/1] rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 active:bg-white/10 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-white/70" />
          </div>
          <span className="text-base font-semibold text-white/80">Import Screen Recording</span>
          <span className="text-white/40 text-xs">For pixel-perfect quality</span>
        </motion.button>
        
        {/* Tip */}
        <p className="text-white/25 text-xs text-center mt-2">
          Like Shazam for UI — scan, get code
        </p>
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
