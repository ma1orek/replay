"use client";

import { useState, useRef, useEffect } from "react";
import { Lock, Smartphone, Monitor, ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileResultProps {
  videoBlob: Blob | null;
  previewUrl: string | null;
  generatedCode: string | null;
  isAuthenticated: boolean;
  onLogin: () => void;
  onNewScan: () => void;
  videoName: string;
}

export default function MobileResult({
  videoBlob,
  previewUrl,
  generatedCode,
  isAuthenticated,
  onLogin,
  onNewScan,
  videoName
}: MobileResultProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Create video URL
  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);
  
  // Auto-play video
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);
  
  // Handle slider drag
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleSliderMove(e.touches[0].clientX);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  };
  
  const showBlur = !isAuthenticated;
  
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Compare Slider - Full screen */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* Original Video (Left/Bottom side) */}
        <div className="absolute inset-0">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              loop
              muted
              playsInline
              autoPlay
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
              <p className="text-white/30">Original</p>
            </div>
          )}
        </div>
        
        {/* Generated Preview (Right/Top side) - clipped */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className={`w-full h-full border-0 bg-white ${showBlur ? "filter blur-xl" : ""}`}
              style={{ pointerEvents: showBlur ? "none" : "auto" }}
            />
          ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
              <p className="text-white/30">Generated</p>
            </div>
          )}
        </div>
        
        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* Handle grip */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-black -mr-1" />
            <ChevronRight className="w-4 h-4 text-black -ml-1" />
          </div>
        </div>
        
        {/* Labels */}
        <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
          <span className="text-white/70 text-xs font-medium">Original</span>
        </div>
        <div className="absolute top-6 right-6 px-3 py-1.5 bg-[#FF6E3C]/80 backdrop-blur-sm rounded-full">
          <span className="text-white text-xs font-medium">Generated</span>
        </div>
        
        {/* Auth Gate Overlay - only on generated side */}
        {showBlur && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center z-30"
            style={{ 
              left: `${sliderPosition}%`,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center p-6 max-w-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6E3C]/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-[#FF6E3C]" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                UI Reconstructed!
              </h3>
              <p className="text-white/50 text-sm mb-6">
                Sign up to unlock the preview
              </p>
              
              <button
                onClick={onLogin}
                className="w-full py-4 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-xl text-white font-bold shadow-lg shadow-[#FF6E3C]/30"
              >
                Continue Free
              </button>
              
              <p className="text-white/30 text-xs mt-3">No credit card required</p>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Bottom action bar - only when authenticated */}
      {isAuthenticated && (
        <div className="relative z-10 p-4 pb-8 bg-black border-t border-white/5">
          <button
            onClick={() => setShowHandoffModal(true)}
            className="w-full py-4 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-xl text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-[#FF6E3C]/20"
          >
            Save & Edit on Desktop
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={onNewScan}
            className="w-full py-3 mt-3 text-white/50 text-sm"
          >
            Scan another
          </button>
        </div>
      )}
      
      {/* Handoff Modal */}
      <AnimatePresence>
        {showHandoffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHandoffModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 p-6 pb-10"
            >
              {/* Close button */}
              <button
                onClick={() => setShowHandoffModal(false)}
                className="absolute top-4 right-4 p-2"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
              
              {/* Icon row */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-[#FF6E3C]" />
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-6 h-6 text-white/30" />
                </motion.div>
                <div className="w-14 h-14 rounded-2xl bg-[#FF6E3C]/20 flex items-center justify-center">
                  <Monitor className="w-7 h-7 text-[#FF6E3C]" />
                </div>
              </div>
              
              {/* Text */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Project Synced! 🚀
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Full code editor is available on Desktop.
                  <br />
                  Open <span className="text-[#FF6E3C] font-medium">replay.build</span> on your computer to edit logic, export code, and refine styles.
                </p>
              </div>
              
              {/* Action */}
              <button
                onClick={() => {
                  setShowHandoffModal(false);
                  onNewScan();
                }}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium"
              >
                OK, Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
