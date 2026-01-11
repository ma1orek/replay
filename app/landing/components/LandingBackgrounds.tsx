"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function AuroraEffect() {
  return (
    <div className="fixed inset-0 z-0 opacity-40">
       <div className="absolute inset-0 bg-[#030303]" />
    </div>
  );
}

export function FloatingOrbs() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Mobile: simplified static orbs
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,110,60,0.08) 0%, rgba(255,110,60,0) 60%)",
            top: "-20%",
            left: "30%",
            filter: "blur(50px)",
            transform: "translate3d(0,0,0)",
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {/* Main accent orb */}
      <motion.div
        className="absolute w-[1000px] h-[1000px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,110,60,0.12) 0%, rgba(255,110,60,0) 60%)",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(80px)",
          willChange: "transform, opacity",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Side orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,90,50,0.08) 0%, rgba(255,90,50,0) 70%)",
          top: "40%",
          left: "-10%",
          filter: "blur(100px)",
          willChange: "transform",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,140,80,0.08) 0%, rgba(255,140,80,0) 70%)",
          bottom: "10%",
          right: "-5%",
          filter: "blur(100px)",
          willChange: "transform",
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export function GridLines() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Skip on mobile for performance
  if (isMobile) return null;
  
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Vertical lines */}
      <div className="absolute inset-0 flex justify-center">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-px h-full bg-gradient-to-b from-transparent via-white/[0.03] to-transparent"
            style={{ marginLeft: i === 0 ? 0 : "20%" }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 1.5, delay: i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}
