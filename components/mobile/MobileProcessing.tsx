"use client";

import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileProcessingProps {
  progress: number;
  message: string;
  videoBlob: Blob | null;
  onCancel: () => void;
}

// Terminal-style status messages
const STATUS_MESSAGES = [
  "> Compressing stream...",
  "> Analyzing layout...",
  "> Detecting components...",
  "> Extracting colors...",
  "> Mapping typography...",
  "> Building hierarchy...",
  "> Generating Tailwind classes...",
  "> Constructing React tree...",
  "> Optimizing output...",
  "> Finalizing code...",
];

export default function MobileProcessing({ progress, message, videoBlob, onCancel }: MobileProcessingProps) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Extract first frame from video as background
  useEffect(() => {
    if (!videoBlob) return;
    
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    
    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    
    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };
    
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setFrameUrl(canvas.toDataURL("image/jpeg", 0.6));
      }
      URL.revokeObjectURL(url);
    };
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoBlob]);
  
  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Background - First frame, dimmed */}
      {frameUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{ 
            backgroundImage: `url(${frameUrl})`,
            filter: "brightness(0.25)",
          }}
        />
      )}
      
      {/* Cancel button - top right */}
      <button 
        onClick={onCancel}
        className="absolute top-6 right-6 z-30 p-3 rounded-full bg-white/5 backdrop-blur-sm"
      >
        <X className="w-5 h-5 text-white/50" />
      </button>
      
      {/* Laser Scanner Effect */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main horizontal laser */}
        <motion.div
          className="absolute left-0 right-0 h-0.5"
          style={{ 
            background: "linear-gradient(90deg, transparent 0%, #FF6E3C 20%, #FF6E3C 80%, transparent 100%)",
            boxShadow: "0 0 20px 2px #FF6E3C, 0 0 60px 4px rgba(255,110,60,0.5)"
          }}
          animate={{ 
            top: ["5%", "95%", "5%"] 
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        
        {/* Trailing glow effect */}
        <motion.div
          className="absolute left-0 right-0 h-32 opacity-20"
          style={{ 
            background: "linear-gradient(to bottom, #FF6E3C 0%, transparent 100%)"
          }}
          animate={{ 
            top: ["5%", "95%", "5%"] 
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        
        {/* Digital noise particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#FF6E3C]"
            style={{
              left: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              top: ["10%", "90%"],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }}
          />
        ))}
        
        {/* Grid overlay for "digital" feel */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,110,60,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,110,60,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }}
        />
      </div>
      
      {/* Bottom status section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        {/* Terminal-style status */}
        <div className="font-mono text-sm mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessageIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="text-[#FF6E3C]"
            >
              {STATUS_MESSAGES[currentMessageIndex]}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                _
              </motion.span>
            </motion.p>
          </AnimatePresence>
        </div>
        
        {/* Progress bar */}
        <div className="relative">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, progress)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Progress percentage */}
          <p className="text-white/30 text-xs mt-2 text-right font-mono">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
