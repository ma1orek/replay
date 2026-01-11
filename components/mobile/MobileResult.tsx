"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Lock, Share2, Download, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Code } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  
  // Share functionality
  const handleShare = async () => {
    if (navigator.share && previewUrl) {
      try {
        await navigator.share({
          title: `${videoName} - Built with Replay`,
          text: "Check out this UI I scanned with Replay!",
          url: previewUrl
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };
  
  const showBlur = !isAuthenticated;
  
  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={onNewScan} className="flex items-center gap-2 text-white/60">
          <RotateCcw className="w-5 h-5" />
          <span className="text-sm">New Scan</span>
        </button>
        
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-white font-medium">Reconstructed!</span>
        </div>
        
        <button onClick={handleShare} className="p-2">
          <Share2 className="w-5 h-5 text-white/60" />
        </button>
      </div>
      
      {/* Compare Slider */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* Original Video (Left side) */}
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
              <p className="text-white/30">Original Video</p>
            </div>
          )}
          
          {/* Label */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
            <span className="text-white/80 text-xs font-medium">ORIGINAL</span>
          </div>
        </div>
        
        {/* Generated Preview (Right side) - clipped */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className={cn(
                "w-full h-full border-0 bg-white",
                showBlur && "filter blur-lg"
              )}
              style={{ pointerEvents: showBlur ? "none" : "auto" }}
            />
          ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
              <p className="text-white/30">Generated Preview</p>
            </div>
          )}
          
          {/* Label */}
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#FF6E3C]/80 backdrop-blur-sm rounded-full">
            <span className="text-white text-xs font-medium">GENERATED</span>
          </div>
        </div>
        
        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* Handle grip */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-black -mr-1" />
            <ChevronRight className="w-4 h-4 text-black -ml-1" />
          </div>
        </div>
        
        {/* Auth Gate Overlay */}
        {showBlur && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center z-30"
            style={{ 
              left: `${sliderPosition}%`,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(4px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center p-6 max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#FF6E3C]/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#FF6E3C]" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                UI Reconstructed!
              </h3>
              <p className="text-white/60 text-sm mb-6">
                Sign up free to unlock the preview and download your code
              </p>
              
              <button
                onClick={onLogin}
                className="w-full py-4 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-xl text-white font-bold text-lg shadow-lg shadow-[#FF6E3C]/30"
              >
                Continue Free →
              </button>
              
              <p className="text-white/30 text-xs mt-3">
                No credit card required
              </p>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Bottom actions - only shown when authenticated */}
      {isAuthenticated && (
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* Code preview hint */}
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
            <Code className="w-4 h-4" />
            <span>Swipe to compare • Code ready to download</span>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Download Code
            </button>
            
            <button className="flex-1 py-3 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-xl text-white font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Edit with AI
            </button>
          </div>
          
          {/* Send to desktop hint */}
          <p className="text-center text-white/30 text-xs">
            Open replay.build on desktop for full editor
          </p>
        </div>
      )}
    </div>
  );
}
