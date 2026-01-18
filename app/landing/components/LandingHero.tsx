"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Upload, Smartphone, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Simplified context/style as requested - minimal UI
  const [isRecording, setIsRecording] = useState(false);
  const [showMobileRecordingInfo, setShowMobileRecordingInfo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 min-h-[80vh] py-10">
        {/* LEFT SIDE: Text (60%) */}
        <div className="w-full lg:w-[60%] text-left space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]"
          >
            Make real interfaces <br />
            <span className="text-white/40 font-serif italic">from what you see</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-xl leading-relaxed font-light"
          >
            Replay turns UI videos into production-ready React code — with clarity, accuracy, and zero guesswork.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 pt-2"
          >
            <button 
              onClick={() => router.push("/tool")}
              className="px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              Try Replay Free <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-500">
              <Check className="w-4 h-4 text-green-500" /> No credit card required
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDE: Upload (40%) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full lg:w-[40%]"
        >
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden group">
             {/* Glow effect */}
             <div className="absolute -inset-1 bg-gradient-to-br from-white/5 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             
             <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Try Replay on a real interface</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Upload a screen recording — or explore a real example below. 
                    You’ll see the full output: preview, code, flow, and design system.
                  </p>
                </div>

                {/* Dropzone */}
                <div
                  className={cn(
                    "relative rounded-2xl bg-black/50 border-2 border-dashed border-white/10 py-12 px-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 hover:border-white/20 hover:bg-white/5",
                    isDragging && "border-[#FF6E3C] bg-[#FF6E3C]/5"
                  )}
                  onClick={onBrowse}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) onFile(file);
                  }}
                >
                  {heroFlow.blob && heroFlow.previewUrl ? (
                    <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 relative group/video">
                      <video 
                        src={heroFlow.previewUrl} 
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroFlow({ blob: null, name: "", previewUrl: null });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500/80 rounded-full text-white transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <Upload className="w-8 h-8 text-white/40" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-white">Drop video here</p>
                        <p className="text-sm text-white/40 mt-1">or click to browse</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                     onClick={onBrowse}
                     className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button
                     onClick={isRecording ? stopRecording : startRecording}
                     className={cn(
                       "py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
                       isRecording ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/10 hover:bg-white/20 text-white"
                     )}
                  >
                     {isRecording ? (
                       <>
                         <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Stop
                       </>
                     ) : (
                       <>
                         <div className="w-2 h-2 rounded-full bg-red-500" /> Record
                       </>
                     )}
                  </button>
                </div>
                
                <p className="text-xs text-center text-white/30 pt-2">
                  You’ll be asked to create a free account before reconstruction.
                </p>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile Info */}
      {showMobileRecordingInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
              <Smartphone className="w-12 h-12 text-[#FF6E3C] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Record on Mobile</h3>
              <p className="text-gray-400 text-sm mb-6">Use your phone's screen recorder, then upload the video here.</p>
              <button 
                onClick={() => setShowMobileRecordingInfo(false)}
                className="w-full py-3 bg-white text-black rounded-xl font-bold"
              >
                Got it
              </button>
           </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}