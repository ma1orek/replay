"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Scan } from "lucide-react";
import { motion } from "framer-motion";

interface MobileProcessingProps {
  progress: number;
  message: string;
  videoBlob: Blob | null;
  onCancel: () => void;
}

const PROCESSING_MESSAGES = [
  "Analyzing video frames...",
  "Detecting UI components...",
  "Mapping layout structure...",
  "Extracting color palette...",
  "Identifying typography...",
  "Building component tree...",
  "Generating React code...",
  "Optimizing for production...",
  "Finalizing output...",
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
        setFrameUrl(canvas.toDataURL("image/jpeg", 0.5));
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
      setCurrentMessageIndex(prev => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  
  const displayMessage = progress < 30 ? message : PROCESSING_MESSAGES[currentMessageIndex];
  
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Background - First frame with blur */}
      {frameUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${frameUrl})`,
            filter: "blur(20px) brightness(0.3)",
            transform: "scale(1.1)"
          }}
        />
      )}
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Cancel button */}
      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm"
      >
        <X className="w-5 h-5 text-white/70" />
      </button>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6">
        {/* Scanning animation */}
        <div className="relative w-72 h-72 mb-8">
          {/* Grid */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `
              linear-gradient(rgba(255,110,60,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,110,60,0.4) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px"
          }} />
          
          {/* Corner brackets */}
          <motion.div
            className="absolute top-0 left-0 w-12 h-12 border-t-3 border-l-3 border-[#FF6E3C]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ borderWidth: "3px" }}
          />
          <motion.div
            className="absolute top-0 right-0 w-12 h-12 border-t-3 border-r-3 border-[#FF6E3C]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            style={{ borderWidth: "3px" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-12 h-12 border-b-3 border-l-3 border-[#FF6E3C]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            style={{ borderWidth: "3px" }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-12 h-12 border-b-3 border-r-3 border-[#FF6E3C]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            style={{ borderWidth: "3px" }}
          />
          
          {/* Laser line - main */}
          <motion.div
            className="absolute left-0 right-0 h-1"
            style={{ 
              background: "linear-gradient(90deg, transparent, #FF6E3C, transparent)",
              boxShadow: "0 0 30px #FF6E3C, 0 0 60px #FF6E3C"
            }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Second laser - perpendicular */}
          <motion.div
            className="absolute top-0 bottom-0 w-1"
            style={{ 
              background: "linear-gradient(180deg, transparent, #FF6E3C, transparent)",
              boxShadow: "0 0 30px #FF6E3C, 0 0 60px #FF6E3C"
            }}
            animate={{ left: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-20 h-20 rounded-2xl bg-black/50 backdrop-blur-sm border border-[#FF6E3C]/30 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1], borderColor: ["rgba(255,110,60,0.3)", "rgba(255,110,60,0.8)", "rgba(255,110,60,0.3)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Scan className="w-10 h-10 text-[#FF6E3C]" />
            </motion.div>
          </div>
          
          {/* Particle effects */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#FF6E3C]"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: [0, -20, -40],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
        
        {/* Status text */}
        <motion.h2
          className="text-2xl font-bold text-white mb-3"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Scanning...
        </motion.h2>
        
        {/* Progress bar */}
        <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Progress percentage */}
        <p className="text-[#FF6E3C] font-mono font-bold text-lg mb-2">
          {Math.round(progress)}%
        </p>
        
        {/* Current task message */}
        <motion.p
          key={displayMessage}
          className="text-white/50 text-sm text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          {displayMessage}
        </motion.p>
      </div>
    </div>
  );
}
