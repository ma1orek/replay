"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, MousePointer2, Settings, Upload, Video, Wand2, Zap, Smartphone, Sparkles, Palette, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import StyleInjector from "@/components/StyleInjector";
import AuthModal from "@/components/modals/AuthModal";
import { usePendingFlow } from "../../providers";
import { useAuth } from "@/lib/auth/context";
import { FlipWords } from "@/components/ui/flip-words";
import { GlowCard } from "@/components/ui/spotlight-card";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { useIsMobile } from "@/lib/useIsMobile";

function useSupportedRecorderMime() {
  return useMemo(() => {
    if (typeof window === "undefined") return "";
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    return candidates.find((t) => {
      try {
        return (window as any).MediaRecorder?.isTypeSupported?.(t);
      } catch {
        return false;
      }
    }) || "";
  }, []);
}

export default function LandingHero() {
  const router = useRouter();
  const { setPending } = usePendingFlow();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileCameraChunksRef = useRef<Blob[]>([]);
  const mobileCameraTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mimeType = useSupportedRecorderMime();

  const [heroFlow, setHeroFlow] = useState<{ blob: Blob | null; name: string; previewUrl: string | null }>({
    blob: null,
    name: "",
    previewUrl: null,
  });
  const [context, setContext] = useState("");
  const [styleDirective, setStyleDirective] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const [styleReferenceImage, setStyleReferenceImage] = useState<{ url: string; name: string } | null>(null);
  const [showMobileRecordingInfo, setShowMobileRecordingInfo] = useState(false);
  const [showMobileCamera, setShowMobileCamera] = useState(false);
  const [mobileRecordingTime, setMobileRecordingTime] = useState(0);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  const DEMOS = [
    { id: 'dashboard', src: '/dashboard (1).mp4', title: 'SaaS Dashboard', subtitle: 'Analytics & Charts' },
    { id: 'yc', src: '/yc (1).mp4', title: 'YC Directory', subtitle: 'Startup Listings' },
    { id: 'landing', src: '/lp (1).mp4', title: 'Landing Page', subtitle: 'Marketing Site' }
  ];

  const checkIsMobile = useCallback(() => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);

  const setFlowBlob = useCallback((blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    setHeroFlow((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { blob, name, previewUrl: url };
    });
  }, []);

  const onBrowse = useCallback(() => fileInputRef.current?.click(), []);
  const onFile = useCallback((file: File) => {
    setFlowBlob(file, file.name.replace(/\.[^/.]+$/, "") || "Flow");
  }, [setFlowBlob]);

  const startRecording = useCallback(async () => {
    if (checkIsMobile()) {
      setShowMobileRecordingInfo(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "video/webm" });
        setFlowBlob(blob, "Recording");
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(250);
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }, [mimeType, setFlowBlob, checkIsMobile]);

  const stopRecording = useCallback(() => {
    try {
      recorderRef.current?.requestData?.();
      recorderRef.current?.stop();
    } catch {}
  }, []);

  // Mobile camera functions
  const startMobileCamera = useCallback(async () => {
    try {
      setShowMobileCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
        audio: false
      });
      streamRef.current = stream;
      if (mobileVideoRef.current) {
        mobileVideoRef.current.srcObject = stream;
        mobileVideoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setShowMobileCamera(false);
    }
  }, []);

  const stopMobileCamera = useCallback(() => {
    if (mobileCameraTimerRef.current) clearInterval(mobileCameraTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowMobileCamera(false);
    setIsRecording(false);
    setMobileRecordingTime(0);
  }, []);

  const startMobileCameraRecording = useCallback(() => {
    if (!streamRef.current) return;
    mobileCameraChunksRef.current = [];
    
    const mimeTypes = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
    let mime = "video/webm";
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) { mime = m; break; }
    }
    
    const recorder = new MediaRecorder(streamRef.current, { mimeType: mime, videoBitsPerSecond: 2500000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) mobileCameraChunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      if (mobileCameraChunksRef.current.length > 0) {
        const blob = new Blob(mobileCameraChunksRef.current, { type: mime });
        // Save to pending flow and redirect to tool
        await setPending({
          blob,
          name: "Recording",
          context: context.trim(),
          styleDirective: styleDirective?.trim() || "Auto-Detect",
          createdAt: Date.now(),
        });
        stopMobileCamera();
        router.push("/tool");
      } else {
        stopMobileCamera();
      }
    };
    
    recorderRef.current = recorder;
    recorder.start(500);
    setIsRecording(true);
    mobileCameraTimerRef.current = setInterval(() => setMobileRecordingTime(p => p + 1), 1000);
  }, [stopMobileCamera, setPending, router, context, styleDirective]);

  const stopMobileCameraRecording = useCallback(() => {
    if (mobileCameraTimerRef.current) clearInterval(mobileCameraTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecording(false);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Cleanup mobile camera on unmount
  useEffect(() => {
    return () => {
      if (mobileCameraTimerRef.current) clearInterval(mobileCameraTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const canSend = !!heroFlow.blob;

  const onSend = useCallback(async () => {
    if (!heroFlow.blob) return;
    
    await setPending({
      blob: heroFlow.blob,
      name: heroFlow.name || "Flow",
      context: context.trim(),
      styleDirective: styleDirective?.trim() || "Auto-Detect",
      createdAt: Date.now(),
    });
    
    if (user) {
      router.push("/tool");
    } else {
      setPendingRedirect(true);
      setShowAuthModal(true);
    }
  }, [context, heroFlow.blob, heroFlow.name, router, setPending, styleDirective, user]);

  useEffect(() => {
    if (user && pendingRedirect) {
      setPendingRedirect(false);
      router.push("/tool");
    }
  }, [user, pendingRedirect, router]);

  const handleDemoSelect = async (demo: typeof DEMOS[0]) => {
    setSelectedDemo(demo.id);
    setLoadingDemo(demo.id);
    router.push(`/tool?demo=${demo.id}`);
  };

  // Mobile camera overlay
  if (showMobileCamera) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        <video ref={mobileVideoRef} className="flex-1 object-cover" playsInline muted autoPlay />
        
        {isRecording && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-600 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-white font-mono text-sm font-bold">{formatTime(mobileRecordingTime)}</span>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 pb-10 pt-16 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex items-center justify-center gap-10">
            <button onClick={stopMobileCamera} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            {isRecording ? (
              <button onClick={stopMobileCameraRecording} className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center">
                <div className="w-8 h-8 rounded-sm bg-white" />
              </button>
            ) : (
              <button onClick={startMobileCameraRecording} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
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
    <div className="relative w-full">
      <div className="relative z-10 text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-center mb-6 text-white leading-[1.15]">
          <span className="block md:inline">Turn Video into </span>
          <span className="inline-block" style={{ minWidth: "max-content" }}>
            <FlipWords 
              words={["Production-Ready Code", "Stunning Interfaces", "Modern Web Apps", "High-Converting Pages"]}
              duration={3000}
              className="text-[#FF6E3C] whitespace-nowrap"
            />
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-400 text-center max-w-2xl mx-auto leading-relaxed mb-12">
          Tired of writing mega-prompts and pasting screenshots? Stop describing the interaction. Just record it. Transform video into clean React & Tailwind code instantly.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative w-full max-w-3xl mx-auto z-10 pb-8"
      >
        <div className="relative max-w-3xl mx-auto">
          {/* Główny Box - Wrapped in GlowCard for requested style */}
          <GlowCard className="p-2 overflow-hidden" glowColor="orange" customSize>
            
            {/* Main Upload Panel - Premium Dark Design */}
            <div className="rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-sm p-5 md:p-6 pb-4 md:pb-5 flex flex-col gap-3">
              
              {/* 1. DROPZONE - Clean, Minimal */}
              <div
                className={cn(
                  "relative rounded-xl bg-black/40 py-12 px-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 group overflow-hidden",
                  isDragging && "bg-[#FF6E3C]/5"
                )}
                onClick={onBrowse}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    setSelectedDemo(null);
                    onFile(file);
                  }
                }}
              >
                {/* Subtle glow effect on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                  isDragging && "opacity-100"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FF6E3C]/5 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#FF6E3C]/30 to-transparent" />
                </div>
                
                {heroFlow.blob && heroFlow.previewUrl ? (
                  <div className="w-full max-w-sm aspect-video rounded-lg overflow-hidden border border-white/10 relative group/video">
                    <video 
                      src={heroFlow.previewUrl} 
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium">Click to replace</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeroFlow({ blob: null, name: "", previewUrl: null });
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500/80 rounded-md text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ) : isMobile ? (
                  /* MOBILE: Two-section layout like tool */
                  <div className="w-full rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] overflow-hidden">
                    <div className="flex">
                      <button
                        onClick={(e) => { e.stopPropagation(); startMobileCamera(); }}
                        className="flex-1 flex flex-col items-center justify-center py-8 border-r border-white/10 active:bg-white/5"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#FF6E3C]/10 flex items-center justify-center mb-2.5">
                          <Camera className="w-6 h-6 text-[#FF6E3C]" />
                        </div>
                        <span className="text-white/80 font-medium text-sm">Record</span>
                        <span className="text-white/30 text-[11px] mt-0.5">Record any video</span>
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); onBrowse(); }}
                        className="flex-1 flex flex-col items-center justify-center py-8 active:bg-white/5"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-2.5">
                          <Upload className="w-6 h-6 text-white/60" />
                        </div>
                        <span className="text-white/80 font-medium text-sm">Upload</span>
                        <span className="text-white/30 text-[11px] mt-0.5">Screen recording</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* DESKTOP: Original drop zone layout */
                  <>
                    <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white/50" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white/80">Drop video here</p>
                      <p className="text-xs text-white/50 mt-1 font-mono">or click to browse</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onBrowse(); }}
                        className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all flex items-center gap-1.5 border border-white/[0.06]"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); isRecording ? stopRecording() : startRecording(); }}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 border",
                          isRecording 
                            ? "bg-red-500/10 border-red-500/30 text-red-400" 
                            : "bg-white/[0.04] border-white/[0.06] text-white/60 hover:bg-white/[0.08] hover:text-white/80"
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full bg-red-500", isRecording && "animate-pulse")} />
                        {isRecording ? "Stop" : "Record"}
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* 2. CONFIGURATION - Simple text link */}
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-1.5 flex items-center justify-center gap-1.5 text-white/40 hover:text-white/60 transition-colors text-xs"
              >
                <Settings className="w-3 h-3" />
                <span>Configuration & Context</span>
                <ChevronDown className={cn(
                  "w-3 h-3 transition-transform duration-300",
                  showAdvanced && "rotate-180"
                )} />
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-black/30 rounded-xl border border-white/[0.06] space-y-4 mb-3">
                      {/* Context Input */}
                      <div>
                        <label className="flex items-center gap-2 text-xs text-white/50 mb-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          CONTEXT
                        </label>
                        <textarea
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          placeholder="Add data logic, constraints or details. Replay works without it — context just sharpens the result (optional)"
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 transition-colors resize-none"
                        />
                      </div>
                      
                      {/* Style Dropdown */}
                      <div>
                        <label className="flex items-center gap-2 text-xs text-white/50 mb-2">
                          <Palette className="w-3.5 h-3.5" />
                          STYLE
                        </label>
                        <StyleInjector
                          value={styleDirective}
                          onChange={setStyleDirective}
                          onReferenceImageChange={setStyleReferenceImage}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 3. RECONSTRUCT BUTTON - Premium with Glow */}
              <div className="relative mt-1">
                {/* Animated glow under button */}
                {heroFlow.blob && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6E3C] to-[#FF8C5C] rounded-xl blur-lg opacity-40 group-hover:opacity-60 animate-pulse" />
                )}
                <button
                  onClick={onSend}
                  disabled={!heroFlow.blob}
                  className={cn(
                    "relative w-full h-14 rounded-xl font-semibold text-base transition-all duration-200",
                    heroFlow.blob 
                      ? "bg-[#FF6E3C] text-white hover:bg-[#FF7E4C] active:scale-[0.98] shadow-lg shadow-[#FF6E3C]/20"
                      : "bg-white/[0.03] border border-white/10 text-white/30 cursor-not-allowed"
                  )}
                >
                  <span className="relative flex items-center justify-center gap-2.5">
                    {/* Replay Logo - Outline version */}
                    <svg width="18" height="22" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="currentColor" strokeWidth="8" strokeLinejoin="round"/>
                      <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" fill="currentColor"/>
                    </svg>
                    Reconstruct
                  </span>
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setSelectedDemo(null);
                    onFile(f);
                  }
                  e.currentTarget.value = "";
                }}
              />
            </div>
          </GlowCard>
          
          {/* Separated "No video?" section */}
          <div className="mt-6 border-t border-white/[0.05] pt-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <span className="text-sm text-gray-500 font-mono uppercase tracking-wide">
                <span className="font-bold text-gray-400">No video?</span> Try instant examples:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {DEMOS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleDemoSelect(demo)}
                    disabled={loadingDemo === demo.id}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap flex items-center gap-2",
                      selectedDemo === demo.id 
                        ? "bg-[#FF6E3C]/10 border-[#FF6E3C] text-[#FF6E3C]" 
                        : "bg-black/50 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    {loadingDemo === demo.id && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    {demo.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </motion.div>

      {/* Auth Modal for recording/upload flow */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        title="Sign in to continue"
        description="Sign in to generate code from your video recording."
      />

      {/* Mobile Recording Info Modal - Static, no animations */}
      {showMobileRecordingInfo && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF6E3C]/20 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-[#FF6E3C]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Use your phone's recorder</h3>
                  <p className="text-xs text-white/50 mt-0.5">Browser recording unavailable on mobile</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-white/70 bg-white/5 rounded-xl p-4">
                <p className="font-medium text-white">How to record your screen:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Use your phone's built-in screen recorder</li>
                  <li>Record the app/website you want to convert</li>
                  <li>Come back here and upload the video</li>
                </ol>
                <div className="pt-3 border-t border-white/10 space-y-1 text-xs text-white/50">
                  <p><span className="text-white/70">iOS:</span> Control Center → Screen Recording</p>
                  <p><span className="text-white/70">Android:</span> Quick Settings → Screen Record</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMobileRecordingInfo(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
                >
                  Got it
                </button>
                <button
                  onClick={() => { setShowMobileRecordingInfo(false); fileInputRef.current?.click(); }}
                  className="flex-1 py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
