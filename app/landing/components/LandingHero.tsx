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
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  const DEMOS = [
    {
      id: 'dashboard',
      src: '/dashboardvid.mp4',
      title: 'SaaS Dashboard',
      flowId: 'flow_1768474261072_uclbwqzdc',
      from: 'Legacy SaaS Dashboard',
      to: 'Modern Analytics Tool',
      tag: 'Visual Refactor'
    },
    {
      id: 'yc',
      src: '/ycvid.mp4',
      title: 'YC Directory',
      flowId: 'flow_1768470467213_35dvc8tap',
      from: 'YC Directory',
      to: 'Next-Gen Layout',
      tag: 'Style Injection'
    },
    {
      id: 'landing',
      src: '/lpvid.mp4',
      title: 'Landing Page',
      flowId: null,
      from: 'Generic Landing Page',
      to: 'World-Class Design',
      tag: 'UX/UI Upgrade'
    }
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

  // Mobile: Go to tool with camera mode
  const startMobileCamera = useCallback(() => {
    // Navigate to tool with camera=true param to auto-open camera there
    router.push("/tool?camera=true");
  }, [router]);


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
    // If demo has a specific flowId, use it; otherwise use the demo id
    if (demo.flowId) {
      router.push(`/tool?demo=${demo.flowId}`);
    } else {
      router.push(`/tool?demo=${demo.id}`);
    }
  };

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
          
          {/* THE UNIFIED MASTER CONSOLE */}
          <div className="relative">
            {/* Ambient glow behind the console */}
            <div className="absolute -inset-4 bg-gradient-to-b from-[#FF6E3C]/5 via-[#FF6E3C]/3 to-transparent rounded-[40px] blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-32 bg-[#FF6E3C]/10 blur-[80px] pointer-events-none" />
            
            {/* Main Console Container - Premium Glassmorphism */}
            <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] via-white/[0.02] to-black/40 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
              
              {/* Inner highlight edge */}
              <div className="absolute inset-[1px] rounded-[23px] border border-white/[0.05] pointer-events-none" />
              
              {/* === UPPER SECTION: Upload Panel === */}
              <div className="p-3 pb-0">
                
                {/* DROPZONE */}
                <div
                  className={cn(
                    "relative rounded-2xl bg-black/50 border border-white/[0.06] py-8 px-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 group overflow-hidden",
                    isDragging && "border-[#FF6E3C]/40 bg-[#FF6E3C]/5"
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
                  {heroFlow.blob && heroFlow.previewUrl ? (
                    <div className="w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-white/10 relative group/video">
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
                    <div className="w-full flex gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); startMobileCamera(); }}
                        className="flex-1 flex flex-col items-center justify-center py-8 rounded-xl bg-[#FF6E3C]/5 border border-[#FF6E3C]/20 active:bg-[#FF6E3C]/10 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-[#FF6E3C]/10 flex items-center justify-center mb-2.5">
                          <Camera className="w-7 h-7 text-[#FF6E3C]" />
                        </div>
                        <span className="text-white/90 font-semibold text-sm">Record</span>
                        <span className="text-white/40 text-[11px] mt-0.5">Any video</span>
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); onBrowse(); }}
                        className="flex-1 flex flex-col items-center justify-center py-8 rounded-xl bg-white/[0.02] border border-white/10 active:bg-white/5 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-2.5">
                          <Upload className="w-7 h-7 text-white/60" />
                        </div>
                        <span className="text-white/90 font-semibold text-sm">Upload</span>
                        <span className="text-white/40 text-[11px] mt-0.5">Recording</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <Upload className="w-7 h-7 text-white/50" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white/90">Drop video here</p>
                        <p className="text-sm text-white/50 mt-1">or click to browse</p>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onBrowse(); }}
                          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white transition-all flex items-center gap-2 border border-white/[0.08]"
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); isRecording ? stopRecording() : startRecording(); }}
                          className={cn(
                            "px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border",
                            isRecording 
                              ? "bg-red-500/10 border-red-500/30 text-red-400" 
                              : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:text-white"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full bg-red-500", isRecording && "animate-pulse")} />
                          {isRecording ? "Stop" : "Record"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* CONFIGURATION */}
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full py-4 flex items-center justify-center gap-1.5 text-white/40 hover:text-white/60 transition-colors text-xs"
                >
                  <Settings className="w-3 h-3" />
                  <span>Configuration & Context</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", showAdvanced && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden w-full"
                    >
                      <div className="p-4 bg-black/30 rounded-xl border border-white/[0.06] space-y-4 mb-3">
                        <div className="w-full">
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
                        
                        <div className="w-full">
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

                {/* RECONSTRUCT BUTTON */}
                <div className="relative">
                  {heroFlow.blob && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6E3C] to-[#FF8C5C] rounded-xl blur-lg opacity-40 animate-pulse" />
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
              
              {/* === INTEGRATED SEPARATOR === */}
              <div className="relative py-5">
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-center justify-center">
                  <span className="flex items-center gap-2 text-sm bg-[#0a0a0a] px-4 relative z-10">
                    <Video className="w-4 h-4 text-[#FF6E3C]" />
                    <span className="font-semibold text-white">NO VIDEO?</span>
                    <span className="text-white/50">Try examples</span>
                  </span>
                </div>
              </div>
              
              {/* === LOWER SECTION: Demo Grid with borders === */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 pt-0">
                {DEMOS.map((demo, index) => (
                  <button
                    key={demo.id}
                    onClick={() => handleDemoSelect(demo)}
                    disabled={loadingDemo === demo.id}
                    className={cn(
                      "group relative text-left transition-all duration-300 overflow-hidden rounded-xl",
                      "border border-white/10 hover:border-white/20",
                      selectedDemo === demo.id && "border-[#FF6E3C]/50"
                    )}
                  >
                    {/* Cinematic hover glow */}
                    <div className="absolute inset-x-0 -bottom-4 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl bg-[#FF6E3C]/20" />
                    
                    {/* Video preview with fade overlay */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-xl">
                      <video 
                        src={demo.src}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                      {/* Gradient fade overlay for text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      
                      {/* Tag on video - Dark background with orange text */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-black/90 border border-white/10 text-[#FF6E3C]">
                          {demo.tag}
                        </span>
                      </div>
                      
                      {/* Transformation text on video */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[11px] text-white/50 mb-0.5">{demo.from}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#FF6E3C] text-xs font-bold">→</span>
                          <p className="text-xs font-semibold text-white">{demo.to}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Loading indicator */}
                    {loadingDemo === demo.id && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-xl">
                        <div className="w-6 h-6 border-2 border-[#FF6E3C] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
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
