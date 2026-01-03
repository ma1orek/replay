"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Info, X, ImagePlus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StyleInjectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  referenceImage?: { url: string; name: string } | null;
  onReferenceImageChange?: (image: { url: string; name: string } | null) => void;
}

const PLACEHOLDER_EXAMPLES = [
  "Apple-style with frosted glass and smooth animations",
  "Dark mode like Linear with subtle glow effects",
  "Colorful gradients like Stripe's landing page",
  "Minimalist Notion-style with clean typography",
  "Glassmorphism with vibrant mesh backgrounds",
];

// Style preview component - renders CSS-based visual thumbnail
const StylePreview = ({ styleId }: { styleId: string }) => {
  const previewStyles: Record<string, React.ReactNode> = {
    custom: (
      <div className="w-full h-full bg-gradient-to-br from-[#FF6E3C]/20 via-[#FF6E3C]/10 to-transparent relative overflow-hidden">
        <div className="absolute inset-1 rounded-sm border border-dashed border-[#FF6E3C]/40" />
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#FF6E3C]/60" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-1 rounded-sm bg-[#FF6E3C]/40" />
      </div>
    ),
    original: (
      <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center gap-0.5">
        <div className="w-2 h-3 bg-white/20 rounded-[1px]" />
        <div className="w-2 h-3 bg-white/20 rounded-[1px]" />
      </div>
    ),
    "style-reference": (
      <div className="w-full h-full bg-gradient-to-br from-[#FF6E3C]/20 to-purple-500/20 flex items-center justify-center">
        <ImagePlus className="w-3.5 h-3.5 text-[#FF6E3C]/80" />
      </div>
    ),
    "aura-glass": (
      <div className="w-full h-full bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-cyan-500/20" />
        <div className="absolute inset-1 rounded-sm bg-white/5 backdrop-blur-sm border border-white/10" />
      </div>
    ),
    "void-spotlight": (
      <div className="w-full h-full bg-[#050505] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-full blur-sm" />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 rounded-sm bg-white/10 border border-white/5" />
      </div>
    ),
    "dark-cosmos": (
      <div className="w-full h-full bg-[#030303] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-3 h-3 bg-purple-500/40 rounded-full blur-md" />
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyan-500/40 rounded-full blur-md" />
        <div className="absolute inset-1 rounded-sm bg-white/5 backdrop-blur-sm" />
      </div>
    ),
    linear: (
      <div className="w-full h-full bg-[#0a0a0a] p-1">
        <div className="w-full h-full rounded-[2px] border border-white/10 bg-white/[0.02]" />
      </div>
    ),
    "spatial-glass": (
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 p-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent" />
        <div className="absolute inset-1.5 rounded-lg bg-white/40 backdrop-blur-xl border border-white/60" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.1)' }} />
      </div>
    ),
    "kinetic-brutalism": (
      <div className="w-full h-full bg-[#E5FF00] flex items-center justify-center overflow-hidden">
        <div className="text-[12px] font-black text-black tracking-tighter">AB</div>
      </div>
    ),
    "gravity-physics": (
      <div className="w-full h-full bg-white p-1 relative">
        <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-blue-500" />
        <div className="absolute bottom-1 left-3 w-1.5 h-1.5 rounded-full bg-pink-500" />
        <div className="absolute bottom-2 right-1 w-2.5 h-2.5 rounded-full bg-green-500" />
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-yellow-500" />
      </div>
    ),
    "neo-retro-os": (
      <div className="w-full h-full bg-[#008080] p-0.5 relative">
        <div className="w-full h-full bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080]">
          <div className="h-2 bg-gradient-to-r from-[#000080] to-[#1084d0]" />
        </div>
      </div>
    ),
    "soft-clay-pop": (
      <div className="w-full h-full bg-[#FFF5F0] p-1 flex items-center justify-center">
        <div className="w-5 h-4 rounded-xl bg-[#E8B4FF]" style={{ boxShadow: 'inset 4px 4px 8px rgba(255,255,255,0.5), inset -4px -4px 8px rgba(0,0,0,0.05)' }} />
      </div>
    ),
    "deconstructed-editorial": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-4 h-6 bg-neutral-200" />
        <div className="absolute top-1 right-0 text-[8px] font-serif text-black rotate-90 origin-right">Aa</div>
        <div className="absolute bottom-0 right-1 w-2 h-3 bg-black" />
      </div>
    ),
    "cinematic-product": (
      <div className="w-full h-full bg-black flex items-center justify-center relative">
        <div className="w-4 h-4 rounded-full border-2 border-white/30" style={{ transform: 'perspective(50px) rotateY(20deg)' }} />
        <div className="absolute inset-x-0 bottom-1 text-center text-[4px] text-white/40">scroll</div>
      </div>
    ),
    // === 10 NEW CREATIVE STYLES ===
    "particle-brain": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <motion.div
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{ top: '30%', left: '40%' }}
          animate={{ y: [0, -2, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-0.5 h-0.5 bg-cyan-300 rounded-full"
          style={{ top: '50%', left: '55%' }}
          animate={{ y: [0, 2, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <motion.div
          className="absolute w-0.5 h-0.5 bg-cyan-500 rounded-full"
          style={{ top: '60%', left: '35%' }}
          animate={{ y: [0, -1.5, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
        <motion.div
          className="absolute w-[3px] h-[3px] bg-cyan-400/50 rounded-full blur-[1px]"
          style={{ top: '40%', left: '45%' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    ),
    "old-money": (
      <div className="w-full h-full bg-[#F5F5DC] p-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-transparent" />
        <div className="w-full h-full border border-[#8B7355]/30 flex items-center justify-center">
          <span className="text-[8px] font-serif text-[#5D4E37]">Aa</span>
        </div>
      </div>
    ),
    "tactical-hud": (
      <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden font-mono">
        <div className="absolute top-0.5 left-0.5 text-[4px] text-cyan-400">[</div>
        <div className="absolute top-0.5 right-0.5 text-[4px] text-cyan-400">]</div>
        <div className="absolute bottom-0.5 left-0.5 text-[4px] text-cyan-400">[</div>
        <div className="absolute bottom-0.5 right-0.5 text-[4px] text-cyan-400">]</div>
        <div className="absolute inset-1 border border-cyan-500/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-cyan-500/50" />
      </div>
    ),
    "urban-grunge": (
      <div className="w-full h-full bg-[#3a3a3a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'%23666\'/%3E%3C/svg%3E")', backgroundSize: '4px 4px' }} />
        <div className="absolute bottom-1 left-1 text-[8px] font-black text-white/80 tracking-tighter">X</div>
      </div>
    ),
    "ink-zen": (
      <div className="w-full h-full bg-[#FAF8F5] relative overflow-hidden">
        <div className="absolute top-1 bottom-1 right-2 w-[1px] bg-black/60" />
        <div className="absolute top-2 left-1 w-3 h-3 rounded-full bg-black/10 blur-sm" />
      </div>
    ),
    "infinite-tunnel": (
      <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute w-6 h-6 border border-white/10 rounded-sm" />
        <div className="absolute w-4 h-4 border border-white/20 rounded-sm" />
        <div className="absolute w-2 h-2 border border-white/40 rounded-sm" />
        <div className="absolute w-1 h-1 bg-white/60 rounded-sm" />
      </div>
    ),
    "frosted-acrylic": (
      <div className="w-full h-full bg-gradient-to-br from-blue-200 to-pink-200 p-1 relative">
        <div className="absolute inset-1 rounded-md bg-white/70 backdrop-blur-xl border-2 border-white/50" style={{ boxShadow: '0 4px 20px rgba(100,100,255,0.2)' }} />
      </div>
    ),
    "datamosh": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full bg-red-500/30" />
          <div className="w-1/3 h-full bg-green-500/30" />
          <div className="w-1/3 h-full bg-blue-500/30" />
        </div>
        <div className="absolute top-1 left-1 right-2 h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ transform: 'skewX(-10deg)' }} />
      </div>
    ),
    "origami-fold": (
      <div className="w-full h-full bg-white relative overflow-hidden" style={{ perspective: '50px' }}>
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gray-100 origin-bottom" style={{ transform: 'rotateX(-10deg)' }} />
        <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-white" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gray-50 origin-top" style={{ transform: 'rotateX(10deg)' }} />
        <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-black/10" />
        <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-black/10" />
      </div>
    ),
    // === OTHER STYLES ===
    "biomimetic-organic": (
      <div className="w-full h-full bg-[#E8E4DC] relative overflow-hidden">
        <div className="absolute top-0 left-1 w-3 h-3 rounded-full bg-[#7C9070]/30 blur-sm" />
        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#C4A77D]/40 blur-sm" />
        <div className="absolute inset-2 rounded-[40%_60%_70%_30%/60%_30%_70%_40%] bg-white/40 backdrop-blur-sm" />
      </div>
    ),
    "silent-luxury": (
      <div className="w-full h-full bg-white flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-black" />
      </div>
    ),
    "generative-ascii": (
      <div className="w-full h-full bg-black flex items-center justify-center font-mono">
        <span className="text-[6px] text-white/80">@#*.</span>
      </div>
    ),
    "liquid-chrome": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-gray-400/20 to-white/30" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-300 via-white to-gray-400" style={{ boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
      </div>
    ),
    "cinematic-portals": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50" />
        <div className="absolute inset-2 border border-white/20 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white/60">PLAY</span>
        </div>
      </div>
    ),
    "digital-collage": (
      <div className="w-full h-full bg-[#EBEBEB] relative overflow-hidden">
        <div className="absolute top-0 left-1 w-3 h-4 bg-pink-300 rotate-[-5deg]" style={{ clipPath: 'polygon(5% 0%, 100% 10%, 95% 100%, 0% 90%)' }} />
        <div className="absolute bottom-0 right-0 w-4 h-3 bg-yellow-300 rotate-[3deg]" />
        <div className="absolute top-2 right-1 text-[6px] font-handwriting text-black">Hi!</div>
      </div>
    ),
    "ethereal-mesh": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-4 h-4 bg-violet-400/40 rounded-full blur-xl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400/40 rounded-full blur-xl" />
        <div className="absolute inset-1.5 rounded-lg bg-white/60 backdrop-blur-xl border border-white/80" />
      </div>
    ),
    "typographic-architecture": (
      <div className="w-full h-full bg-white flex items-center justify-center overflow-hidden">
        <span className="text-[16px] font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-500">A</span>
      </div>
    ),
    "xray-blueprint": (
      <div className="w-full h-full bg-[#0a1628] relative overflow-hidden">
        <div className="absolute inset-1 border border-cyan-500/30 rounded-sm" />
        <div className="absolute top-2 left-2 right-2 h-[1px] bg-cyan-500/20" />
        <div className="absolute bottom-2 left-2 right-2 h-[1px] bg-cyan-500/20" />
        <div className="absolute top-2 bottom-2 left-2 w-[1px] bg-cyan-500/20" />
      </div>
    ),
    // === EXISTING STYLES ===
    "swiss-grid": (
      <div className="w-full h-full bg-white p-0.5">
        <div className="w-full h-full grid grid-cols-2 gap-[1px]">
          <div className="bg-black/5 border-r border-b border-black/20" />
          <div className="bg-black/5 border-b border-black/20" />
          <div className="bg-black/5 border-r border-black/20" />
          <div className="bg-black/5" />
        </div>
      </div>
    ),
    neubrutalism: (
      <div className="w-full h-full bg-[#FFE566] p-1">
        <div className="w-full h-full bg-white border-2 border-black rounded-sm" style={{ boxShadow: '2px 2px 0 black' }} />
      </div>
    ),
    "soft-organic": (
      <div className="w-full h-full bg-[#FFF5F5] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-4 h-4 bg-pink-300/50 rounded-full blur-md" />
        <div className="absolute bottom-0 left-0 w-3 h-3 bg-blue-300/50 rounded-full blur-md" />
        <div className="absolute inset-1 rounded-xl bg-white/60 backdrop-blur-sm" />
      </div>
    ),
    glassmorphism: (
      <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-1">
        <div className="w-full h-full rounded-md bg-white/20 backdrop-blur-sm border border-white/30" />
      </div>
    ),
    apple: (
      <div className="w-full h-full bg-[#1d1d1f] flex items-center justify-center">
        <div className="w-4 h-3 rounded-md bg-white/10 backdrop-blur-sm border border-white/20" />
      </div>
    ),
    stripe: (
      <div className="w-full h-full bg-gradient-to-br from-[#635BFF] to-[#A960EE] flex items-center justify-center">
        <div className="w-4 h-2 rounded-full bg-white/90" />
      </div>
    ),
    vercel: (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-white" />
      </div>
    ),
    // === NEW ADVANCED STYLES ===
    "phantom-border": (
      <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-1 grid grid-cols-2 gap-[1px]">
          <div className="bg-white/[0.02]" />
          <div className="bg-white/[0.02]" />
          <div className="bg-white/[0.02]" />
          <div className="bg-white/[0.02]" />
        </div>
        <div className="absolute top-1 left-2 w-3 h-3 bg-gradient-radial from-white/20 to-transparent rounded-full blur-[2px]" />
      </div>
    ),
    "opposing-scroll": (
      <div className="w-full h-full bg-black overflow-hidden flex flex-col justify-center gap-0.5">
        <div className="text-[5px] text-white/40 whitespace-nowrap animate-marquee">TEXT ・ TEXT ・ TEXT ・</div>
        <div className="text-[5px] text-white/40 whitespace-nowrap animate-marquee-reverse">TEXT ・ TEXT ・ TEXT ・</div>
      </div>
    ),
    "chromatic-dispersion": (
      <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
        <div className="w-4 h-4 bg-white/60 rounded-sm relative">
          <div className="absolute inset-0 bg-red-500/40 translate-x-[1px]" />
          <div className="absolute inset-0 bg-blue-500/40 -translate-x-[1px]" />
        </div>
      </div>
    ),
    "live-dashboard": (
      <div className="w-full h-full bg-[#0a0a0a] p-0.5 grid grid-cols-3 gap-px">
        <div className="bg-neutral-900 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /></div>
        <div className="bg-neutral-900 text-[4px] text-white/50 flex items-center justify-center font-mono">47</div>
        <div className="bg-neutral-900" />
        <div className="bg-neutral-900" />
        <div className="bg-neutral-900 text-[4px] text-cyan-400/50 flex items-center justify-center">↑</div>
        <div className="bg-neutral-900" />
      </div>
    ),
    "silk-smoke": (
      <div className="w-full h-full bg-[#1a1a1a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ filter: 'url(#turbulence)', background: 'linear-gradient(45deg, purple, cyan)' }} />
        <svg className="absolute inset-0 w-0 h-0">
          <filter id="turbulence"><feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" /></filter>
        </svg>
      </div>
    ),
    "sliced-shutter": (
      <div className="w-full h-full bg-black flex overflow-hidden">
        <div className="w-1/5 h-full bg-gradient-to-b from-purple-500/60 to-pink-500/60" style={{ transform: 'translateY(20%)' }} />
        <div className="w-1/5 h-full bg-gradient-to-b from-purple-500/60 to-pink-500/60" style={{ transform: 'translateY(40%)' }} />
        <div className="w-1/5 h-full bg-gradient-to-b from-purple-500/60 to-pink-500/60" style={{ transform: 'translateY(60%)' }} />
        <div className="w-1/5 h-full bg-gradient-to-b from-purple-500/60 to-pink-500/60" style={{ transform: 'translateY(40%)' }} />
        <div className="w-1/5 h-full bg-gradient-to-b from-purple-500/60 to-pink-500/60" style={{ transform: 'translateY(20%)' }} />
      </div>
    ),
    "gyroscopic-levitation": (
      <div className="w-full h-full bg-white flex items-center justify-center relative">
        <div className="absolute w-5 h-3 bg-black/10 rounded-full blur-sm translate-y-1" />
        <div className="w-5 h-3 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 -translate-y-0.5" style={{ transform: 'perspective(50px) rotateX(-5deg) rotateY(5deg)' }} />
      </div>
    ),
    "stacked-cards": (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center relative">
        <div className="absolute w-5 h-3 rounded-sm bg-white/10 translate-y-1 scale-90" />
        <div className="absolute w-5 h-3 rounded-sm bg-white/20 translate-y-0.5 scale-95" />
        <div className="absolute w-5 h-3 rounded-sm bg-white/30" />
      </div>
    ),
    "sticky-headers": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-black text-[4px] text-white flex items-center px-1 font-bold">01</div>
        <div className="absolute top-3 left-0 right-0 h-2 bg-gray-200" />
        <div className="absolute top-5 left-0 right-0 h-2 bg-gray-300" />
      </div>
    ),
    "morphing-nav": (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-white/20 border border-white/30" />
      </div>
    ),
    "exploded-view": (
      <div className="w-full h-full bg-black flex items-center justify-center relative" style={{ perspective: '50px' }}>
        <div className="absolute w-4 h-1 bg-blue-500/50 rounded-sm" style={{ transform: 'translateZ(0px)' }} />
        <div className="absolute w-3 h-0.5 bg-cyan-500/50 rounded-sm" style={{ transform: 'translateZ(5px) translateY(-3px)' }} />
        <div className="absolute w-2 h-0.5 bg-purple-500/50 rounded-sm" style={{ transform: 'translateZ(10px) translateY(-5px)' }} />
      </div>
    ),
    "helix-typography": (
      <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden" style={{ perspective: '100px' }}>
        <div className="text-[6px] text-white/60 font-bold" style={{ transform: 'rotateY(30deg)' }}>ABC</div>
      </div>
    ),
    "inverted-lens": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black text-white text-[6px] flex items-center justify-center">TEXT</div>
        <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-white" style={{ mixBlendMode: 'difference' }} />
      </div>
    ),
    "draggable-masonry": (
      <div className="w-full h-full bg-[#f5f5f5] p-0.5 grid grid-cols-3 gap-0.5">
        <div className="bg-pink-400 rounded-sm h-3" />
        <div className="bg-blue-400 rounded-sm h-4 row-span-2" />
        <div className="bg-yellow-400 rounded-sm h-3" />
        <div className="bg-green-400 rounded-sm h-2" />
        <div className="bg-purple-400 rounded-sm h-2" />
      </div>
    ),
    "crt-noise": (
      <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)' }} />
        <div className="absolute inset-0 flex items-center justify-center text-[6px] font-mono" style={{ textShadow: '1px 0 red, -1px 0 cyan' }}>CRT</div>
      </div>
    ),
    "parallax-curtain": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-200" style={{ clipPath: 'inset(0 0 40% 0)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-black flex items-center justify-center text-[5px] text-white/40">FOOTER</div>
      </div>
    ),
    "viscous-hover": (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-5 h-4 bg-gradient-to-br from-pink-500 to-orange-500 rounded-sm" style={{ filter: 'url(#goo)' }} />
      </div>
    ),
    "elastic-sidebar": (
      <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden">
        <svg className="absolute left-0 top-0 h-full w-3" viewBox="0 0 20 100">
          <path d="M0,0 Q10,50 0,100" fill="white" fillOpacity="0.1" />
        </svg>
      </div>
    ),
    "globe-data": (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border border-cyan-500/30 relative">
          <div className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full top-1 left-2" />
          <div className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full top-2 right-1" />
          <div className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full bottom-1 left-1" />
        </div>
      </div>
    ),
    "horizontal-inertia": (
      <div className="w-full h-full bg-black flex items-center gap-1 px-1 overflow-hidden">
        <div className="w-4 h-5 bg-white/20 rounded-sm flex-shrink-0" style={{ transform: 'skewX(-5deg)' }} />
        <div className="w-4 h-5 bg-white/20 rounded-sm flex-shrink-0" style={{ transform: 'skewX(-5deg)' }} />
      </div>
    ),
    "liquid-text-mask": (
      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <span className="text-[12px] font-black text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/40">Aa</span>
      </div>
    ),
    "skeuomorphic": (
      <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center gap-1 p-1">
        <div className="w-2 h-3 rounded-sm bg-gradient-to-b from-gray-400 to-gray-600 border border-gray-700" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} />
        <div className="w-2 h-3 rounded-sm bg-gradient-to-b from-green-400 to-green-600 border border-green-700" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} />
      </div>
    ),
    "noise-gradient": (
      <div className="w-full h-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
      </div>
    ),
    "split-curtain": (
      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-500 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-black" style={{ transform: 'translateX(-30%)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-black" style={{ transform: 'translateX(30%)' }} />
      </div>
    ),
    "matter-gravity": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/20" />
        <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-red-500" />
        <div className="absolute bottom-1 left-3 w-1.5 h-1.5 rounded-full bg-blue-500" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500" />
      </div>
    ),
    "magnetic-button": (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-3 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-white/60" />
        </div>
      </div>
    ),
    "pixelated-dissolve": (
      <div className="w-full h-full bg-black grid grid-cols-4 grid-rows-4 gap-px p-0.5">
        <div className="bg-purple-500/80" /><div className="bg-purple-500/60" /><div className="bg-purple-500/20" /><div className="bg-transparent" />
        <div className="bg-purple-500/90" /><div className="bg-purple-500/70" /><div className="bg-purple-500/40" /><div className="bg-purple-500/10" />
        <div className="bg-purple-500" /><div className="bg-purple-500/80" /><div className="bg-purple-500/50" /><div className="bg-purple-500/20" />
        <div className="bg-purple-500" /><div className="bg-purple-500/90" /><div className="bg-purple-500/60" /><div className="bg-purple-500/30" />
      </div>
    ),
    "cyclic-gallery": (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
        <div className="relative w-6 h-6">
          <div className="absolute w-2 h-3 bg-white/30 rounded-sm" style={{ transform: 'rotate(0deg) translateY(-8px)' }} />
          <div className="absolute w-2 h-3 bg-white/20 rounded-sm" style={{ transform: 'rotate(72deg) translateY(-8px)' }} />
          <div className="absolute w-2 h-3 bg-white/10 rounded-sm" style={{ transform: 'rotate(144deg) translateY(-8px)' }} />
        </div>
      </div>
    ),
    "accordion-fold": (
      <div className="w-full h-full bg-white relative overflow-hidden" style={{ perspective: '50px' }}>
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gray-100 origin-bottom" style={{ transform: 'rotateX(-15deg)' }} />
        <div className="absolute top-1/4 left-0 right-0 h-1/4 bg-white" />
        <div className="absolute top-2/4 left-0 right-0 h-1/4 bg-gray-50 origin-top" style={{ transform: 'rotateX(15deg)' }} />
        <div className="absolute top-3/4 left-0 right-0 h-1/4 bg-gray-100 origin-bottom" style={{ transform: 'rotateX(-10deg)' }} />
      </div>
    ),
    "flashlight-mask": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-white flex items-center justify-center text-[6px] font-bold">HIDDEN</div>
        <div className="absolute inset-0 bg-black" style={{ maskImage: 'radial-gradient(circle 10px at 60% 40%, transparent, black 100%)' }} />
      </div>
    ),
  };

  return (
    <div className="w-8 h-8 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
      {previewStyles[styleId] || (
        <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
      )}
    </div>
  );
};

// Style categories for organization
const STYLE_CATEGORIES = [
  { id: "creative", name: "Creative & Experimental", color: "text-orange-400" },
  { id: "dark", name: "Dark Premium", color: "text-purple-400" },
  { id: "light", name: "Light & Clean", color: "text-blue-400" },
  { id: "motion", name: "Motion & Scroll", color: "text-cyan-400" },
  { id: "interactive", name: "Interactive & Cursor", color: "text-pink-400" },
  { id: "shader", name: "WebGL & Shaders", color: "text-emerald-400" },
  { id: "physics", name: "Physics & 3D", color: "text-amber-400" },
  { id: "brand", name: "Brand Inspired", color: "text-green-400" },
];

const STYLE_PRESETS = [
  { id: "custom", name: "Custom", desc: "Describe your own style", fullDesc: "", category: null },
  { id: "original", name: "Original", desc: "1:1 Copy • Exact Match", fullDesc: "Recreates the exact design from the video with pixel-perfect accuracy.", category: null },
  { id: "style-reference", name: "Style Reference", desc: "Upload image • Copy its style", fullDesc: "Apply the visual style from the reference image: use its color palette, typography, spacing, border-radius, and overall aesthetic.", category: null },
  
  // === CREATIVE & EXPERIMENTAL ===
  { id: "particle-brain", name: "Particle Brain", desc: "AI Cloud • 50k Points • WebGL", fullDesc: "3D point cloud aesthetic. Objects made of thousands of particles. Particles scatter on hover, morph on scroll.", category: "creative" },
  { id: "old-money", name: "Old Money Heritage", desc: "Cream • Gold Serif • Classic", fullDesc: "Heritage luxury. Cream backgrounds, gold accents, Playfair Display serif. Subtle grain texture. Very slow fades.", category: "creative" },
  { id: "tactical-hud", name: "Tactical HUD", desc: "Sci-Fi Game • Brackets • Scanning", fullDesc: "Gaming HUD interface. Corner brackets, connecting lines, monospace labels. Glitchy text, blinking cursors.", category: "creative" },
  { id: "urban-grunge", name: "Urban Grunge", desc: "Concrete • Spray Paint • Street", fullDesc: "Streetwear brutalism. Concrete texture background, distorted fonts, mix-blend-mode effects. Stop-motion animation.", category: "creative" },
  { id: "ink-zen", name: "Ink & Zen", desc: "Japanese • Vertical • Sumi-e", fullDesc: "Eastern minimalism. Vertical text, ink drop reveals, calligraphic fonts. Black ink on rice paper aesthetic.", category: "creative" },
  { id: "infinite-tunnel", name: "Infinite Tunnel", desc: "Z-Axis • Fly Through • Warp", fullDesc: "Content flies toward camera on scroll. Elements scale from 0 to 10, passing the viewer. Warp speed feel.", category: "creative" },
  { id: "frosted-acrylic", name: "Frosted Acrylic", desc: "Thick Glass • Solid • Glow Through", fullDesc: "Solid acrylic blocks, not thin glass. High opacity, extreme blur, colored shadows glowing through.", category: "creative" },
  { id: "datamosh", name: "Datamosh Glitch", desc: "Pixel Sort • Melt • RGB Split", fullDesc: "Video compression artifacts. Pixel sorting, RGB split shadows, melting effects on hover.", category: "creative" },
  { id: "origami-fold", name: "Origami Fold", desc: "Paper 3D • Unfold • Envelope", fullDesc: "Interface folds/unfolds like paper. 3D CSS transforms, crease shadows. Sections unfold on scroll.", category: "creative" },
  
  { id: "spatial-glass", name: "Spatial Glass", desc: "Vision Pro • 3D Tilt • Light", fullDesc: "Spatial Design like Apple Vision Pro. Thick glass with reflections. Cards tilt with mouse parallax.", category: "creative" },
  { id: "kinetic-brutalism", name: "Kinetic Brutalism", desc: "15vw Type • Acid Yellow • Bold", fullDesc: "AGGRESSIVE design. Massive text-[15vw] typography. Acid Yellow #E5FF00 on black. Headers move with scroll velocity.", category: "creative" },
  { id: "gravity-physics", name: "Gravity Physics", desc: "Falling Tags • Drag & Throw • Bounce", fullDesc: "Physics playground. Elements fall with gravity, bounce off walls, can be dragged and thrown.", category: "creative" },
  { id: "neo-retro-os", name: "Neo-Retro OS", desc: "Windows 95 • Draggable • Vaporwave", fullDesc: "Y2K meets Cyberpunk. Windows 95 draggable windows with beveled borders. Glitch on entry.", category: "creative" },
  { id: "soft-clay-pop", name: "Soft Clay Pop", desc: "Claymorphism • Pastel • Bouncy", fullDesc: "Soft tactile interface like plasticine. Pastel colors. Double shadows for 3D volume.", category: "creative" },
  { id: "deconstructed-editorial", name: "Deconstructed Editorial", desc: "Fashion • Vertical Text • Chaos", fullDesc: "Avant-Garde fashion magazine. Overlapping elements. Vertical text. Parallax scroll.", category: "creative" },
  { id: "cinematic-product", name: "Cinematic Product", desc: "Apple Page • Scroll-Driven 3D", fullDesc: "Apple-style scrollytelling. Product sticky center, rotates with scroll. Ghost text fades.", category: "creative" },
  
  // === DARK PREMIUM ===
  { id: "aura-glass", name: "High-End Dark Glass", desc: "Aurora Glow • Spotlight • Premium", fullDesc: "Dark mode glassmorphism with aurora glows, spotlight effects. Pure black base.", category: "dark" },
  { id: "void-spotlight", name: "Void Spotlight", desc: "Deep Void • Mouse Glow • Heavy", fullDesc: "Classic Aura. Invisible borders reveal gradient on hover tracking mouse.", category: "dark" },
  { id: "dark-cosmos", name: "Dark Cosmos", desc: "Purple/Cyan Glow • Glass • Float", fullDesc: "Deep black with vivid gradient glows. Heavy backdrop-blur, ethereal animations.", category: "dark" },
  { id: "liquid-chrome", name: "Liquid Chrome", desc: "Metallic • Y2K • Reflections", fullDesc: "Molten silver/chrome on black. Metallic text with moving reflections.", category: "dark" },
  
  // === LIGHT & CLEAN ===
  { id: "swiss-grid", name: "Swiss Grid", desc: "Visible Grid • Massive Type • Sharp", fullDesc: "Pure white/black, visible 1px grid lines, massive typography.", category: "light" },
  { id: "silent-luxury", name: "Silent Luxury", desc: "Radical Minimal • White Void", fullDesc: "Maximum whitespace. Pure white background, pure black text. Tiny cursor. Ultra-slow reveals.", category: "light" },
  { id: "soft-organic", name: "Soft Organic", desc: "Blobs • Pastel • Underwater", fullDesc: "Creamy backgrounds with moving pastel blobs. Frosted glass.", category: "light" },
  { id: "ethereal-mesh", name: "Ethereal Mesh", desc: "Aurora Blobs • Soft SaaS • Modern", fullDesc: "Soft dreamy gradients. Moving color blobs with blur. Frosted glass cards.", category: "light" },
  { id: "neubrutalism", name: "Neo-Brutalism", desc: "Hard Shadow • Thick Border • Bouncy", fullDesc: "High contrast pastels, thick black outlines, hard shadows.", category: "light" },
  
  // === MOTION & SCROLL ===
  { id: "xray-blueprint", name: "X-Ray Blueprint", desc: "Wireframe Reveal • Scanner • Technical", fullDesc: "Technical blueprint. Wireframe reveals solid on mouse. Line draw animations.", category: "motion" },
  { id: "digital-collage", name: "Digital Collage", desc: "Scrapbook • Stickers • Draggable", fullDesc: "Mixed media scrapbook. Paper texture, cutout shapes, stickers with shadows.", category: "motion" },
  { id: "opposing-scroll", name: "Opposing Scroll Streams", desc: "Bi-Directional • Velocity • Marquee", fullDesc: "Rows of text moving in opposite directions driven by scroll velocity. Row 1 moves left, Row 2 moves right. Velocity-based speed. Hover pauses row.", category: "motion" },
  { id: "sliced-shutter", name: "Sliced Shutter Reveal", desc: "5 Strips • Waterfall • Assembly", fullDesc: "Image enters as 5 vertical strips. Same image with shifted background-position. Staggered delay creating fluid waterfall assembly.", category: "motion" },
  { id: "stacked-cards", name: "Stacked Card Deck", desc: "iOS Tabs • Depth • Scale", fullDesc: "Cards stack on top scaling down simulating depth. Like iOS Safari tabs. Scroll drives card transitions with brightness changes.", category: "motion" },
  { id: "sticky-headers", name: "Sticky Section Headers", desc: "Editorial • Mix-Blend • Parallax", fullDesc: "Section titles stick to top while content slides underneath. Headers use mix-blend-difference. Content has subtle parallax.", category: "motion" },
  { id: "horizontal-inertia", name: "Horizontal Inertia Gallery", desc: "Skew • Velocity • Spring", fullDesc: "Vertical scroll drives horizontal movement with velocity-based skew distortion. Images lean/tilt in movement direction. Spring physics.", category: "motion" },
  { id: "parallax-curtain", name: "Parallax Curtain Footer", desc: "Fixed Behind • Reveal • Scale", fullDesc: "Footer fixed behind content. Content slides up to reveal it. Footer scales from 0.9 to 1.0 as revealed. Heavy shadow on content edge.", category: "motion" },
  { id: "split-curtain", name: "Split Curtain Reveal", desc: "Dual Panel • Theater • Typography Split", fullDesc: "Screen splits Left/Right to reveal content behind. Typography splits apart too - half word goes left, half goes right. Dramatic reveal.", category: "motion" },
  { id: "helix-typography", name: "Helix Typography", desc: "DNA Scroll • 3D Cylinder • Rotate", fullDesc: "Text rotates around 3D cylinder axis. Letters positioned with rotateY. Scroll rotates the entire container. Back-facing letters dimmer.", category: "motion" },
  { id: "cyclic-gallery", name: "Cyclic Rotation Gallery", desc: "Fortune Wheel • Circle • Scroll Rotate", fullDesc: "Items arranged on giant invisible circle. Scrolling rotates the wheel. Items counter-rotate to stay upright/readable.", category: "motion" },
  
  // === INTERACTIVE & CURSOR ===
  { id: "phantom-border", name: "Phantom Border UI", desc: "Invisible Grid • Cursor Proximity • Glow", fullDesc: "Invisible grid that only exists via cursor proximity. Radial gradient follows mouse, masked by grid lines. Duration: 0 for instant response.", category: "interactive" },
  { id: "inverted-lens", name: "Inverted Lens Cursor", desc: "Window Mask • Hidden Layer • Reveal", fullDesc: "Cursor is a window revealing hidden layer. Main content black on white, hidden layer white on black. Mask follows cursor with lag.", category: "interactive" },
  { id: "magnetic-button", name: "Magnetic Attraction", desc: "Sticky Cursor • Proximity • Wobble", fullDesc: "Elements physically stick to cursor within proximity radius. Text inside moves more than background. Elastic wobble on mouse leave.", category: "interactive" },
  { id: "flashlight-mask", name: "Inverted Flashlight", desc: "Dark Screen • Light Cursor • Reveal", fullDesc: "Screen is dark. Cursor acts as light source revealing UI underneath. Click/hold expands flashlight radius. Heavy cursor lag for weight.", category: "interactive" },
  { id: "elastic-sidebar", name: "Elastic Sidebar Drag", desc: "Rubber Band • SVG Curve • Wobble", fullDesc: "Sidebar behaves like stretched rubber band when dragged. SVG path morphs with drag. Highly elastic spring on release with wobble.", category: "interactive" },
  { id: "draggable-masonry", name: "Draggable Masonry", desc: "Physics Grid • Throw • Snap", fullDesc: "Asymmetric grid where elements can be thrown around. Dragging causes layout shift. Snap to nearest grid slot with spring on release.", category: "interactive" },
  { id: "morphing-nav", name: "Morphing Fluid Nav", desc: "Dynamic Island • Apple Physics • Morph", fullDesc: "Navigation bar morphs width/height based on state. Idle: small pill. Hover: medium with text. Active: large rectangle. Very snappy spring.", category: "interactive" },
  
  // === WEBGL & SHADERS ===
  { id: "chromatic-dispersion", name: "Chromatic Dispersion", desc: "RGB Split • Movement Speed • Shader", fullDesc: "Colors split based on movement speed. Red channel offset positive, Blue negative, Green stable. Static looks normal, scrolling creates 3D glasses effect.", category: "shader" },
  { id: "viscous-hover", name: "Viscous Hover", desc: "Displacement Map • Liquid • Gooey", fullDesc: "Images behave like liquid when touched. Displacement map texture pushed by mouse creates gooey trail effect.", category: "shader" },
  { id: "silk-smoke", name: "Silk Smoke", desc: "SVG Turbulence • Slow Flow • Fabric", fullDesc: "Slow elegant procedural noise. SVG feTurbulence with feDisplacementMap. Animates seed slowly simulating flowing fabric/smoke.", category: "shader" },
  { id: "globe-data", name: "Interactive Globe Data", desc: "3D Sphere • Points • Data Arcs", fullDesc: "3D sphere made of glowing data points. Bezier curves connect points simulating data transfer. Hover explodes points outward.", category: "shader" },
  { id: "liquid-text-mask", name: "Liquid Text Masking", desc: "Video in Text • Drip • SVG Goo", fullDesc: "Giant typography acts as window to video. Edges that melt using SVG goo filter. Letters drip downwards on hover.", category: "shader" },
  { id: "noise-gradient", name: "Dynamic Noise Gradient", desc: "Canvas Grain • Perlin • Aurora", fullDesc: "High-performance Perlin noise mixing with colors in real-time. Dithering for smooth transitions. TV Static meets Aurora feel.", category: "shader" },
  
  // === PHYSICS & 3D ===
  { id: "gyroscopic-levitation", name: "Gyroscopic Levitation", desc: "Shadow Physics • Lift • Tilt", fullDesc: "Realistic lift physics. When card goes UP, shadow gets smaller, sharper, darker. Gyro tilt based on mouse position. Heavy magnetic feel.", category: "physics" },
  { id: "exploded-view", name: "Exploded View Scroll", desc: "3D Disassembly • Parts Separate • Labels", fullDesc: "3D Model parts separate on Z-axis based on scroll. Meshes move at different speeds. HTML annotations fade in when fully separated.", category: "physics" },
  { id: "matter-gravity", name: "Matter.js Gravity", desc: "Falling Tags • Collision • Throw", fullDesc: "Elements fall from top and collide with physical rules. Mouse can grab, throw, smash elements. Spawn at random X with angular velocity.", category: "physics" },
  { id: "accordion-fold", name: "Accordion Fold 3D", desc: "Paper Map • Unfold • Crease Shadow", fullDesc: "Content unfolds vertically like paper accordion. Even slices origin top, odd slices origin bottom. Black overlay animates for crease shadow.", category: "physics" },
  { id: "skeuomorphic", name: "Skeuomorphic Controls", desc: "Physical Switches • Plastic • 3D", fullDesc: "UI elements look/feel like physical plastic/metal switches. rotateX simulates rocker switch. Noise texture on plastic surface. Sound on click.", category: "physics" },
  
  // === DATA & DASHBOARD ===
  { id: "live-dashboard", name: "Live Dashboard Density", desc: "Data Heavy • Micro-Animations • Alive", fullDesc: "High density metrics grid. Scanner line moves through cells. Ticker numbers scramble on load. Blinking status dots. tabular-nums font.", category: "creative" },
  { id: "crt-noise", name: "CRT Signal Noise", desc: "Scanlines • RGB Shift • Flicker", fullDesc: "Old monitor signal simulation. Repeated scanlines, RGB text-shadow shift, vignette for curved glass, rapid opacity flicker.", category: "creative" },
  { id: "pixelated-dissolve", name: "Pixelated Dissolve", desc: "8-bit • Block Transition • Retro", fullDesc: "Images enter/exit dissolving into large pixel blocks. Grid of squares with animated opacity in wave pattern. image-rendering: pixelated.", category: "creative" },
  
  // === BRAND INSPIRED ===
  { id: "apple", name: "Apple Style", desc: "Frosted Glass • Clean • SF Pro", fullDesc: "Clean SF Pro typography, subtle glassmorphism, generous whitespace.", category: "brand" },
  { id: "stripe", name: "Stripe Design", desc: "Premium Gradient • Trust Blue", fullDesc: "Premium gradient backgrounds, smooth animations.", category: "brand" },
  { id: "spotify", name: "Spotify Dark", desc: "#121212 • Green Accent • Cards", fullDesc: "Deep black with vibrant green. Horizontal card carousels.", category: "brand" },
];

export default function StyleInjector({ value, onChange, disabled, referenceImage, onReferenceImageChange }: StyleInjectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfo, setShowInfo] = useState<string | null>(null);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find preset - default to "custom" when no style selected
  const selectedPreset = STYLE_PRESETS.find(p => value === p.name || value.startsWith(p.name + ".")) 
    || (!value ? STYLE_PRESETS.find(p => p.id === "custom") : undefined);
  
  // Extract custom instructions
  const customInstructions = (() => {
    if (!selectedPreset) return "";
    const afterName = value.slice(selectedPreset.name.length).replace(/^\.\s*/, '');
    if (selectedPreset.fullDesc && afterName.startsWith(selectedPreset.fullDesc)) {
      return afterName.slice(selectedPreset.fullDesc.length).replace(/^\.\s*/, '');
    }
    return afterName;
  })();

  // Filter presets by search
  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return STYLE_PRESETS;
    const q = searchQuery.toLowerCase();
    return STYLE_PRESETS.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.desc.toLowerCase().includes(q) ||
      p.fullDesc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group by category
  const groupedPresets = useMemo(() => {
    const groups: Record<string, typeof STYLE_PRESETS> = { none: [] };
    STYLE_CATEGORIES.forEach(c => groups[c.id] = []);
    
    filteredPresets.forEach(p => {
      if (p.category) {
        groups[p.category]?.push(p);
      } else {
        groups.none.push(p);
      }
    });
    return groups;
  }, [filteredPresets]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(52, Math.min(textareaRef.current.scrollHeight, 150)) + 'px';
    }
  }, [value]);

  // Focus search when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Animated placeholder
  useEffect(() => {
    if (isFocused) return;
    const currentText = PLACEHOLDER_EXAMPLES[placeholderIndex];
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    if (isTyping) {
      const typeChar = () => {
        if (charIndex <= currentText.length) {
          setAnimatedPlaceholder(currentText.slice(0, charIndex));
          charIndex++;
          timeoutId = setTimeout(typeChar, 40 + Math.random() * 30);
        } else {
          timeoutId = setTimeout(() => setIsTyping(false), 2000);
        }
      };
      typeChar();
    } else {
      let eraseIndex = currentText.length;
      const eraseChar = () => {
        if (eraseIndex >= 0) {
          setAnimatedPlaceholder(currentText.slice(0, eraseIndex));
          eraseIndex--;
          timeoutId = setTimeout(eraseChar, 20);
        } else {
          setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
          setIsTyping(true);
        }
      };
      eraseChar();
    }
    return () => clearTimeout(timeoutId);
  }, [placeholderIndex, isTyping, isFocused]);

  const handleSelectPreset = (preset: typeof STYLE_PRESETS[0]) => {
    if (preset.id === "custom") {
      onChange("");
      // Clear reference image when switching away from style-reference
      onReferenceImageChange?.(null);
    } else if (preset.id === "style-reference") {
      // Set the style reference mode - fullDesc will be sent with the image
      onChange(preset.fullDesc ? `${preset.name}. ${preset.fullDesc}` : preset.name);
    } else {
      // Set name + fullDesc for the backend
      onChange(preset.fullDesc ? `${preset.name}. ${preset.fullDesc}` : preset.name);
      // Clear reference image when switching to other presets
      onReferenceImageChange?.(null);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  // Handle reference image upload - only for Style Reference mode
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      onReferenceImageChange?.({ url, name: file.name });
      // Keep the Style Reference prompt - the image will be sent alongside
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-2">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1]",
          isOpen && "border-[#FF6E3C]/30 bg-white/[0.05]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {selectedPreset && <StylePreview styleId={selectedPreset.id} />}
        <div className="flex-1 min-w-0">
          <span className={cn("text-xs block", selectedPreset ? "text-white/80" : "text-white/40")}>
            {selectedPreset ? selectedPreset.name : "Select a style..."}
          </span>
          {selectedPreset && (
            <span className="text-[9px] text-white/30 truncate block">{selectedPreset.desc}</span>
          )}
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* Collapsible Panel */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border border-white/[0.08] rounded-xl bg-[#0a0a0a]/95 backdrop-blur-xl">
              {/* Search */}
              <div className="p-2 border-b border-white/[0.06]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search styles..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.12]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="w-3 h-3 text-white/30 hover:text-white/50" />
                    </button>
                  )}
                </div>
              </div>

              {/* Style List */}
              <div className="max-h-[280px] md:max-h-[320px] overflow-y-auto p-1.5 space-y-2">
                {/* Uncategorized (Custom, Original) */}
                {groupedPresets.none.length > 0 && (
                  <div className="space-y-0.5">
                    {groupedPresets.none.map(preset => (
                      <StyleItem 
                        key={preset.id} 
                        preset={preset} 
                        isSelected={selectedPreset?.id === preset.id}
                        showInfo={showInfo}
                        setShowInfo={setShowInfo}
                        onSelect={() => handleSelectPreset(preset)}
                      />
                    ))}
                  </div>
                )}

                {/* Categorized */}
                {STYLE_CATEGORIES.map(category => {
                  const presets = groupedPresets[category.id];
                  if (!presets || presets.length === 0) return null;
                  
                  return (
                    <div key={category.id}>
                      <div className={cn("text-[9px] font-medium px-2 py-1", category.color)}>
                        {category.name}
                      </div>
                      <div className="space-y-0.5">
                        {presets.map(preset => (
                          <StyleItem 
                            key={preset.id} 
                            preset={preset} 
                            isSelected={selectedPreset?.id === preset.id}
                            showInfo={showInfo}
                            setShowInfo={setShowInfo}
                            onSelect={() => handleSelectPreset(preset)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {filteredPresets.length === 0 && (
                  <div className="text-center py-6 text-white/30 text-xs">
                    No styles found for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reference Image Dropzone - ONLY for Style Reference mode */}
      {onReferenceImageChange && selectedPreset?.id === "style-reference" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative rounded-xl transition-all cursor-pointer",
            isDragging 
              ? "border border-[#FF6E3C] bg-[#FF6E3C]/10" 
              : referenceImage 
                ? "border border-[#FF6E3C]/40 bg-white/[0.02]" 
                : "border border-dashed border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]"
          )}
        >
          {referenceImage ? (
            <div className="p-3 flex items-center gap-3">
              <img 
                src={referenceImage.url} 
                alt={referenceImage.name}
                className="w-12 h-12 object-cover rounded-lg border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 truncate">{referenceImage.name}</p>
                <p className="text-[10px] text-[#FF6E3C]">Replay will use this image as style reference</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReferenceImageChange(null);
                }}
                className="w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-white/40 hover:text-red-400" />
              </button>
            </div>
          ) : (
            <div className="p-4 text-center">
              <ImagePlus className="w-5 h-5 text-[#FF6E3C]/50 mx-auto mb-2" />
              <p className="text-[10px] text-white/50">
                Drop or click to add style reference
              </p>
              <p className="text-[9px] text-white/30 mt-1">
                AI will extract colors, fonts, spacing & aesthetic
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            className="hidden"
          />
        </div>
      )}

      {/* Custom Instructions - Hidden for Style Reference mode */}
      {selectedPreset?.id !== "style-reference" && (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={selectedPreset ? customInstructions : value}
            onChange={(e) => {
              if (selectedPreset && selectedPreset.id !== "custom") {
                const newValue = `${selectedPreset.name}. ${selectedPreset.fullDesc}${e.target.value ? `. ${e.target.value}` : ''}`;
                onChange(newValue);
              } else {
                onChange(e.target.value);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? "Add custom instructions..." : animatedPlaceholder}
            disabled={disabled}
            rows={2}
            className={cn(
              "w-full px-3 py-2.5 text-xs text-white/80 placeholder:text-white/20 placeholder:text-[11px] bg-white/[0.03] border border-white/[0.06] rounded-lg resize-none focus:outline-none focus:border-white/[0.12] transition-colors min-h-[52px]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
      )}
    </div>
  );
}

// Style Item Component
function StyleItem({ 
  preset, 
  isSelected, 
  showInfo, 
  setShowInfo, 
  onSelect 
}: { 
  preset: typeof STYLE_PRESETS[0];
  isSelected: boolean;
  showInfo: string | null;
  setShowInfo: (id: string | null) => void;
  onSelect: () => void;
}) {
  const isInfoOpen = showInfo === preset.id;

  return (
    <div className={cn(
      "rounded-lg transition-colors",
      isSelected ? "bg-[#FF6E3C]/10 border border-[#FF6E3C]/30" : "hover:bg-white/[0.03]"
    )}>
      <div className="flex items-center gap-2 p-1.5 cursor-pointer" onClick={onSelect}>
        <StylePreview styleId={preset.id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={cn("text-xs font-medium", isSelected ? "text-[#FF6E3C]" : "text-white/80")}>
              {preset.name}
            </span>
            {isSelected && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-[#FF6E3C]/20 text-[#FF6E3C]">Active</span>
            )}
          </div>
          <span className="text-[9px] text-white/40 truncate block">{preset.desc}</span>
        </div>
        {preset.fullDesc && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(isInfoOpen ? null : preset.id);
            }}
            className={cn(
              "p-1 rounded transition-colors flex-shrink-0",
              isInfoOpen ? "bg-white/10 text-white/60" : "text-white/20 hover:text-white/40 hover:bg-white/5"
            )}
          >
            <Info className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Info Tooltip */}
      <AnimatePresence>
        {isInfoOpen && preset.fullDesc && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 pt-0">
              <div className="text-[10px] text-white/50 leading-relaxed p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                {preset.fullDesc}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
