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
export const StylePreview = ({ styleId }: { styleId: string }) => {
  const previewStyles: Record<string, React.ReactNode> = {
    "auto-detect": (
      <div className="w-full h-full bg-gradient-to-br from-[#FF6E3C]/30 via-purple-500/20 to-cyan-500/20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[8px] font-bold text-white/60">AI</div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FF6E3C]/40 rounded-full blur-md animate-pulse" />
      </div>
    ),
    custom: (
      <div className="w-full h-full bg-gradient-to-br from-[#FF6E3C]/20 via-[#FF6E3C]/10 to-transparent relative overflow-hidden">
        <div className="absolute inset-1 rounded-sm border border-dashed border-[#FF6E3C]/40" />
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#FF6E3C]/60" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-1 rounded-sm bg-[#FF6E3C]/40" />
      </div>
    ),
    "style-reference": (
      <div className="w-full h-full bg-gradient-to-br from-[#FF6E3C]/20 to-purple-500/20 flex items-center justify-center">
        <ImagePlus className="w-3.5 h-3.5 text-[#FF6E3C]/80" />
      </div>
    ),
    "binary-contrast": (
      <div className="w-full h-full relative overflow-hidden">
        {/* Split screen - left human, right machine */}
        <div className="absolute inset-0 grid grid-cols-2">
          {/* Human side - light, serif */}
          <div className="bg-[#F3F3F1] flex items-center justify-center border-r border-[#E5E5E5]">
            <span className="text-[5px] text-[#1A1A1A] italic" style={{ fontFamily: 'serif' }}>Human</span>
          </div>
          {/* Machine side - dark, mono */}
          <div className="bg-[#0A0A0A] flex items-center justify-center">
            <span className="text-[4px] text-[#F0F0F0] uppercase tracking-widest font-mono">[ MACHINE ]</span>
          </div>
        </div>
      </div>
    ),
    "paper-kinetic": (
      <div className="w-full h-full bg-[#F2F2F0] relative overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 grid grid-cols-3">
          <div className="border-r border-[#E0E0E0]" />
          <div className="border-r border-[#E0E0E0]" />
          <div />
        </div>
        {/* Swiss typography */}
        <div className="absolute top-1 left-1 text-[5px] font-black text-[#111] tracking-tighter">GSAP</div>
        <div className="absolute bottom-1 right-1 text-[4px] text-[#111]/60">Field™</div>
        {/* Orange accent dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#FF5500]" />
      </div>
    ),
    "void-terminal": (
      <div className="w-full h-full bg-[#050505] relative overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="border-r border-b border-[#1F1F1F]" />
          <div className="border-b border-[#1F1F1F]" />
          <div className="border-r border-[#1F1F1F]" />
          <div />
        </div>
        {/* System text */}
        <div className="absolute top-1 left-1 text-[4px] font-mono text-[#777]">// 01</div>
        <div className="absolute bottom-1 right-1 text-[4px] font-bold text-[#E6E6E6] uppercase tracking-tight">SYS</div>
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
    "morphing-nav": (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-white/20 border border-white/30" />
      </div>
    ),
    "inverted-lens": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black text-white text-[6px] flex items-center justify-center">TEXT</div>
        <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-white" style={{ mixBlendMode: 'difference' }} />
      </div>
    ),
    "crt-noise": (
      <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)' }} />
        <div className="absolute inset-0 flex items-center justify-center text-[6px] font-mono" style={{ textShadow: '1px 0 red, -1px 0 cyan' }}>CRT</div>
      </div>
    ),
    // === NEW DEADPAN KINETIC STYLES ===
    "indifferent-kinetic": (
      <div className="w-full h-full bg-[#E5FF00] flex items-center justify-center overflow-hidden">
        <div className="text-[14px] font-black text-black tracking-tighter leading-none">AB</div>
      </div>
    ),
    "deadpan-documentation": (
      <div className="w-full h-full bg-[#0B0B0B] relative">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px)' }} />
        <div className="absolute bottom-1 left-1 text-[4px] text-[#7A7A7A] font-mono">SYS</div>
      </div>
    ),
    "bureaucratic-void": (
      <div className="w-full h-full bg-white relative">
        <div className="absolute inset-0 border border-[#E1E1E1]" />
        <div className="absolute top-2 left-0 right-0 h-px bg-[#E1E1E1]" />
        <div className="absolute top-4 left-0 right-0 h-px bg-[#E1E1E1]" />
        <div className="absolute top-1 left-1 text-[4px] text-[#1C1C1C]">DOC</div>
      </div>
    ),
    "cctv-drift": (
      <div className="w-full h-full bg-[#0A0A0A] relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)' }} />
        <div className="absolute top-0.5 right-0.5 text-[3px] text-[#6E6E6E] font-mono">REC</div>
        <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-red-500/50" />
      </div>
    ),
    "inefficient-loop": (
      <div className="w-full h-full bg-[#161616] relative">
        <div className="absolute top-1 left-1 w-3 h-2 bg-[#202020] border border-[#202020]" style={{ transform: 'translateX(1px)' }} />
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#202020] border border-[#202020]" />
      </div>
    ),
    "accidental-capture": (
      <div className="w-full h-full bg-[#141414] relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 5px)' }} />
        <div className="absolute top-2 left-2 w-3 h-2 bg-[#1F1F1F]" style={{ transform: 'translate(1px, 0)' }} />
      </div>
    ),
    "abrupt-termination": (
      <div className="w-full h-full bg-[#0D0D0D] relative">
        <div className="absolute top-1 left-1 right-1 h-2 bg-[#191919]" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-900/20" />
      </div>
    ),
    // === PREMIUM SAAS LANDING PREVIEWS ===
    "molten-aurora": (
      <div className="w-full h-full bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-x-3 top-0 bottom-2 bg-gradient-to-b from-amber-500/30 via-orange-500/50 to-orange-600/30 blur-sm" />
        <div className="absolute bottom-0 left-1 right-1 h-2 bg-gradient-to-t from-orange-500/40 to-transparent rounded-full blur-[2px]" />
      </div>
    ),
    "midnight-aurora": (
      <div className="w-full h-full bg-[#050508] relative overflow-hidden">
        <div className="absolute bottom-1 inset-x-0 h-3 bg-gradient-to-t from-purple-600/40 to-transparent" />
        <div className="absolute bottom-1 left-2 w-0.5 h-3 bg-gradient-to-t from-purple-500/50 to-transparent" />
        <div className="absolute bottom-1 right-3 w-0.5 h-2 bg-gradient-to-t from-blue-400/40 to-transparent" />
      </div>
    ),
    "airy-blue-aura": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <div className="absolute top-1 left-1 right-1 h-4 bg-gradient-to-br from-blue-400/40 to-blue-300/20 rounded-full blur-md" />
        <div className="absolute bottom-2 left-2 text-[4px] text-gray-800 font-bold">Ship fast</div>
      </div>
    ),
    "halftone-beam": (
      <div className="w-full h-full bg-[#050505] relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-x-3 top-0 bottom-1 bg-gradient-to-b from-orange-500/40 to-orange-600/60" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,90,46,0.8) 0 1px, transparent 1.5px)', backgroundSize: '3px 3px' }} />
        <div className="text-[8px] font-black text-white/80 z-10">BEAM</div>
      </div>
    ),
    "mono-wave": (
      <div className="w-full h-full bg-black relative overflow-hidden flex items-center">
        <div className="w-full h-3 bg-white flex items-center overflow-hidden">
          <div className="text-[6px] font-black text-black whitespace-nowrap">WAVE WAVE WAVE</div>
        </div>
      </div>
    ),
    "glass-cascade": (
      <div className="w-full h-full bg-[#05080F] relative overflow-hidden">
        <div className="absolute top-1 left-1 w-5 h-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-sm" />
        <div className="absolute top-3 left-2 w-5 h-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-sm" />
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-blue-500/20 blur-[3px]" />
      </div>
    ),
    "fractured-grid": (
      <div className="w-full h-full bg-[#0E0E0E] relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: 'calc(100% / 3) 100%' }} />
        <div className="absolute top-1 left-0.5 text-[5px] font-bold text-white/80">TY</div>
        <div className="absolute top-3 left-3 text-[5px] font-bold text-white/80">PE</div>
      </div>
    ),
    "glowframe-product": (
      <div className="w-full h-full bg-[#050505] relative overflow-hidden flex items-center justify-center">
        <div className="w-5 h-3 bg-[#0C0F14] rounded-sm border border-white/10" style={{ boxShadow: 'inset 0 0 0 1px rgba(45,212,191,0.2)' }} />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500/30 blur-[2px]" />
      </div>
    ),
    "viscous-hover": (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-5 h-4 bg-gradient-to-br from-pink-500 to-orange-500 rounded-sm" style={{ filter: 'url(#goo)' }} />
      </div>
    ),
    // === AWWWARDS-QUALITY STYLES ===
    "stripe-aurora": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        {/* Stripe-style gradient blobs */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-[4px] opacity-60" />
        <div className="absolute top-2 left-0 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-[3px] opacity-50" />
        <div className="absolute bottom-0 right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full blur-[4px] opacity-50" />
        {/* Glass card */}
        <div className="absolute inset-1.5 bg-white/80 backdrop-blur-sm rounded-sm border border-gray-200/50" />
      </div>
    ),
    "pastel-cloud": (
      <div className="w-full h-full relative overflow-hidden">
        {/* Hero section with pastel gradient */}
        <div className="absolute top-0 left-0 right-0 h-1/2" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #ddd6fe 30%, #c7d2fe 60%, #a5f3fc 100%)' }}>
          <motion.div
            className="absolute w-6 h-6 rounded-full"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, #f9a8d4 0%, #c084fc 100%)',
              filter: 'blur(4px)',
              opacity: 0.7,
              top: '20%',
              left: '15%',
            }}
            animate={{ scale: [1, 1.2, 1], x: [0, 3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        {/* White section below */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white">
          <div className="flex gap-1 justify-center pt-1">
            <div className="w-3 h-2 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-2 bg-gray-100 rounded-sm"></div>
          </div>
        </div>
        {/* 3D badge */}
        <div className="absolute top-1 right-1 text-[4px] font-bold text-violet-600 bg-white/80 px-1 rounded">3D</div>
      </div>
    ),
    "liquid-metal": (
      <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
        {/* Chrome/Mercury sphere */}
        <div 
          className="w-5 h-5 rounded-full"
          style={{ 
            background: 'linear-gradient(135deg, #1a1a1a 0%, #666 25%, #fff 50%, #666 75%, #1a1a1a 100%)',
            boxShadow: '0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 6px rgba(0,0,0,0.8), inset 0 2px 6px rgba(255,255,255,0.4)'
          }}
        />
        {/* Reflection highlight */}
        <div className="absolute top-1 right-2 w-1 h-1 bg-white/40 rounded-full blur-[1px]" />
      </div>
    ),
    "exploded-view": (
      <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center" style={{ perspective: '100px' }}>
        <motion.div
          className="absolute w-4 h-1 bg-gray-600 rounded-sm"
          animate={{ y: [0, -3, 0], rotateX: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-3 h-0.5 bg-gray-400 rounded-sm"
          animate={{ y: [0, -6, 0], x: [0, 2, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="absolute w-2 h-0.5 bg-cyan-500 rounded-sm"
          animate={{ y: [0, -8, 0], x: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
        />
        <motion.div
          className="absolute w-1 h-1 bg-white/50 rounded-full"
          style={{ top: '60%', left: '30%' }}
          animate={{ y: [0, 5, 0], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
        />
      </div>
    ),
    "horizontal-parallax": (
      <div className="w-full h-full bg-[#0f0f0f] relative overflow-hidden flex items-center">
        <motion.div
          className="flex gap-1 absolute"
          animate={{ x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-3 h-5 bg-white/20 rounded-sm flex-shrink-0" />
          <div className="w-3 h-4 bg-white/30 rounded-sm flex-shrink-0 translate-y-1" />
          <div className="w-3 h-5 bg-white/15 rounded-sm flex-shrink-0" />
          <div className="w-3 h-4 bg-white/25 rounded-sm flex-shrink-0 translate-y-0.5" />
        </motion.div>
      </div>
    ),
    "typography-mask": (
      <div className="w-full h-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
        <motion.span
          className="text-[14px] font-black text-transparent bg-clip-text"
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect fill=\'%23000\' width=\'100\' height=\'100\'/%3E%3C/svg%3E")',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text'
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Aa
        </motion.span>
      </div>
    ),
    "path-follower": (
      <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 30 30">
          <motion.path
            d="M 5,5 Q 15,10 25,5 T 25,25"
            stroke="rgba(255,110,60,0.6)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="50"
            animate={{ strokeDashoffset: [50, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            r="1.5"
            fill="#FF6E3C"
            animate={{
              cx: [5, 15, 25, 25],
              cy: [5, 10, 5, 25]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
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
    // === NEW SHADER & ANIMATION STYLES ===
    "liquid-neon": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <motion.div
          className="absolute w-4 h-4 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full blur-sm"
          style={{ top: '20%', left: '20%' }}
          animate={{ x: [0, 8, 0], y: [0, 5, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-3 h-3 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full blur-sm"
          style={{ top: '50%', left: '50%' }}
          animate={{ x: [0, -6, 0], y: [0, 8, 0], scale: [1, 0.8, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[6px] font-black text-white/80">NEON</div>
      </div>
    ),
    "matrix-rain": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <motion.div
          className="absolute text-[4px] text-green-500 font-mono"
          style={{ left: '15%', top: '10%' }}
          animate={{ y: [0, 30], opacity: [1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >A</motion.div>
        <motion.div
          className="absolute text-[4px] text-green-400 font-mono"
          style={{ left: '40%', top: '5%' }}
          animate={{ y: [0, 30], opacity: [1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.3 }}
        >X</motion.div>
        <motion.div
          className="absolute text-[4px] text-green-300 font-mono"
          style={{ left: '70%', top: '15%' }}
          animate={{ y: [0, 30], opacity: [1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: 0.6 }}
        >7</motion.div>
        <div className="absolute bottom-1 left-1 text-[5px] font-bold text-green-500">RAIN</div>
      </div>
    ),
    "gradient-bar-waitlist": (
      <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 bg-gradient-to-t from-orange-600 to-orange-400"
            style={{ left: `${10 + i * 18}%`, width: '12%' }}
            animate={{ height: [`${20 + i * 10}%`, `${40 + i * 8}%`, `${20 + i * 10}%`] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
          />
        ))}
        <div className="absolute top-1 left-1 text-[4px] text-white/80">WAITLIST</div>
      </div>
    ),
    "blur-hero-minimal": (
      <div className="w-full h-full bg-white relative overflow-hidden flex items-center justify-center">
        <motion.div
          className="text-[8px] font-bold text-black"
          initial={{ filter: 'blur(4px)', opacity: 0 }}
          animate={{ filter: 'blur(0px)', opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        >Build</motion.div>
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 rounded-full" />
      </div>
    ),
    "messy-physics": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <motion.div
          className="absolute bg-blue-500 text-white text-[3px] px-1 rounded-full"
          style={{ left: '20%', top: '30%' }}
          animate={{ y: [0, 8, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >react</motion.div>
        <motion.div
          className="absolute bg-pink-500 text-white text-[3px] px-1 rounded-full"
          style={{ left: '50%', top: '50%' }}
          animate={{ y: [0, 6, 0], rotate: [0, -8, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
        >ts</motion.div>
        <motion.div
          className="absolute bg-orange-500 text-white text-[3px] px-1 rounded-full"
          style={{ left: '60%', top: '20%' }}
          animate={{ y: [0, 10, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 0.6 }}
        >tw</motion.div>
        <div className="absolute top-1 left-1 text-[6px] font-serif italic text-black">fancy</div>
      </div>
    ),
    "earthy-grid-reveal": (
      <div className="w-full h-full bg-gradient-to-br from-[#1a1d18] to-[#2a2e26] relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(200,180,160,0.08) 0px, rgba(200,180,160,0.08) 1px, transparent 1px, transparent 8px)' }} />
        <motion.div
          className="absolute text-[5px] text-[#e6e1d7] font-light"
          style={{ left: '20%', top: '40%' }}
          animate={{ opacity: [0, 1], y: [5, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
        >Stack</motion.div>
        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#c8b4a0]/30" />
        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-[#c8b4a0]/30" />
      </div>
    ),
    "paper-shader-mesh": (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 via-transparent to-orange-500/40" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 to-orange-500/30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="absolute top-1 left-1 text-[4px] text-white/80 font-medium">Paper</div>
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-cyan-400/50" />
      </div>
    ),
    "myna-ai-mono": (
      <div className="w-full h-full bg-white relative overflow-hidden flex flex-col items-center justify-center">
        <div className="text-[6px] font-mono font-bold text-black mb-1">THE AI</div>
        <motion.div
          className="px-1 py-0.5 bg-[#FF6B2C] rounded-sm text-[3px] text-white font-mono"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >GET STARTED</motion.div>
      </div>
    ),
    "acme-clean-rounded": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        <div className="absolute top-1 left-1 right-1 h-2 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center">
          <div className="text-[3px] text-gray-600">Acme</div>
        </div>
        <motion.div
          className="absolute top-4 left-1 right-1 text-center text-[5px] font-bold text-black"
          animate={{ opacity: [0, 1], y: [3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >Redefined</motion.div>
        <div className="absolute bottom-1 left-1 right-1 h-3 bg-gray-100 rounded-md border border-gray-200" />
      </div>
    ),
    "acid-brutalist": (
      <div className="w-full h-full bg-[#111111] relative overflow-hidden">
        {/* Border structure */}
        <div className="absolute inset-0 border border-[#333]" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#333]" />
        {/* Acid lime headline */}
        <motion.div 
          className="absolute top-1 left-1 text-[6px] font-black text-[#CCFF00] uppercase tracking-tighter"
          animate={{ opacity: [0, 1], y: [-3, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >DEV</motion.div>
        {/* Marquee bar */}
        <div className="absolute top-3 left-0 right-0 h-1.5 bg-[#CCFF00] overflow-hidden">
          <motion.div 
            className="whitespace-nowrap text-[4px] font-mono text-black"
            animate={{ x: [0, -20] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >OPEN FOR WORK /// OPEN FOR WORK ///</motion.div>
        </div>
        {/* Code decoration */}
        <div className="absolute bottom-1 left-1 text-[4px] font-mono text-[#666]">{`{...}`}</div>
        {/* Purple CTA button */}
        <motion.div 
          className="absolute bottom-1 right-1 w-3 h-1.5 bg-[#6D28D9] rounded-sm"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    ),
    "corporate-blueprint": (
      <div className="w-full h-full bg-white relative overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 border-r border-b border-slate-200/60" style={{ left: '50%' }} />
        <div className="absolute inset-0 border-b border-slate-200/60" style={{ top: '50%' }} />
        {/* Navbar */}
        <div className="absolute top-0 left-0 right-0 h-2 border-b border-slate-200/60 flex items-center justify-between px-1">
          <div className="text-[3px] font-semibold text-slate-900">BP</div>
          <motion.div 
            className="w-2.5 h-1 rounded-sm bg-blue-600"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        {/* Content grid */}
        <div className="absolute top-3 left-1 w-2/3 space-y-0.5">
          <motion.div 
            className="h-1 bg-slate-900 rounded-sm"
            animate={{ width: ['0%', '80%'] }}
            transition={{ duration: 0.8, delay: 0.2, repeat: Infinity, repeatDelay: 3 }}
          />
          <div className="h-0.5 w-1/2 bg-slate-300" />
        </div>
        {/* Stats section */}
        <div className="absolute bottom-1 left-1 right-1 h-2 border-t border-slate-200/60 flex">
          <div className="flex-1 border-r border-slate-200/60 flex items-center justify-center">
            <span className="text-[4px] font-bold text-slate-900">10+</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[4px] font-bold text-blue-600">500</span>
          </div>
        </div>
      </div>
    ),
    "super-hero": (
      <div className="w-full h-full bg-gradient-to-br from-[#0F0720] via-[#1A0B3E] to-[#2D1B69] relative overflow-hidden">
        {/* Animated liquid orbs */}
        <motion.div
          className="absolute w-6 h-6 rounded-full bg-purple-500/60"
          style={{ filter: 'blur(8px)', top: '-4px', left: '-4px' }}
          animate={{ 
            x: [0, 8, 0], 
            y: [0, 4, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-5 h-5 rounded-full bg-pink-500/50"
          style={{ filter: 'blur(6px)', bottom: '-2px', right: '-2px' }}
          animate={{ 
            x: [0, -6, 0], 
            y: [0, -4, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-blue-500/40"
          style={{ filter: 'blur(5px)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        {/* Content preview */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center z-10">
          <div className="text-[4px] font-bold text-white/90">HERO</div>
        </div>
        {/* CTA button */}
        <motion.div
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
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
  { id: "auto-detect", name: "Auto-Detect", desc: "Match video style automatically", fullDesc: "AI analyzes your video and matches its visual style: colors, fonts, spacing, and overall aesthetic.", category: null },
  { id: "custom", name: "Custom", desc: "Describe your own style", fullDesc: "", category: null },
  { id: "style-reference", name: "Style Reference", desc: "Upload image, copy its style", fullDesc: "Apply the visual style from the reference image: use its color palette, typography, spacing, border-radius, and overall aesthetic.", category: null },
  
  // === CREATIVE & EXPERIMENTAL ===
  { id: "particle-brain", name: "Particle Brain", desc: "AI Cloud • 50k Points • WebGL", fullDesc: `NEURAL NETWORK PARTICLE AESTHETIC - AI meets data visualization.

COLORS: Deep black #0a0a0a bg, particles in cyan #00fff2 and magenta #ff00ff with purple #8b5cf6 connections.

TYPOGRAPHY: Geist Mono for headlines, weight 300-400 (light), UPPERCASE with extreme tracking (0.3em). Body in Inter light.

LAYOUT: Full-viewport hero with particle cloud animation. Content floats above. Minimal sections, maximum impact.

KEY EFFECTS:
- CSS PARTICLES: 200+ tiny divs (2-4px) with absolute positioning, animation: float 3-8s infinite ease-in-out with random delays
- Each particle: background: radial-gradient(circle, #00fff2 0%, transparent 70%)
- Connection lines: Thin 1px divs connecting nearby particles
- MOUSE INTERACTION: particles repel from cursor using CSS custom properties
- Glow effect: box-shadow: 0 0 20px currentColor

ANIMATIONS:
- Particles float with sin wave (translateY + subtle rotate)
- On scroll: particles drift and scatter
- On hover: nearby particles explode outward
- Subtle RGB chromatic aberration on text

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "old-money", name: "Old Money Heritage", desc: "Cream • Gold Serif • Classic", fullDesc: `OLD MONEY LUXURY - Generational wealth aesthetics.

COLORS: Cream #F5F0E8 bg, rich navy #1C2331 text, gold accents #C9A962 and #B8860B. Burgundy #722F37 for subtle highlights.

TYPOGRAPHY: Playfair Display for headlines - weight 400-600, NEVER bold. Italic for emphasis. Letter-spacing 0.02em. Body in Cormorant Garamond weight 400, 18-20px size.

LAYOUT: Centered compositions, max-w-4xl. Generous margins (py-32 to py-48). Asymmetric image placements. Golden ratio proportions.

KEY EFFECTS:
- GRAIN OVERLAY: ::after pseudo with background-image: url("data:image/svg+xml,...") noise pattern, opacity 0.03
- Gold borders: border-2 border-[#C9A962]/30
- Subtle vignette: box-shadow: inset 0 0 100px rgba(0,0,0,0.1)
- Cards on cream bg with hairline gold border

ANIMATIONS:
- ULTRA SLOW: 1.5-2s duration minimum
- Fade in only (no movement) with ease-out
- Stagger 400ms between elements
- Gold shimmer on hover: background-position animation
- Text: subtle letter-spacing increase on hover

Timeless, restrained, confident. Old money doesn't shout.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "tactical-hud", name: "Tactical HUD", desc: "Sci-Fi Game • Brackets • Scanning", fullDesc: `MILITARY HUD INTERFACE - Sci-fi command center aesthetic.

COLORS: Near-black #0B0B0F bg, HUD green #00FF41 primary, warning amber #FFB800, alert red #FF3333. Grid lines #1a1a24.

TYPOGRAPHY: JetBrains Mono or Share Tech Mono. UPPERCASE always. Weight 400-500. Tracking 0.15em. Sizes 10-14px for data, larger for critical info.

LAYOUT: Full viewport with edge-aligned elements. Corner brackets in all four corners. Data readouts in fixed positions. Central content area.

KEY EFFECTS:
- CORNER BRACKETS: Absolute positioned L-shaped borders in each corner, 30-50px
- SCAN LINE: Horizontal line that sweeps down screen, animation: scan 4s linear infinite
- Connecting lines: SVG lines between elements with stroke-dasharray animation
- Data blocks: bg-[#00FF41]/5 border border-[#00FF41]/30 font-mono
- Blinking cursors: animation: blink 1s step-end infinite

ANIMATIONS:
- Text TYPEWRITER: letters appear one by one
- GLITCH: occasional translateX jitter with text-shadow RGB split
- Scan line sweep: translateY(-100%) → translateY(100%)
- Numbers SCRAMBLE on load before settling
- Status dots BLINK at different intervals

AUDIO OPTIONAL: Beep sounds on interactions.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "urban-grunge", name: "Urban Grunge", desc: "Concrete • Spray Paint • Street", fullDesc: `STREETWEAR BRUTALISM - Raw urban underground aesthetic.

COLORS: Concrete gray #2A2A2A bg, off-white #E8E4E0 text, spray paint accents - neon pink #FF2D92, electric blue #00D4FF, acid green #ADFF2F.

TYPOGRAPHY: Impact or Anton for headlines - condensed, BOLD, UPPERCASE. Body in Inter. Headlines can be HUGE (15-20vw) with rotation.

LAYOUT: Broken grid, overlapping elements intentional. Images at random angles (-5deg to 5deg rotate). Text breaks boundaries.

KEY EFFECTS:
- CONCRETE TEXTURE: Background with subtle noise pattern, grainy feel
- SPRAY PAINT: Gradient splashes using radial-gradient with hard edges
- Sticker aesthetic: Elements with rough white border (box-shadow: 0 0 0 4px white)
- DISTORTED FONTS: transform: scaleY(1.2) or perspective with rotateX
- mix-blend-mode: difference or exclusion on overlapping elements

ANIMATIONS:
- STOP MOTION: Steps timing function, jumpy movement
- Elements JITTER: random small translateX/Y movements
- Spray paint DRIP: gradient masks revealing content
- Glitch: horizontal slice displacement
- Shake on hover: animation: shake 0.5s ease-in-out

Raw, rebellious, anti-design but intentional.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "ink-zen", name: "Ink & Zen", desc: "Japanese • Vertical • Sumi-e", fullDesc: `JAPANESE MINIMALISM - Sumi-e ink painting aesthetic.

COLORS: Rice paper #FAF7F2 bg, ink black #1A1A1A text varying opacity (100%, 80%, 50% for hierarchy). Red seal accent #C41E3A used ONCE.

TYPOGRAPHY: Noto Serif JP or Cormorant for headings. VERTICAL TEXT: writing-mode: vertical-rl on selected elements. Weight 400, generous line-height 2.

LAYOUT: Asymmetric compositions following Japanese aesthetics (Ma - negative space). Content floats in vast whitespace. Single column flow.

KEY EFFECTS:
- INK DROPS: Circles with feathered edges, radial-gradient with blur
- Brush strokes: Wide borders that taper (SVG paths or clip-path)
- Washi paper texture: Subtle fiber patterns in background
- Red seal (hanko): Square/round red stamp, rotated 5-10deg
- Enso circle: Incomplete circle as decorative element

ANIMATIONS:
- INK REVEAL: Content appears like ink spreading on wet paper (scale + opacity + blur)
- Very SLOW transitions (1.5-2s) with ease-out
- Brush stroke DRAW: stroke-dashoffset animation on SVG paths
- Fade through opacity levels
- Minimal movement - stillness is key

Breathe. Space. Contemplation.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "frosted-acrylic", name: "Frosted Acrylic", desc: "Thick Glass • Solid • Glow Through", fullDesc: `SOLID ACRYLIC BLOCKS - Not thin glass, thick material.

COLORS: Background gradient from #1a1a2e to #0a0a1a. Acrylic in white/10 to white/20. Glow-through colors: purple #8B5CF6, cyan #06B6D4, pink #EC4899.

TYPOGRAPHY: SF Pro Display or Inter, weight 500-600. Clean, floating above acrylic surfaces.

LAYOUT: Cards as thick acrylic blocks (not thin glass panels). Generous padding p-8 to p-12. Clear layer separation.

KEY EFFECTS:
- THICK ACRYLIC: bg-white/15 backdrop-blur-[40px] with thick border-4 border-white/20
- Colored shadows BEHIND cards: box-shadow: 0 25px 50px -12px rgba(139,92,246,0.4)
- Light source from top: gradient on surface simulating thickness
- Edge highlight: top/left borders brighter than bottom/right
- Depth: Multiple card layers with parallax

ANIMATIONS:
- Cards FLOAT: subtle translateY animation 3-4s infinite
- Hover LIFT: translateY(-8px) + shadow spreads
- Glow PULSE: Shadow color intensity animates
- Light refraction: Subtle hue-rotate on blur
- 3D tilt on hover: perspective + rotateX/Y based on mouse

Material design with physical presence.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "datamosh", name: "Datamosh Glitch", desc: "Pixel Sort • Melt • RGB Split", fullDesc: `CORRUPTED DATA AESTHETIC - Digital decay and compression artifacts.

COLORS: Any base palette but CORRUPTED. RGB channels split. Magenta #FF00FF and cyan #00FFFF ghosts.

TYPOGRAPHY: Any font with GLITCH effects: text-shadow with RGB offset, occasional skew transforms.

LAYOUT: Standard layout but with corruption effects overlaid. Images especially affected.

KEY EFFECTS:
- RGB SPLIT: text-shadow: -2px 0 #ff0000, 2px 0 #00ffff on text
- PIXEL SORT: CSS gradient stripes (repeating-linear-gradient) over images on hover
- MELT: transform: scaleY(1.5) with blur transition on hover
- Scan lines: repeating-linear-gradient for CRT effect
- Corruption blocks: Random positioned divs with solid colors

ANIMATIONS:
- GLITCH: Rapid position jumps with steps timing
- Channel separation: RGB shadows animate offset
- Melt drip: Elements stretch downward on hover
- Static noise: Rapid background-position change
- Frame skip: animation-timing-function: steps(3)

@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(2px, -2px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}

Broken is beautiful.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "origami-fold", name: "Origami Fold", desc: "Paper 3D • Unfold • Envelope", fullDesc: `PAPER FOLDING INTERFACE - Content unfolds like origami.

COLORS: Paper white #FAFAFA for surfaces, soft shadows, fold lines in subtle gray #E5E5E5. Accent colors peek through folds.

TYPOGRAPHY: Clean sans-serif (Inter, Helvetica). Content appears after unfold animations complete.

LAYOUT: Sections are folded "paper" that unfolds on scroll. Cards fold/unfold on interaction. 3D space required.

KEY EFFECTS:
- 3D TRANSFORMS: transform-style: preserve-3d on containers
- FOLD LINES: Linear gradient creating crease shadows
- Paper texture: Subtle noise in background
- Envelope flap: Triangle that rotates open
- Multiple fold points with different rotateX values

ANIMATIONS:
- UNFOLD: rotateX(-180deg) → rotateX(0) around top edge (transform-origin: top)
- Staggered unfold: Parent unfolds, then children unfold
- CREASE SHADOWS animate with fold angle
- Content FADES IN after paper fully open
- Reverse fold on scroll up

CSS:
.folded { 
  transform: perspective(1000px) rotateX(-90deg);
  transform-origin: top center;
}
.unfolded {
  transform: perspective(1000px) rotateX(0deg);
  transition: transform 0.8s ease-out;
}

Tactile, crafted, delightful.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  
  { id: "spatial-glass", name: "Spatial Glass", desc: "Vision Pro • 3D Tilt • Light", fullDesc: `APPLE VISION PRO AESTHETIC - Spatial computing glass UI.

COLORS: Dark environment #0A0A0F, glass surfaces bg-white/5 to bg-white/10. Subtle purple/blue ambient glow. Text white.

TYPOGRAPHY: SF Pro Rounded or system-ui. Weight 500-600. Generous spacing. Floating labels in 3D space.

LAYOUT: Cards float in 3D space with depth. Multiple layers at different Z positions. Perspective container.

KEY EFFECTS:
- THICK GLASS: bg-white/8 backdrop-blur-[60px] rounded-3xl border border-white/20
- REFLECTIONS: Gradient overlay simulating light source from top-left
- AMBIENT GLOW: Soft colored shadows behind cards (purple/blue)
- DEPTH LAYERS: transform: translateZ(10px) on nested elements
- Specular highlight: Thin bright line on top edge

ANIMATIONS:
- MOUSE PARALLAX TILT: Cards rotateX/rotateY based on cursor position
- Hover LIFT: translateZ increases, shadow expands
- Ambient glow BREATHES: opacity animation 4s infinite
- Smooth spring physics on all transitions
- Content appears with depth (scale + translateZ)

visionOS feel - everything floats, reacts to presence.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "kinetic-brutalism", name: "Kinetic Brutalism", desc: "15vw Type • Acid Yellow • Bold", fullDesc: `KINETIC BRUTALISM - The loudest voice in the room wins.

Imagine opening a website and getting PUNCHED by typography so massive it barely fits the screen. Headlines at 15-20vw that make you scroll sideways. Pure #000000 black void background with acid #E5FF00 yellow that SCREAMS. This isn't design - it's a statement.

THE VIBE: An angry punk poster meets high-end fashion editorial. Typography that moves with scroll velocity - the faster you scroll, the more it SKEWS and DISTORTS. Letters that animate individually like they're being typed by an aggressive machine. Sections that SLAM into view from off-screen.

SIGNATURE ELEMENTS:
- Headlines so big they become abstract shapes
- Text that physically reacts to scroll speed (skew, stretch, blur)
- Instant color inversions on hover - no smooth transitions, just BAM
- Thick brutal borders (4-8px) dividing sections like industrial zones
- Zero rounded corners - everything sharp, everything aggressive
- Sections alternate: black bg/yellow text → yellow bg/black text
- Marquee strips of repeated text flying across the screen

THE FEELING: Walking into a Berlin techno club at 3am. Brutalist architecture meets motion graphics. Confidence without compromise.

⚠️ CRITICAL: Extract ALL content from the video. Style transforms appearance only.`, category: "creative" },
  { id: "gravity-physics", name: "Gravity Physics", desc: "Falling Tags • Drag & Throw • Bounce", fullDesc: `PHYSICS PLAYGROUND - Interactive falling elements.

COLORS: Light bg #FAFAFA or dark #0a0a0a. Colorful physics objects: tags, pills, shapes in vibrant colors.

TYPOGRAPHY: Playful rounded fonts (Nunito, Poppins). Content inside physics-enabled elements.

LAYOUT: Elements fall from top on load, pile up at bottom. Draggable, throwable. Walls on edges.

KEY EFFECTS (CSS approximation):
- FALLING: animation: fall 2s ease-in forwards with random delays
- BOUNCE: animation-timing-function: cubic-bezier(.17,.67,.83,.67) for bounce
- COLLISION: Elements stop at viewport bottom (use absolute positioning)
- DRAG: draggable="true" with JavaScript or CSS cursor:grab
- SCATTERED: Random rotations and positions

ANIMATIONS:
- FALL: translateY(-100vh) → translateY(0) with gravity easing
- BOUNCE: Multiple keyframes for realistic bounce
- THROW: After drag, momentum animation in release direction
- PILE UP: Elements rest on each other (requires JS or clever CSS)
- WIGGLE on hover: small rotation animation

Simple CSS physics:
@keyframes fall {
  0% { transform: translateY(-50vh) rotate(-20deg); }
  70% { transform: translateY(0) rotate(5deg); }
  85% { transform: translateY(-20px) rotate(-3deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

Playful, interactive, joyful.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "neo-retro-os", name: "Neo-Retro OS", desc: "Windows 95 • Draggable • Vaporwave", fullDesc: `Y2K OPERATING SYSTEM UI - Windows 95 meets cyberpunk.

COLORS: Desktop #008080 (teal) or #000080 (navy), window chrome #C0C0C0, title bar gradient blue #000080 to #1084D0. Vaporwave pink #FF71CE, cyan #01CDFE accents.

TYPOGRAPHY: MS Sans Serif, Tahoma, or system-ui. Small sizes 11-14px. Title bars centered or left-aligned.

LAYOUT: Floating windows that can be dragged. Desktop icons grid. Taskbar at bottom. Start menu.

KEY EFFECTS:
- BEVELED BORDERS: box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #555, inset 2px 2px #dfdfdf
- Title bar: bg-gradient-to-r from-[#000080] to-[#1084D0] with close/minimize/maximize buttons
- Window content: bg-[#c0c0c0] with inset borders
- Icons: 32x32px with pixelated look
- Taskbar: fixed bottom, bg-[#c0c0c0], border-t

ANIMATIONS:
- Window OPEN: Scale from 0 with slight bounce
- MINIMIZE: Scale down + translateY to taskbar
- DRAG: Cursor grab, element follows mouse
- GLITCH: CRT flicker on entry
- Scan lines: Subtle overlay

Full retro computing nostalgia with modern twist.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "soft-clay-pop", name: "Soft Clay Pop", desc: "Claymorphism • Pastel • Bouncy", fullDesc: `CLAYMORPHISM - Soft 3D tactile interface.

COLORS: Soft pastel bg #FFE5EC (pink), #E0F4FF (blue), #FFF4E0 (cream). Elements in white or slightly darker pastels. Shadows in color-matched darker shades.

TYPOGRAPHY: Rounded fonts - Nunito, Quicksand, Poppins. Weight 600-700 for headings. Friendly, approachable.

LAYOUT: Chunky cards with heavy rounded corners (rounded-3xl or rounded-[30px]). Generous padding. Playful asymmetry.

KEY EFFECTS:
- DOUBLE SHADOW (Clay effect):
  box-shadow: 
    8px 8px 16px rgba(0,0,0,0.1),
    -4px -4px 12px rgba(255,255,255,0.9),
    inset 1px 1px 2px rgba(255,255,255,0.5);
- Inner highlight on top-left edge
- Outer shadow colored (not gray): rgba(FFE5EC darker, 0.3)
- Pressed state: Shadows shrink, slight scale down
- Very rounded everything: buttons, inputs, cards

ANIMATIONS:
- BOUNCY spring physics on all interactions
- Scale 1 → 1.02 with overshoot on hover
- SQUISH on click: scaleY(0.95) then bounce back
- Jelly wobble: subtle wiggle animation
- Float: gentle up/down movement

Feels like touching soft clay or marshmallows.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "deconstructed-editorial", name: "Deconstructed Editorial", desc: "Fashion • Vertical Text • Chaos", fullDesc: `AVANT-GARDE FASHION EDITORIAL - Controlled chaos.

COLORS: High contrast - black #000000 and white #FFFFFF primarily. One accent color used dramatically (red #FF0000 or gold #FFD700).

TYPOGRAPHY: Mixed type: Serif (Playfair) for elegance, Sans (Helvetica) for modernity. VERTICAL TEXT: writing-mode: vertical-rl. VARYING sizes in same layout.

LAYOUT: OVERLAP is intentional. Grid exists but elements break it. Images overlap text. Text overlaps images. Z-index wars.

KEY EFFECTS:
- VERTICAL TEXT: rotate(-90deg) or writing-mode for sidebars, labels
- OVERLAP: absolute positioning, negative margins, elements crossing boundaries
- CROPPED IMAGES: object-fit: cover with unusual aspect ratios
- SPLIT WORDS: Half a headline on one side, half on other
- Magazine folios: Page numbers, issue dates in corners

ANIMATIONS:
- PARALLAX: Different layers move at different scroll speeds
- TEXT REVEAL: Words appear from behind masks
- IMAGE PAN: Images slowly shift while in view
- Staggered fade in from scattered positions
- Hover reveals hidden content beneath

Editorial chaos with invisible underlying structure.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "cinematic-product", name: "Cinematic Product", desc: "Apple Page • Scroll-Driven 3D", fullDesc: `APPLE-STYLE PRODUCT SHOWCASE - Scroll-driven cinematography.

COLORS: Clean backgrounds - white #FFFFFF sections, black #000000 sections alternating. Product is the color focus.

TYPOGRAPHY: SF Pro or Inter. Headlines large but not overwhelming (text-5xl to text-7xl). Weight 600. Generous tracking.

LAYOUT: Full-viewport sections. Product STICKY in center while text scrolls. Single focus per section.

KEY EFFECTS:
- STICKY PRODUCT: position: sticky; top: 50vh; centered
- Ghost text: Large faded text behind product (text-[20vw] opacity-5)
- Product transforms with scroll: rotate3d based on scroll position
- Multiple angles revealed in sequence
- Feature callouts appear/fade with scroll progress

ANIMATIONS:
- SCROLL-DRIVEN rotation: Product rotates as you scroll (CSS scroll-linked or JS)
- Text FADES through: Sections fade in/out while product stays
- REVEAL SEQUENCE: Features highlight one at a time
- Subtle PARALLAX: Background moves slower than foreground
- Smooth camera-like transitions between sections

Think iPhone product page. Elegant. Focused. Cinematic.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  
  // === DARK PREMIUM ===
  { id: "linear", name: "Linear Dark", desc: "Linear.app • Clean Dark • Subtle Glow", fullDesc: `LINEAR.APP INSPIRED - Developer-focused dark elegance.

COLORS: Bg #0a0a0a (near-black), text #fafafa (off-white), muted #737373, borders #262626. Accent: subtle purple #8b5cf6 for links/highlights.

TYPOGRAPHY: Inter font, -0.02em letter-spacing on headings. Light body weight (400), medium headings (500-600). Clean hierarchy.

LAYOUT: Clean sections with lots of breathing room. Cards have bg-white/[0.02] with border border-white/[0.06]. Rounded-xl corners. Generous padding p-6 to p-12.

KEY EFFECTS:
- Subtle glow on hover: box-shadow: 0 0 20px rgba(139,92,246,0.1)
- Cards lift slightly on hover: transform: translateY(-2px)
- Smooth 300ms transitions on everything
- Gradient text for hero: bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text

ANIMATIONS: Fade in up (y: 10px → 0, opacity 0 → 1), stagger children by 50ms. No aggressive motion - everything feels calm and professional.

⚠️ MANDATORY FLOW PRESERVATION:
- If video shows MULTIPLE SCREENS/PAGES → create SEPARATE navigable sections
- Each screen = separate section with working navigation links between them
- Style changes APPEARANCE only, NEVER removes content or screens`, category: "dark" },
  { id: "binary-contrast", name: "Binary Contrast Editorial", desc: "Split Screen • Serif vs Mono • Binary", fullDesc: `DUALISTIC EDITORIAL - Human elegance vs Machine precision.

CORE: Two worlds colliding. Alternating themes throughout page.

.theme-human (Organic): Bg #F3F3F1 (bone), text #1A1A1A, warm paper feel.
.theme-machine (Digital): Bg #0A0A0A (void), text #F0F0F0, borders #333.

TYPOGRAPHY CLASH (the heart!):
- HUMAN (Serif): Playfair Display, weight 400, italic for emphasis. Headlines, quotes.
- MACHINE (Mono): JetBrains Mono, UPPERCASE, 10-12px, tracking-widest. Tags [WORK], // prefixes, dates.

LAYOUT: Split screen 50/50 (grid-cols-2). LEFT sticky while RIGHT scrolls. Thin 1px borders. Sections alternate themes.

NAVIGATION: Technical style [ WORK ] [ ABOUT ] [ CONTACT ].

KEY SECTIONS: Split hero ("HUMAN" left, "MACHINE" right), sticky project gallery, numbered services (01), stats.

ANIMATIONS: Curtain reveal (clip-path), ScrollTrigger pinning, hover underline draws left→right, line draw on scroll, Lenis smooth scroll.

⚠️ MANDATORY FLOW PRESERVATION:
- If video shows MULTIPLE SCREENS/PAGES → create SEPARATE navigable sections
- Each screen = separate section with working navigation links between them
- Style changes APPEARANCE only, NEVER removes content or screens
- Count screens in video and ensure ALL are represented`, category: "creative" },
  { id: "paper-kinetic", name: "Paper Kinetic Swiss", desc: "Swiss Paper • Elastic Motion • Parallax", fullDesc: `PLAYFUL SWISS MINIMALISM - Organic Tech meets Print.

COLORS (LIGHT theme): Bg #F2F2F0 (warm paper), text #111111 (deep graphite), borders #E0E0E0, hover accent #FF5500.

TYPOGRAPHY: Neue Haas Grotesk / Helvetica Now for headings - TIGHT tracking (-0.04em), Black weight, text-justify stretched. Inter for body, large line-height (1.5-1.6).

LAYOUT: CSS Grid with visible thin borders. ASYMMETRIC 70/30 or 75/25 columns. LEFT headers STICKY while RIGHT scrolls. Generous whitespace.

KEY SECTIONS: Giant title split into letters (stagger animate), accordion/list with hover image reveal, big number counters (0 → value), image gallery with clip-path reveal, infinite marquee, full-screen footer CTA.

ANIMATIONS (GSAP + Lenis):
- Smooth scroll with momentum (Lenis-style)
- Scroll SKEW: content tilts during fast scroll
- Image PARALLAX: clip-path inset reveal + slower internal movement
- TEXT STAGGER: letters animate with elastic easing
- HOVER REVEAL: images appear following cursor
- NUMBER COUNTER: stats count up from 0

⚠️ MANDATORY FLOW PRESERVATION:
- If video shows MULTIPLE SCREENS/PAGES → create SEPARATE navigable sections
- Each screen = separate section with working navigation links between them
- Style changes APPEARANCE only, NEVER removes content or screens
- Count screens in video and ensure ALL are represented`, category: "light" },
  { id: "void-terminal", name: "Void Terminal System", desc: "Modular Grid • Monospace • GSAP Reveal", fullDesc: `DARK COMMAND CENTER - Futuristic spaceship OS interface.

COLORS: Bg #050505 (near-black), text #E6E6E6 (off-white), meta #777777 (gray), borders #1F1F1F. NO gradients - pure flat industrial.

TYPOGRAPHY:
- PRIMARY: Inter/Helvetica, UPPERCASE headings, weight 700-800, tracking -0.03em, text-6xl to text-9xl for hero.
- SECONDARY: Space Mono/JetBrains Mono for // 01 numbering, dates, labels. Size 11-13px, color #777.

LAYOUT: Modular "Bento Box" grid. EVERY section has visible border-bottom and/or border-right (1px #1F1F1F). Large padding p-8 to p-12.

KEY SECTIONS: Massive brand name hero with system status ("// SYSTEM LOADED"), technical navigation ("H o m e"), project rows with hover image reveal, infinite marquee ("SERVICES / MODULE INDEX /"), numbered services grid, blockquote testimonials.

ANIMATIONS:
- TEXT REVEAL: headings animate from bottom (translateY 100%→0) inside overflow:hidden
- SCROLL TRIGGER: borders draw/expand width 0%→100%
- SMOOTH SCROLL: inertia momentum
- MARQUEE: infinite horizontal scroll

⚠️ MANDATORY FLOW PRESERVATION:
- If video shows MULTIPLE SCREENS/PAGES → create SEPARATE navigable sections
- Each screen = separate section with working navigation links between them
- Style changes APPEARANCE only, NEVER removes content or screens
- Count screens in video and ensure ALL are represented`, category: "dark" },
  { id: "aura-glass", name: "High-End Dark Glass", desc: "Aurora Glow • Spotlight • Premium", fullDesc: `PREMIUM DARK GLASS - High-end SaaS aesthetic.

COLORS: Solid #050505 black bg. Text white #ffffff. Muted #a1a1aa. Accent glow: purple rgba(139,92,246,0.12), cyan rgba(6,182,212,0.08).

TYPOGRAPHY: Inter or Geist. Headlines weight 500-600, not too bold. Body weight 400. Generous letter-spacing on small text.

LAYOUT: Single background gradient (NOT multiple divs). Centered content. Cards float on glass with generous p-8 padding.

KEY EFFECTS:
- ONE aurora gradient in background: background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 50%), radial-gradient(ellipse 40% 30% at 80% 20%, rgba(6,182,212,0.08) 0%, transparent 40%), #050505
- Glass cards: bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl
- Subtle glow on card hover: shadow-lg shadow-purple-500/5

ANIMATIONS:
- Cards fade in from bottom
- Hover: border brightens to border-white/15
- Smooth 300ms transitions
- No aggressive motion

⚠️ MANDATORY: Preserve ALL content from video.`, category: "dark" },
  { id: "void-spotlight", name: "Void Spotlight", desc: "Deep Void • Mouse Glow • Heavy", fullDesc: `VOID SPOTLIGHT - Heavy dark minimalism with interactive light.

COLORS: Pure black #000000 background. Text #e5e5e5 (not pure white). Borders appear only on hover. NO colors except white/black.

TYPOGRAPHY: System UI or Inter. Weight 400-500. Clean, minimal. Large hero text, small body.

LAYOUT: Sparse, heavy. Few elements. Maximum negative space. Content floats in void.

KEY EFFECTS:
- Cards invisible until hover: border border-transparent hover:border-white/20
- Optional: CSS spotlight that follows mouse using custom properties
- Very subtle gradient on hero area only
- High contrast but minimal decoration

ANIMATIONS:
- Borders fade in on hover (300ms)
- Content reveals slowly from darkness
- Optional: radial-gradient follows cursor position
- Everything feels heavy, deliberate

The void is the design. Light reveals content on demand.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "dark" },
  { id: "dark-cosmos", name: "Dark Cosmos", desc: "Purple/Cyan Glow • Glass • Float", fullDesc: `COSMIC DARK - Space-inspired glass morphism.

COLORS: Deep black #030303 bg. Two corner glows: purple rgba(139,92,246,0.1), cyan rgba(6,182,212,0.08). Text white, muted #9ca3af.

TYPOGRAPHY: Inter or Space Grotesk. Headlines weight 600, clean and modern. Body 400.

LAYOUT: Single combined background (NOT multiple divs). Cards float with depth. Generous spacing.

KEY EFFECTS:
- Combined corner glows: background: radial-gradient(circle at 20% 20%, rgba(139,92,246,0.1) 0%, transparent 30%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 30%), #030303
- Floating cards: bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl
- Stars effect: tiny white dots scattered (optional)

ANIMATIONS:
- Cards float slightly (translateY animation, 4-6s infinite)
- Fade in with scale 0.98 → 1
- Glow intensifies on hover
- Smooth cosmic feel

⚠️ MANDATORY: Preserve ALL content from video.`, category: "dark" },
  { id: "liquid-chrome", name: "Liquid Chrome", desc: "Metallic • Y2K • Reflections", fullDesc: `LIQUID CHROME - Mercury meets machine. The future imagined in 1999.

Picture this: A website that looks like it's made of liquid metal. Headlines that SHIMMER with animated chrome gradients - silver, white, gray flowing across the text like mercury dripping. The kind of aesthetic you'd see on a Y2K concept car or a Playstation 2 startup screen.

THE VIBE: Deep void black (#000000) background. Everything metallic FLOATS against the darkness. Text that looks like it was forged from chrome - with real animated shine effects that sweep across continuously. Borders that catch light like polished steel.

SIGNATURE ELEMENTS:
- Chrome/metallic gradient text that ANIMATES - the shine sweeps across endlessly
- Reflective surfaces on cards - like looking at brushed aluminum
- Geometric shapes with metallic edges
- Futuristic typography (think sci-fi movie credits)
- Elements that feel HEAVY and PRECIOUS - like touching cold metal
- Subtle 3D transforms giving depth - things floating in space
- Light reflections that move when you scroll
- That distinctive Y2K "what will the future look like" optimism

THE FEELING: The lobby of a luxury spaceship. A car showroom in 2099. Chrome everything, darkness everywhere else.

⚠️ CRITICAL: Extract ALL content from the video. Style transforms appearance only.`, category: "dark" },
  
  // === LIGHT & CLEAN ===
  { id: "swiss-grid", name: "Swiss Grid", desc: "Visible Grid • Massive Type • Sharp", fullDesc: `SWISS INTERNATIONAL STYLE - Precision typography on grid.

COLORS: Pure white #ffffff bg, pure black #000000 text. Grid lines #e5e5e5 (1px). NO gradients, NO colors except black/white.

TYPOGRAPHY: Helvetica Neue or Inter. Headlines: weight 700-900, TIGHT tracking -0.04em, sizes text-6xl to text-9xl. Body: weight 400, 16-18px, line-height 1.5.

LAYOUT: VISIBLE grid lines (border-r border-b border-gray-200 on columns). 12-column grid. Asymmetric layouts 8/4 or 7/5. Text aligns to grid.

KEY EFFECTS:
- Headlines split across columns
- Numbered sections (01, 02, 03) in small mono
- Red #ff0000 as ONLY accent (use sparingly - one element)
- Sharp corners everywhere (rounded-none)

ANIMATIONS:
- Text reveals from bottom with mask (overflow-hidden + translateY)
- Grid lines draw on scroll (width 0% → 100%)
- Numbers count up
- NO bouncy effects - all linear or ease-out

⚠️ MANDATORY: Preserve ALL content from video.`, category: "light" },
  { id: "silent-luxury", name: "Silent Luxury", desc: "Radical Minimal • White Void", fullDesc: `RADICAL MINIMALISM - Luxury through absence.

COLORS: Pure white #ffffff everywhere. Text #000000 pure black. Nothing else. NO grays, NO colors.

TYPOGRAPHY: ONE typeface only - Didot, Cormorant Garamond, or Times New Roman. Headlines weight 400 (not bold!), italic for emphasis. Sizes: hero text-4xl to text-6xl, body text-lg to text-xl.

LAYOUT: EXTREME whitespace - sections have py-40 to py-64. Content max-w-2xl centered. Single column. One element per view.

KEY EFFECTS:
- Almost nothing visible at first
- Tiny 8px monospace footer text
- Thin 1px horizontal rules as only decoration
- Cursor changes to small dot

ANIMATIONS:
- ULTRA SLOW reveals: 1.5-2s duration
- Opacity only - no movement
- Stagger delay 300-500ms between elements
- Hover: subtle letter-spacing increase

This style is about what's NOT there. Emptiness is the feature.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "light" },
  { id: "soft-organic", name: "Soft Organic", desc: "Blobs • Pastel • Underwater", fullDesc: `ORGANIC SOFT UI - Underwater dreamscape aesthetic.

COLORS: Cream bg #FFF5F5 or #F0F7FF. Pastel blobs: pink rgba(255,182,193,0.4), blue rgba(173,216,230,0.4), lavender rgba(230,190,255,0.3). Text #2d3748.

TYPOGRAPHY: Rounded fonts - Nunito, Quicksand, or Poppins. Weight 500-600 for headings, 400 for body. Soft, friendly feel.

LAYOUT: Organic shapes, no sharp corners. Cards rounded-3xl. Content flows naturally. Overlapping elements OK.

KEY EFFECTS:
- ANIMATED BLOBS: Absolute divs with w-[400px] h-[400px] rounded-full blur-[80px], animate position slowly
- Cards: bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl
- Floating elements with subtle up/down animation
- Blob shapes using border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%

ANIMATIONS:
- Blobs drift slowly (transform translate, 15-20s infinite)
- Elements float up/down 10px (2-3s infinite ease-in-out)
- Fade in with scale 0.95 → 1
- Hover: slight lift and glow

⚠️ MANDATORY: Preserve ALL content from video.`, category: "light" },
  { id: "ethereal-mesh", name: "Ethereal Mesh", desc: "Aurora Blobs • Soft SaaS • Modern", fullDesc: `ETHEREAL GRADIENT MESH - Modern SaaS dreaminess.

COLORS: White #ffffff or soft gray #fafafa bg. Gradient blobs: violet rgba(139,92,246,0.15), cyan rgba(34,211,238,0.12), rose rgba(244,114,182,0.1). Text #1e293b.

TYPOGRAPHY: Inter or Satoshi. Clean modern feel. Headlines weight 600, body 400. Good hierarchy with size contrast.

LAYOUT: Centered content max-w-6xl. Cards in grids. Hero section with mesh gradient behind. Clean spacing p-8 to p-16.

KEY EFFECTS:
- MESH GRADIENT: Multiple overlapping radial-gradients with different positions and colors, animated subtly
- Glass cards: bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg
- Soft shadows: shadow-xl shadow-purple-500/5
- Gradient borders using background-clip

ANIMATIONS:
- Mesh background slowly shifts (background-position animation)
- Cards fade in from bottom with stagger
- Hover: translateY(-4px) + shadow increase
- Smooth 300ms transitions

⚠️ MANDATORY: Preserve ALL content from video.`, category: "light" },
  { id: "neubrutalism", name: "Neo-Brutalism", desc: "Hard Shadow • Thick Border • Bouncy", fullDesc: `NEO-BRUTALISM - Bold, playful, unapologetic design.

COLORS: Bright backgrounds - #FFE566 yellow, #A7F3D0 mint, #FCA5A5 coral, #93C5FD blue. Black #000000 for borders and text. White for cards.

TYPOGRAPHY: Bold sans-serif - Space Grotesk, Archivo Black. Headlines weight 800-900, LARGE sizes text-5xl to text-8xl. Tight tracking.

LAYOUT: Chunky elements. Thick 3-4px black borders on EVERYTHING. Cards offset with hard shadows. Asymmetric playful layouts.

KEY EFFECTS:
- HARD SHADOW: Every card/button has box-shadow: 4px 4px 0 #000 (or 6px 6px 0)
- Thick borders: border-[3px] border-black rounded-xl
- Bright solid color fills
- Hover: shadow offset increases to 6px 6px

ANIMATIONS:
- BOUNCY spring physics on interactions
- Cards bounce on hover (scale 1.02 with spring)
- Shadow shifts on click (2px 2px 0)
- Playful wiggle on buttons

Fun, loud, confident. Nothing subtle here!

⚠️ MANDATORY: Preserve ALL content from video.`, category: "light" },
  
  // === MOTION & SCROLL ===
  { id: "xray-blueprint", name: "X-Ray Blueprint", desc: "Wireframe Reveal • Scanner • Technical", fullDesc: `TECHNICAL BLUEPRINT INTERFACE - Engineering aesthetic with reveal effects.

COLORS: Dark blue #0a1628 bg, blueprint cyan #00D4FF for lines, white #FFFFFF for revealed content. Grid lines #1a2a40.

TYPOGRAPHY: JetBrains Mono for labels, Inter for content. Technical, precise. Small sizes for annotations (10-12px).

LAYOUT: Grid overlay visible at all times. Content reveals from wireframe to solid state.

KEY EFFECTS:
- BLUEPRINT GRID: repeating-linear-gradient creating grid pattern, 20px squares
- WIREFRAME STATE: Elements have border only, no fill, dashed lines
- SOLID STATE: Elements fill in when cursor approaches
- Scanner line: Horizontal gradient line sweeps across
- Technical annotations: Small labels with leader lines

ANIMATIONS:
- WIREFRAME → SOLID: On mouse proximity, elements transition from stroke-only to filled
- SCAN LINE: animation: scan 6s linear infinite (top to bottom)
- LINE DRAW: stroke-dashoffset animation for path reveals
- Blueprint FADE: Sections reveal as scroll progresses
- Pulsing nodes at intersection points

Technical, precise, engineering elegance.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "motion" },
  { id: "digital-collage", name: "Digital Collage", desc: "Scrapbook • Stickers • Draggable", fullDesc: `MIXED MEDIA SCRAPBOOK - Digital craft aesthetic.

COLORS: Paper/cork bg #D4C4A8 or soft pastels. Stickers in bright colors. Tape in cream/beige. Shadows dark.

TYPOGRAPHY: Mix of styles - handwritten (Caveat), typewriter (Courier), modern (Inter). Random rotations on text blocks.

LAYOUT: Scattered elements like a physical scrapbook. Overlapping intentional. Random rotations (-5deg to 5deg).

KEY EFFECTS:
- PAPER TEXTURE: Subtle noise pattern, slight yellowing
- STICKERS: Drop shadows (4px 4px 0 rgba(0,0,0,0.2)) with white border
- TAPE: Transparent cream strips with rotate
- POLAROID: White border photos with handwritten captions
- Torn edges: clip-path with irregular shapes
- Paper clips, pins as decoration

ANIMATIONS:
- DRAGGABLE: Elements can be moved (cursor grab, drag events)
- DROP SHADOW grows on lift
- SCATTER on load: Elements animate in from random directions
- Subtle WOBBLE on hover
- Z-index changes when interacting (lifted item on top)

Crafted, personal, nostalgic.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "motion" },
  { id: "opposing-scroll", name: "Opposing Scroll Streams", desc: "Bi-Directional • Velocity • Marquee", fullDesc: `BI-DIRECTIONAL KINETIC TYPOGRAPHY - Opposing flow of text streams.

COLORS: Dark bg #0a0a0a, text alternating white #FFFFFF and accent color (cyan #00FFFF, magenta #FF00FF).

TYPOGRAPHY: Large sans-serif (Inter, Helvetica) or display fonts. UPPERCASE. Sizes text-4xl to text-8xl. Tight tracking.

LAYOUT: Horizontal bands of text spanning full viewport width. Multiple rows stacked vertically.

KEY EFFECTS:
- ODD ROWS: Move LEFT on scroll (translateX decreases)
- EVEN ROWS: Move RIGHT on scroll (translateX increases)
- Velocity-based: Faster scroll = faster movement
- Text repeats infinitely (duplicated content)
- Rows can have different colors/sizes

ANIMATIONS:
- INFINITE SCROLL: translateX animation with linear timing
- VELOCITY LINK: Animation speed tied to scroll velocity
- HOVER PAUSE: Row pauses when cursor is on it
- BLUR on fast movement: Optional blur effect during quick scroll
- Direction FLIP: Some rows reverse direction periodically

CSS:
@keyframes scrollLeft {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
Row 1: animation: scrollLeft 20s linear infinite;
Row 2: animation: scrollLeft 20s linear infinite reverse;

Hypnotic, dynamic, kinetic.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "motion" },
  { id: "stacked-cards", name: "Stacked Card Deck", desc: "iOS Tabs • Depth • Scale", fullDesc: `CARD STACK INTERFACE - iOS Safari tabs aesthetic.

COLORS: Dark bg #000000, cards in white or glass. Each card can have distinct background.

TYPOGRAPHY: Clean sans-serif. Card titles at top. iOS system-like feel.

LAYOUT: Cards stacked vertically with perspective. Top card full size, lower cards scaled down and shifted.

KEY EFFECTS:
- STACK PERSPECTIVE: Cards behind are scaled 0.9, 0.8, 0.7 etc
- BRIGHTNESS: Lower cards are darker (filter: brightness(0.8))
- OFFSET: Each card translateY slightly more than previous
- Card chrome: Rounded top corners, subtle shadow
- Visible peek of cards behind

ANIMATIONS:
- SCROLL TO CYCLE: Scroll moves top card away, reveals next
- Scale + translateY animate simultaneously
- Brightness transitions with depth
- SPRING physics on card selection
- Drag to reorder: Pick up and drop cards

CSS stack effect:
.card:nth-child(1) { transform: translateY(0) scale(1); }
.card:nth-child(2) { transform: translateY(20px) scale(0.95); filter: brightness(0.9); }
.card:nth-child(3) { transform: translateY(40px) scale(0.9); filter: brightness(0.8); }

Tactile, stackable, familiar.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "motion" },
  { id: "horizontal-inertia", name: "Horizontal Inertia Gallery", desc: "Skew • Velocity • Spring", fullDesc: `VELOCITY-DRIVEN GALLERY - Horizontal scroll with physics.

COLORS: Dark bg #0a0a0a, images with subtle glow, text white.

TYPOGRAPHY: Clean sans-serif for captions. Small sizes. Content secondary to images.

LAYOUT: Horizontal strip of images. Vertical scroll drives horizontal position.

KEY EFFECTS:
- HORIZONTAL SCROLL: Vertical scroll input → horizontal translateX output
- VELOCITY SKEW: Images skewX based on scroll speed (fast = more skew)
- DIRECTION TILT: Skew direction matches scroll direction
- Gaps between images consistent
- Overflow hidden on container

ANIMATIONS:
- MOMENTUM: Continues moving after scroll stops, decelerates smoothly
- SKEW RECOVERY: skewX animates back to 0 when stopped
- SPRING PHYSICS: Overscroll bounces back
- Image PARALLAX: Images move slightly faster/slower than container
- Scale on HOVER: Hovered image grows slightly

CSS skew on scroll:
element.style.transform = \`translateX(\${scrollPos}px) skewX(\${velocity * 0.1}deg)\`;

Smooth, physical, gallery-focused.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "motion" },
  { id: "split-curtain", name: "Split Curtain Reveal", desc: "Dual Panel • Theater • Typography Split", fullDesc: `THEATRICAL CURTAIN REVEAL - Split screen drama.

COLORS: Curtain panels in black #000000 or rich color (burgundy #722F37, navy #1a1a4e). Revealed content behind in contrast.

TYPOGRAPHY: Large headlines that split with panels. Half on left, half on right.

LAYOUT: Two panels covering screen. Content behind revealed when panels separate.

KEY EFFECTS:
- LEFT PANEL: translateX(-100%) to move off left
- RIGHT PANEL: translateX(100%) to move off right
- SPLIT TYPOGRAPHY: Word/headline literally divided - first half stays with left, second with right
- Content behind already positioned, just hidden by panels
- Panels can have texture or gradient

ANIMATIONS:
- TRIGGER: On scroll, user action, or page load
- Panels slide apart: 0.8-1.2s with ease-out
- Typography SPLITS: Letters separate with panels
- Revealed content FADES IN as panels separate
- Optional: Panels can close again on scroll up

Theater reveal:
.panel-left { transform: translateX(-50%); transition: transform 1s ease-out; }
.panel-left.open { transform: translateX(-100%); }
.panel-right { transform: translateX(50%); }
.panel-right.open { transform: translateX(100%); }

Dramatic, theatrical, memorable.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "motion" },
  
  // === INTERACTIVE & CURSOR ===
  { id: "phantom-border", name: "Phantom Border UI", desc: "Invisible Grid • Cursor Proximity • Glow", fullDesc: `CURSOR-REACTIVE GRID - Invisible until revealed.

COLORS: Dark bg #0a0a0a, grid lines glow when revealed: cyan #00FFFF, purple #8B5CF6. Text white.

TYPOGRAPHY: Clean, modern sans-serif. Content floats above grid.

LAYOUT: Invisible grid underlying entire page. Only visible near cursor.

KEY EFFECTS:
- INVISIBLE GRID: Grid lines exist but opacity: 0 by default
- RADIAL REVEAL: Radial gradient follows cursor, reveals grid where it touches
- Gradient mask: radial-gradient from cursor position fading outward
- Grid lines glow: box-shadow or text-shadow for glow effect
- INSTANT response: transition: 0s for immediate reveal

ANIMATIONS:
- Cursor follow: Update CSS custom properties --mouse-x, --mouse-y
- Grid FADES IN near cursor, fades out as cursor leaves
- Glow PULSES: subtle animation on revealed lines
- Optional: Particles at intersection points
- Smooth gradient position updates

CSS:
.grid-overlay {
  mask-image: radial-gradient(circle 200px at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%);
}

Mysterious, reactive, discover-by-exploration.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "interactive" },
  { id: "inverted-lens", name: "Inverted Lens Cursor", desc: "Window Mask • Hidden Layer • Reveal", fullDesc: `CURSOR AS WINDOW - Reveals hidden inverted layer.

COLORS: Main layer: black #000000 bg, white text. Hidden layer: white #FFFFFF bg, black text. Same content, inverted.

TYPOGRAPHY: Same font and layout in both layers, but inverted colors.

LAYOUT: Two identical layers stacked. Cursor reveals bottom layer through circular mask.

KEY EFFECTS:
- DUAL LAYERS: Two divs with identical content, inverted colors
- Top layer: Visible normally
- Bottom layer: Only visible through cursor mask
- CIRCULAR MASK: clip-path: circle(100px at var(--x) var(--y)) on top layer
- Mask inverts - TOP layer is clipped, revealing BOTTOM

ANIMATIONS:
- CURSOR FOLLOW: Mask position updates with mouse (with optional lag)
- LAG EFFECT: CSS transition on clip-path position creates trailing
- SIZE PULSE: Mask circle size can breathe slightly
- Content can animate differently in each layer
- Smooth transitions 100-200ms on position

Effect:
.top-layer {
  clip-path: circle(100px at var(--mouse-x) var(--mouse-y));
}
// Actually invert: cut a hole in top layer

Surreal, playful, interactive discovery.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "interactive" },
  { id: "elastic-sidebar", name: "Elastic Sidebar Drag", desc: "Rubber Band • SVG Curve • Wobble", fullDesc: `RUBBER BAND SIDEBAR - Stretchy, elastic interaction.

COLORS: Any palette. Sidebar in solid color that contrasts with main content.

TYPOGRAPHY: Standard sidebar navigation typography.

LAYOUT: Sidebar on left, main content on right. Edge of sidebar is elastic.

KEY EFFECTS:
- ELASTIC EDGE: SVG path defines sidebar edge, curves when dragged
- RUBBER BAND: Pull past edge, snaps back
- Edge follows cursor Y position with curve bulge
- SVG clipPath masks sidebar content to curved edge
- Main content reveals behind curve

ANIMATIONS:
- DRAG: Sidebar edge curves toward cursor
- RELEASE: Spring animation back to straight edge (bounce, overshoot)
- WOBBLE: After snap back, edge wobbles (oscillating curve)
- Physics: Mass, tension, friction settings for spring
- Duration: 0.4-0.6s with spring easing

SVG path morphing:
<path d="M 0,0 Q 0,250 0,500" /> // straight
<path d="M 0,0 Q 100,250 0,500" /> // curved (100px bulge)

Playful, physical, delightful.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "interactive" },
  { id: "morphing-nav", name: "Morphing Fluid Nav", desc: "Dynamic Island • Apple Physics • Morph", fullDesc: `DYNAMIC ISLAND NAVIGATION - Shape-shifting nav bar.

COLORS: Nav bar in black #000000 or dark glass. Content white. Accent colors for active states.

TYPOGRAPHY: Clean sans-serif, weight 500. Labels appear/disappear based on state.

LAYOUT: Navigation as floating pill, centered or positioned. Changes shape based on interaction.

KEY EFFECTS:
- IDLE: Small pill, minimal content (logo or icon only)
- HOVER: Expands to medium rectangle, shows labels
- ACTIVE: Large rectangle with full content
- Smooth corner radius changes (rounded-full → rounded-xl)
- Content fades in/out with size changes

ANIMATIONS:
- MORPH: Width and height animate with spring physics
- VERY SNAPPY: Short duration (200-300ms) with spring overshoot
- Border radius animates with size
- Content OPACITY staggered with size change
- Hover OUT: Contracts back quickly

CSS:
.nav-idle { width: 60px; height: 40px; border-radius: 20px; }
.nav-hover { width: 200px; height: 50px; border-radius: 25px; }
.nav-active { width: 400px; height: 60px; border-radius: 16px; }
transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

Fluid, responsive, Apple-quality.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "interactive" },
  
  // === WEBGL & SHADERS ===
  { id: "chromatic-dispersion", name: "Chromatic Dispersion", desc: "RGB Split • Movement Speed • Shader", fullDesc: `RGB CHANNEL SEPARATION - Speed-based chromatic aberration.

COLORS: Any base palette. RGB channels visible when moving: Red offset left, Blue offset right, Green stable.

TYPOGRAPHY: Any font. Effect applies to all content.

LAYOUT: Standard layout. Effect is an overlay/post-process on entire page.

KEY EFFECTS:
- STATIC: Normal appearance, channels aligned
- MOVING: RGB channels offset based on velocity
- Red shadow: -3px horizontal offset
- Blue shadow: +3px horizontal offset
- Green: No offset (stable center)

ANIMATIONS:
- VELOCITY-LINKED: Faster scroll = more separation
- Direction matters: Scroll down = different direction than up
- Smooth interpolation: Separation fades in/out smoothly
- 3D GLASSES effect at high speed
- Returns to normal when motion stops

CSS approximation:
.rgb-split {
  text-shadow: 
    calc(-3px * var(--velocity)) 0 rgba(255,0,0,0.5),
    calc(3px * var(--velocity)) 0 rgba(0,0,255,0.5);
}
// Update --velocity with JavaScript based on scroll speed

Dynamic, technical, visually striking.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "shader" },
  { id: "viscous-hover", name: "Viscous Hover", desc: "Displacement Map • Liquid • Gooey", fullDesc: `LIQUID DISTORTION EFFECT - Images react like liquid.

COLORS: Any palette. Effect is distortion, not color change.

TYPOGRAPHY: Standard. Effect mainly on images.

LAYOUT: Image-heavy layouts. Effect on hover over images.

KEY EFFECTS:
- DISPLACEMENT: Image pixels shift based on cursor position
- LIQUID FEEL: Displacement creates bulge/ripple around cursor
- Trail effect: Distortion follows cursor with lag
- SVG FILTER: feTurbulence + feDisplacementMap
- Gooey: feGaussianBlur + feColorMatrix for metaball look

ANIMATIONS:
- CURSOR FOLLOW: Displacement center follows mouse
- RIPPLE: Distortion radiates outward from cursor
- VISCOUS LAG: Effect trails behind cursor movement
- Return to normal: Slowly settles when cursor leaves
- Continuous subtle movement on idle

SVG Filter:
<filter id="liquid">
  <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" />
  <feDisplacementMap in="SourceGraphic" scale="20" />
</filter>
Apply with filter: url(#liquid);

Organic, fluid, mesmerizing.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "shader" },
  { id: "globe-data", name: "Interactive Globe Data", desc: "3D Sphere • Points • Data Arcs", fullDesc: `3D DATA GLOBE - Network visualization on sphere.

COLORS: Dark space bg #000010, globe outline cyan #00FFFF, data points various bright colors, arcs white/cyan.

TYPOGRAPHY: Monospace for data labels. Small, technical.

LAYOUT: Large globe as centerpiece. Data readouts around edges. Can be sticky on scroll.

KEY EFFECTS (CSS approximation):
- 3D SPHERE: CSS circle with gradient creating sphere illusion, or actual 3D with transforms
- DATA POINTS: Absolute positioned dots on sphere surface
- ARC CONNECTIONS: Curved lines (SVG paths) connecting points
- Glow effect: box-shadow and filter blur on points
- ROTATION: Globe rotates slowly on Y axis

ANIMATIONS:
- CONTINUOUS ROTATION: animation: rotateY 30s linear infinite
- DATA ARCS: stroke-dashoffset animation for arc draw
- POINTS PULSE: scale and opacity animation
- HOVER: Stops rotation, allows drag interaction
- DATA FLOW: Dots travel along arcs

CSS 3D Sphere:
.globe {
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #1a3a5a 0%, #0a1020 70%);
  box-shadow: inset -20px -20px 40px rgba(0,0,0,0.5), 0 0 60px rgba(0,255,255,0.2);
  animation: rotateGlobe 30s linear infinite;
}

Data visualization, futuristic, impressive.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "shader" },
  { id: "liquid-text-mask", name: "Liquid Text Masking", desc: "Video in Text • Drip • SVG Goo", fullDesc: `VIDEO THROUGH TYPOGRAPHY - Text as window to video.

COLORS: Dark bg #000000, text reveals colorful video/image behind.

TYPOGRAPHY: MASSIVE display fonts (text-[20vw]+). Bold weight. Simple letters for clear mask.

LAYOUT: Giant text in center. Video/gradient plays behind, visible only through text.

KEY EFFECTS:
- TEXT MASK: background-clip: text with video/gradient as background
- Video plays through letterforms
- DRIP: SVG goo filter on text edges
- Edges melt/drip downward on hover
- Liquid animation on letterforms

ANIMATIONS:
- VIDEO PLAYS through text continuously
- HOVER DRIP: Letters stretch downward (scaleY at bottom)
- Goo filter: Morphing edges
- Individual letters can animate independently
- Ripple effect when clicked

CSS:
.liquid-text {
  font-size: 20vw;
  font-weight: 900;
  background: url('video.mp4') center/cover;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

SVG Goo filter for drip:
<filter id="goo">
  <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
  <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" />
</filter>

Bold, dynamic, eye-catching.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "shader" },
  { id: "noise-gradient", name: "Dynamic Noise Gradient", desc: "Canvas Grain • Perlin • Aurora", fullDesc: "AWWWARDS STYLE: Elegant dark canvas with subtle animated aurora gradient. Background: solid #0a0a0a. Add ONE flowing gradient overlay using CSS animation. Grain texture at 3% opacity for premium feel. Clean modern typography (Inter/Geist). Glassmorphism cards with backdrop-blur. Smooth micro-interactions on all interactive elements.", category: "shader" },
  { id: "stripe-aurora", name: "Stripe Aurora", desc: "Stripe.com Style • Gradient Blobs • Glass Cards", fullDesc: "AWWWARDS STYLE: Inspired by Stripe.com. LIGHT background (#ffffff or #fafafa). Multiple soft gradient BLOBS positioned around the page (not overlapping content). Blobs use: absolute positioning, large blur (80-150px), low opacity (0.3-0.5), colors: blue-500, purple-500, pink-500, orange-400. Content sits on TOP with white/glass cards. Clean Inter/SF Pro typography. Subtle shadows. Cards have white bg with very subtle border. Premium SaaS aesthetic.", category: "light" },
  { id: "liquid-metal", name: "Liquid Metal", desc: "Chrome Text • Animated Shine • Premium Hero", fullDesc: `LIQUID METAL - Chrome metallic text effect like Framer's LiquidMetal component.

⚠️ CRITICAL: You MUST include this EXACT CSS in a <style> tag. This creates the animated chrome/metallic text effect.

STEP 1 - Add this CSS in <style> tag:
\`\`\`css
<style>
  @keyframes metalShine {
    0% { background-position: 200% 50%; }
    100% { background-position: -200% 50%; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .liquid-metal {
    background: linear-gradient(
      90deg,
      #1a1a1a 0%,
      #4a4a4a 15%,
      #f5f5f5 30%,
      #8a8a8a 45%,
      #f5f5f5 55%,
      #4a4a4a 70%,
      #1a1a1a 85%,
      #4a4a4a 100%
    );
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: metalShine 8s linear infinite;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
  }
  .metal-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
</style>
\`\`\`

STEP 2 - Hero section structure:
\`\`\`html
<section class="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">
  <!-- Ambient glow behind text -->
  <div class="metal-glow"></div>
  
  <!-- Content -->
  <div class="relative z-10 text-center px-6">
    <h1 class="liquid-metal text-6xl md:text-8xl font-black tracking-tight">
      YOUR HEADLINE
    </h1>
    <p class="mt-6 text-xl text-white/60 max-w-2xl mx-auto">
      Your subheadline text here
    </p>
    
    <!-- Metallic border button -->
    <div class="mt-10 flex gap-4 justify-center">
      <button class="px-8 py-4 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 text-white rounded-full hover:border-white/40 transition-all">
        Get Started
      </button>
    </div>
  </div>
</section>
\`\`\`

ALTERNATIVE - Mercury/Liquid Silver effect:
\`\`\`css
.mercury-text {
  background: linear-gradient(
    90deg,
    #b8c6db 0%,
    #f5f7fa 20%,
    #ffffff 40%,
    #c3cfe2 60%,
    #f5f7fa 80%,
    #b8c6db 100%
  );
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: metalShine 6s linear infinite;
}
\`\`\`

COLORS:
- Background: Pure black #000000 or #0A0A0A
- Text uses metallic gradient (silver/chrome)
- Accents: White at 10-20% opacity

TYPOGRAPHY:
- Font: Use font-black (900 weight) for maximum effect
- Size: text-6xl to text-8xl (MUST be large)
- Tracking: tracking-tight or tracking-tighter
- The metallic effect only looks good on BIG text

BACKGROUND VARIATIONS:
1. Pure black: bg-black
2. With gradient: bg-gradient-to-br from-black via-[#0a0a1a] to-black
3. With subtle orb: Add single blurred circle at 10% opacity

⚠️ MANDATORY:
- MUST include the <style> tag with @keyframes metalShine
- MUST use the .liquid-metal class on headline
- Background MUST be dark (black or near-black)
- Text MUST be large (text-6xl minimum)
- Preserve ALL content from video`, category: "shader" },
  { id: "typography-mask", name: "Typography Hero", desc: "Giant Letters • Image Reveal • Editorial", fullDesc: "AWWWARDS STYLE: Bold editorial typography. Massive headline text (text-[15vw] or larger) as hero element. Text can have gradient fill or image texture via background-clip. Dark or light background depending on context. Strong typographic hierarchy. Magazine/editorial aesthetic. Generous whitespace.", category: "creative" },
  { id: "path-follower", name: "Roadmap Timeline", desc: "SVG Path • Progress Line • Scroll Story", fullDesc: "AWWWARDS STYLE: Clean timeline/roadmap design. Vertical or horizontal line connecting sections. Each section is a card/milestone along the path. Line can be animated with stroke-dashoffset on scroll. Subtle dots or icons mark each point. Clean minimal aesthetic. Works great for product stories, company history, feature roadmaps.", category: "motion" },
  
  // === PHYSICS & 3D ===
  { id: "gyroscopic-levitation", name: "Gyroscopic Levitation", desc: "Shadow Physics • Lift • Tilt", fullDesc: `REALISTIC LEVITATION PHYSICS - Cards float with authentic physics.

COLORS: Any palette. Effect is about shadows and positioning.

TYPOGRAPHY: Standard. Content floats on levitating cards.

LAYOUT: Cards arranged in grid or scattered. Each card levitates independently.

KEY EFFECTS:
- LIFT SHADOW PHYSICS: 
  - Card UP = shadow smaller, sharper, darker (closer to ground)
  - Card DOWN = shadow larger, softer, lighter (further from ground)
- GYROSCOPIC TILT: Cards tilt based on mouse position (rotateX/rotateY)
- Perspective: 1000px on container for depth
- Shadow follows opposite direction of tilt
- Magnetic resistance: Cards return to neutral with spring

ANIMATIONS:
- HOVER LIFT: translateZ(30px) + shadow shrinks
- MOUSE PARALLAX: Continuous tilt following cursor
- SPRING RETURN: Smooth spring animation back to flat
- Heavy feel: Slower, more mass in movement
- Shadow animates with same duration as card

CSS:
.card {
  transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
}
.card:hover {
  transform: perspective(1000px) translateZ(30px) rotateX(var(--rotateX)) rotateY(var(--rotateY));
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

Tactile, physical, grounded.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "physics" },
  { id: "exploded-view", name: "Product Showcase", desc: "3D Product • Feature Cards • Technical", fullDesc: `TECHNICAL PRODUCT SHOWCASE - Engineering aesthetic.

COLORS: Dark bg #0a0a0a, product hero lit dramatically, feature cards in glass. Accent: cyan #00FFFF or brand color.

TYPOGRAPHY: Inter for body, JetBrains Mono for specs/technical data. Weight 400-600.

LAYOUT: Product centered and large. Feature cards float around it in 3D space or grid. Each card highlights one feature.

KEY EFFECTS:
- CENTRAL HERO: Product image/mockup with dramatic lighting
- Glow behind product: radial-gradient in product color
- FEATURE CARDS: Glass bg-white/5 with technical specs
- Lines connecting cards to product areas
- Monospace for dimensions, specs, metrics

ANIMATIONS:
- Product ROTATES slowly or on hover
- Cards FADE IN on scroll with stagger
- Hover on card: Corresponding product area highlights
- Lines DRAW from cards to product
- Optional: Exploded view animation showing internals

Technical, premium, informative.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "dark" },
  { id: "horizontal-parallax", name: "Gallery Showcase", desc: "Image Grid • Hover Effects • Portfolio", fullDesc: `PORTFOLIO GALLERY GRID - Clean image showcase.

COLORS: Dark #0a0a0a or light #FFFFFF bg. Images are the color focus. Text white or black for contrast.

TYPOGRAPHY: Clean sans-serif. Captions small and minimal. Let images speak.

LAYOUT: Masonry or uniform grid of images. Hover reveals titles/info.

KEY EFFECTS:
- GRID: CSS Grid or Masonry layout, gaps between images
- HOVER OVERLAY: Semi-transparent overlay with text appears
- Cursor changes to "view" or custom cursor on hover
- Scale: Slight zoom on hover (scale 1.02-1.05)
- Optional: Grayscale → color on hover

ANIMATIONS:
- FADE IN: Images appear with stagger on load
- HOVER: Overlay opacity 0 → 1, slight scale up
- CURSOR: Custom cursor changes over images
- SMOOTH transitions: 300-400ms ease-out
- Click: Full-screen lightbox option

CSS:
.gallery-item:hover {
  transform: scale(1.03);
}
.gallery-item:hover .overlay {
  opacity: 1;
}

Clean, focused, professional.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "skeuomorphic", name: "Skeuomorphic Controls", desc: "Physical Switches • Plastic • 3D", fullDesc: `PHYSICAL UI CONTROLS - Realistic switches and knobs.

COLORS: Plastic surfaces in gray #C0C0C0, brushed metal #888, colored buttons. Shadows for depth.

TYPOGRAPHY: Embossed or debossed labels on surfaces. Small, technical.

LAYOUT: Control panel aesthetic. Grouped controls in sections.

KEY EFFECTS:
- BEVELED EDGES: box-shadow for 3D plastic look
- ROCKER SWITCHES: rotateX to toggle (0deg ↔ 20deg)
- Plastic texture: Subtle noise overlay
- Metallic parts: Linear gradient for brushed metal
- LED indicators: Glowing dots for status

ANIMATIONS:
- TOGGLE ROCKER: rotateX with spring physics
- Click FEEDBACK: Slight push-in (scale 0.98)
- LED BLINK: Opacity animation for status
- Sound optional: Click sounds on interaction
- Tactile: Quick, responsive, no lag

CSS rocker:
.switch.on { transform: perspective(100px) rotateX(10deg); }
.switch.off { transform: perspective(100px) rotateX(-10deg); }

Physical, satisfying, nostalgic.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "physics" },
  
  // === DATA & DASHBOARD ===
  { id: "live-dashboard", name: "Live Dashboard Density", desc: "Data Heavy • Micro-Animations • Alive", fullDesc: `LIVE DATA DASHBOARD - Dense, always-moving metrics.

COLORS: Dark bg #0F0F0F, green #00FF00 for positive, red #FF3333 for negative, white for neutral. Accent cyan #00FFFF.

TYPOGRAPHY: JetBrains Mono or IBM Plex Mono. font-variant-numeric: tabular-nums for aligned numbers.

LAYOUT: Dense grid of metric cards. Every pixel has data. Scanner lines, blinking elements.

KEY EFFECTS:
- METRICS GRID: Compact cards with numbers, sparklines, status
- SCANNER LINE: Horizontal line sweeps through grid continuously
- Status dots: Blinking at different intervals
- Micro-charts: Tiny sparkline graphs in cells
- tabular-nums: Numbers align vertically

ANIMATIONS:
- NUMBER SCRAMBLE: Digits randomize then settle on actual value
- SCAN LINE: translateX animation across grid, 4-6s infinite
- BLINK: Different status dots blink at different rates (1s, 2s, 3s intervals)
- INCREMENT: Numbers tick up/down in real-time
- SPARKLINES: Chart data animates in

Real-time, data-dense, mission control.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "crt-noise", name: "CRT Signal Noise", desc: "Scanlines • RGB Shift • Flicker", fullDesc: `RETRO CRT MONITOR - Old TV signal aesthetic.

COLORS: Slightly washed out. RGB fringing. Green or amber phosphor option. Dark when "off".

TYPOGRAPHY: Monospace. Slightly fuzzy edges. Text appears to be on screen.

LAYOUT: Content as if displayed on old monitor. Rounded corners for screen curve effect.

KEY EFFECTS:
- SCAN LINES: repeating-linear-gradient, 1px lines every 2-3px
- RGB SHIFT: text-shadow with offset red and blue channels
- VIGNETTE: Radial gradient darkening edges (curved glass simulation)
- NOISE: Animated grain overlay at low opacity
- Screen curve: Slight barrel distortion or darkened edges

ANIMATIONS:
- FLICKER: Random opacity changes (0.95-1.0 rapid)
- SCAN LINE MOVEMENT: Lines drift slightly
- RGB JITTER: text-shadow offset randomizes occasionally
- TURN ON: Horizontal line expands to full screen
- STATIC: Occasional burst of noise

CSS:
.crt {
  animation: flicker 0.1s infinite;
  background: linear-gradient(transparent 50%, rgba(0,0,0,0.25) 50%);
  background-size: 100% 4px;
}
@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.97; }
}

Retro, nostalgic, imperfect.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  
  // === DEADPAN / KINETIC / SYSTEM STYLES ===
  { id: "indifferent-kinetic", name: "Indifferent Kinetic Loop", desc: "Deadpan Motion • Acid Yellow • Brutal", fullDesc: `EMOTIONLESS KINETIC DESIGN - Motion without expression.

COLORS: Pure black #000000 bg, acid yellow #E5FF00 text. Nothing else. Binary.

TYPOGRAPHY: Impact, Helvetica Black, or Anton. MASSIVE sizes (15-20vw). UPPERCASE. No rounded edges.

LAYOUT: Edge-to-edge typography. No padding. Type touches all edges.

KEY EFFECTS:
- GIANT TYPE: text-[15vw] minimum, viewport-filling
- NO ROUNDED CORNERS anywhere (rounded-none)
- Yellow inverts to black on hover (instant, no transition)
- Brutal borders: 4px solid
- Maximum visual weight

ANIMATIONS:
- SCROLL VELOCITY DRIFT: Text drifts horizontally with scroll speed
- ABRUPT: Fast, mechanical motion (150-200ms)
- LINEAR timing only (no easing)
- HOVER REVEAL: Image appears behind text with position lag
- Motion continues even without interaction (infinite loops)

Indifferent, systematic, anti-emotional.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "deadpan-documentation", name: "Deadpan Kinetic Documentation", desc: "Industrial Grid • Linear Motion • System", fullDesc: `SYSTEM DOCUMENTATION AESTHETIC - Industrial, unfeeling.

COLORS: Near-black #0B0B0B bg, off-white #E5E5E5 text, grid lines #1a1a1a at 5% visible.

TYPOGRAPHY: Inter or system-ui. Weight 400. No emphasis. Everything same hierarchy.

LAYOUT: Visible grid at very low opacity. Content fills grid cells mechanically.

KEY EFFECTS:
- FAINT GRID: Background grid at 3-5% opacity
- LINEAR everything: No curves, no rounded corners
- Mechanical spacing: Consistent padding everywhere
- Micro-jitter: Text has slight random vibration
- Documentation feel: Numbered sections, bullet lists

ANIMATIONS:
- LINEAR TIMING ONLY: transition-timing-function: linear always
- Micro-jitter: Random small transform movements
- No spring, no ease, no personality
- Content appears mechanically (no stagger, no delay variation)
- System boot: Content appears like loading logs

Industrial, procedural, indifferent.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "dark" },
  { id: "bureaucratic-void", name: "Bureaucratic Motion Void", desc: "Paper White • 1px Dividers • Dull", fullDesc: `BUREAUCRATIC PAPER AESTHETIC - Deliberately boring.

COLORS: Pure white #FFFFFF bg, black #000000 text only. No other colors. No accents.

TYPOGRAPHY: Arial only. One size, one weight (400). No hierarchy. Everything looks the same.

LAYOUT: Excessive 1px horizontal dividers between everything. Forms, lists, text blocks separated by lines.

KEY EFFECTS:
- 1px DIVIDERS everywhere: border-bottom on everything
- NO visual hierarchy: All text same size
- Forms look like government forms
- No decoration, no images, no color
- Maximum dullness

ANIMATIONS:
- SLOW: 600ms minimum on all transitions
- Only opacity changes (no movement)
- Hover: Slight background change (barely perceptible)
- No hover states on most elements
- Deliberately unresponsive feel

Boring by design. Paperwork aesthetic.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "light" },
  { id: "cctv-drift", name: "Incidental CCTV Drift", desc: "Surveillance • Sensor Noise • Fixed", fullDesc: `SURVEILLANCE CAMERA AESTHETIC - Found footage feel.

COLORS: Deep black bg, washed out gray #777 text, timestamp green #00FF00 overlay.

TYPOGRAPHY: Monospace only. Timestamp overlay in corner. Fixed position metadata.

LAYOUT: Content as if captured by security camera. Fixed overlays in corners.

KEY EFFECTS:
- CORNER OVERLAYS: Timestamp, camera ID, REC indicator
- Washed out: Low contrast, slight desaturation
- SENSOR NOISE: Grain overlay, occasional glitch
- Fixed frame: Content feels like camera footage
- Vignette: Darkened corners

ANIMATIONS:
- DRIFT: Slight random position shifts (sensor vibration)
- FRAME JITTER: Occasional sudden position jump
- Noise flicker: Grain overlay intensity varies
- REC blinks: Red recording dot pulses
- Timestamp updates (optional)

Found footage. Discovered, not designed.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "dark" },
  { id: "inefficient-loop", name: "Inefficient Manual Loop", desc: "Overcorrection • Handoff Pause • Habit", fullDesc: `PROCESS INEFFICIENCY - Deliberate imperfection.

COLORS: Dark workspace #1a1a1a, misaligned elements, muted colors.

TYPOGRAPHY: Standard but slightly off - baseline misalignments, inconsistent sizing.

LAYOUT: Grid that's slightly broken. Elements not quite aligned.

KEY EFFECTS:
- MISALIGNMENT: Elements off-grid by 1-3px
- Inconsistent spacing: Padding varies slightly
- Visual errors: Small imperfections everywhere
- Repetitive patterns with slight variations
- Manual work aesthetic

ANIMATIONS:
- OVERSHOOT: Motion goes past target, corrects back
- PAUSE at handoff points: Brief hesitation
- Loop: Animations repeat with slight variations each time
- Correction jitter: Small adjustments after main motion
- Habit-like: Same inefficient path every time

Inefficient by design. Human error simulated.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "accidental-capture", name: "Accidental Process Capture", desc: "Found Footage • Incidental • Unplanned", fullDesc: `FOUND FOOTAGE AESTHETIC - Unintentional capture.

COLORS: Any, but with compression artifacts. Slightly degraded quality.

TYPOGRAPHY: Content appears mid-use. Cursor visible. Unstyled.

LAYOUT: As if screen-recorded during work. Toolbars, system UI visible.

KEY EFFECTS:
- COMPRESSION ARTIFACTS: Block artifacts, color banding
- Frame nudges: Random small position shifts
- Mid-action: Content frozen in middle of interaction
- Desktop elements: Cursor, system UI, browser chrome
- Imperfect framing: Content slightly off-center

ANIMATIONS:
- UNPREDICTABLE: Motion doesn't follow patterns
- Sudden stops/starts: As if recording paused
- Drift: Slow random movement
- No polish: Raw, unedited motion
- Feels discovered, not created

Found on abandoned hard drive aesthetic.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "creative" },
  { id: "abrupt-termination", name: "Abrupt Termination Protocol", desc: "Pre-Cut Drift • Mid-Motion Freeze • Crash", fullDesc: `SYSTEM CRASH AESTHETIC - Sudden termination.

COLORS: Normal until crash. Freeze with slight discoloration.

TYPOGRAPHY: Standard until freeze moment.

LAYOUT: Normal layout that breaks at crash point.

KEY EFFECTS:
- DRIFT: Normal smooth motion before crash
- FREEZE: Animation halts mid-motion (paused, not complete)
- Stuck: Element frozen in awkward position
- Error states: Corrupted visuals at crash point
- System failure indicators

ANIMATIONS:
- SMOOTH → HALT: Motion plays then stops abruptly
- 1-2 frame pause: Brief complete freeze
- No recovery: Frozen state persists
- Jitter on freeze: Tiny vibration at stop point
- External termination: As if recording was cut off

Recording stopped unexpectedly. System crash frozen in time.

⚠️ MANDATORY: Preserve ALL content from video.`, category: "dark" },
  
  // === PREMIUM SAAS LANDING ===
  { id: "molten-aurora", name: "Molten Aurora SaaS", desc: "Volcanic Glow • Dark Glass • Orange Beam", fullDesc: "CRITICAL: Background is solid #0a0a0a black. Add ONE subtle orange/amber radial gradient at bottom center using CSS: background: radial-gradient(ellipse 80% 50% at 50% 100%, rgba(251,146,60,0.15) 0%, transparent 70%). Cards have bg-white/5 backdrop-blur-xl border border-white/10. Orange CTA button. NO overlapping backgrounds, NO multiple gradient layers, keep it minimal and clean.", category: "dark" },
  { id: "midnight-aurora", name: "Midnight Aurora Fintech", desc: "Purple Glow • Neon Streaks • Blue Accent", fullDesc: "CRITICAL: Background is solid #050510 dark blue-black. Add ONE subtle purple glow at bottom: background: radial-gradient(ellipse 100% 40% at 50% 100%, rgba(139,92,246,0.12) 0%, transparent 60%). Glass cards with bg-white/5 backdrop-blur-xl. Blue/purple accent colors. NO overlapping elements, clean hierarchy.", category: "dark" },
  { id: "airy-blue-aura", name: "Airy Blue Aura SaaS", desc: "White Void • Blue Blob • Highlight Pill", fullDesc: "White #ffffff background. ONE soft blue blob in hero: div with absolute positioning, w-[600px] h-[400px] bg-blue-400/20 rounded-full blur-[100px]. Clean Inter font. Headline pill highlight uses bg-blue-100 px-3 py-1 rounded-full inline. Indigo CTA.", category: "light" },
  { id: "halftone-beam", name: "Halftone Solar Beam Studio", desc: "Dot Matrix • Grid • Massive Wordmark", fullDesc: "Background #0a0a0a. Hero has ONE orange gradient beam: background: linear-gradient(180deg, transparent 0%, rgba(251,146,60,0.08) 50%, transparent 100%). Massive text-[12vw] font-black headline. Subtle dot pattern overlay at 3% opacity. NO overlapping gradients.", category: "dark" },
  { id: "mono-wave", name: "Monochrome Typographic Wave", desc: "Black White • Marquee Band • Editorial", fullDesc: "Pure black #000 background with white text. ONE horizontal marquee band crossing viewport with continuous scrolling text (CSS animation translateX, 30s linear infinite). Text inside marquee is white, band background can be white with black text. Editorial typography.", category: "creative" },
  { id: "glass-cascade", name: "Glass Blue Tech Cascade", desc: "Deep Blue • Stacked Glass • Float", fullDesc: "Background #0a1628 deep blue. Cards use bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl. Cards stacked with slight offset (translate-y). ONE soft blue radial glow: radial-gradient(circle at 50% 30%, rgba(59,130,246,0.1) 0%, transparent 50%). Clean spacing, no overlaps.", category: "dark" },
  { id: "fractured-grid", name: "Fractured Grid Typography", desc: "Modular Grid • Split Headline • Editorial", fullDesc: "White background with visible 12-column grid lines (1px border-r border-black/5 on columns). Headline text can span multiple columns. Monochrome palette with ONE accent color. Clean editorial feel, generous whitespace.", category: "creative" },
  { id: "glowframe-product", name: "Dark Product Glowframe", desc: "Teal Glow • Inner Glow Cards • Compact SaaS", fullDesc: "Background #0a0a0a. Cards have inner glow effect: box-shadow: inset 0 0 20px rgba(45,212,191,0.1). Teal/cyan #14b8a6 accent. Compact layout with tight spacing. Product screenshot in center with subtle glow border.", category: "dark" },
  
  // === BRAND INSPIRED ===
  { id: "apple", name: "Apple Style", desc: "Frosted Glass • Clean • SF Pro", fullDesc: `APPLE.COM INSPIRED - Premium minimalism with depth.

COLORS: Light mode - bg #fbfbfd (warm white), text #1d1d1f (rich black), muted #86868b. Dark sections use #000000 pure black.

TYPOGRAPHY: SF Pro Display for headlines (system-ui, -apple-system), weight 600-700, tight tracking -0.03em. Large sizes: text-5xl to text-7xl. Body in SF Pro Text, weight 400.

LAYOUT: Full-width sections, centered content max-w-5xl. MASSIVE whitespace - py-32 to py-48 between sections. Single column focus.

KEY EFFECTS:
- Frosted glass cards: bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl
- Smooth parallax on product images
- Sticky scroll sections where product stays centered
- Gradient text: bg-gradient-to-r from-[#2997ff] to-[#5856d6] bg-clip-text

ANIMATIONS: 
- Fade in from bottom with spring physics
- Products scale 0.95 → 1 on scroll
- Text reveals word by word
- 400-600ms duration, ease-out timing

⚠️ MANDATORY: Preserve ALL content from video. Style changes appearance only.`, category: "brand" },
  { id: "stripe", name: "Stripe Design", desc: "Premium Gradient • Trust Blue", fullDesc: `STRIPE.COM INSPIRED - Trustworthy fintech elegance.

COLORS: Light bg #f6f9fc or white, text #0a2540 (deep navy), accent #635bff (Stripe purple). Secondary: #00d4ff cyan for highlights.

TYPOGRAPHY: Inter or custom Stripe font. Headlines weight 600, tracking -0.02em. Body weight 400, line-height 1.6. Sizes: hero text-6xl, sections text-4xl.

LAYOUT: Asymmetric grids, code blocks alongside explanations. Cards float with soft shadows. Content max-w-6xl centered.

KEY EFFECTS:
- GRADIENT BLOBS: Multiple absolute positioned divs with blur(100px), opacity 0.3-0.5, colors purple/cyan/orange
- Cards: bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100
- Code blocks: bg-[#0a2540] text-white rounded-xl with syntax highlighting
- Hover lift: translateY(-4px) with shadow increase

ANIMATIONS:
- Blobs slowly drift position (CSS animation 20s infinite)
- Elements fade in staggered from bottom
- Numbers count up from 0
- Smooth 300ms hover transitions

⚠️ MANDATORY: Preserve ALL content from video. Style changes appearance only.`, category: "brand" },
  { id: "spotify", name: "Spotify Dark", desc: "#121212 • Green Accent • Cards", fullDesc: `SPOTIFY INSPIRED - Music platform dark elegance.

COLORS: Bg #121212 (Spotify black), cards #181818, hover #282828. Accent #1DB954 (Spotify green). Text white, muted #b3b3b3.

TYPOGRAPHY: Circular Std or Inter. Headlines weight 700, large sizes. Body weight 400. Tight letter-spacing on headings.

LAYOUT: Horizontal scrolling card rows. Grid layouts for content. Sticky navigation. Content fills full width with p-6 padding.

KEY EFFECTS:
- Cards: bg-[#181818] rounded-lg p-4, hover:bg-[#282828] transition
- Play button overlays on hover with scale animation
- Horizontal scroll with snap points (scroll-snap-type: x mandatory)
- Green accents on interactive elements only

ANIMATIONS:
- Cards scale 1.02 on hover
- Play button fades in from opacity 0
- Smooth horizontal scroll with momentum
- Skeleton loading states with shimmer

⚠️ MANDATORY: Preserve ALL content from video. Style changes appearance only.`, category: "brand" },
  
  // === NEW SHADER & ANIMATION STYLES ===
  { id: "liquid-neon", name: "Liquid Neon", desc: "WebGL Metaballs • Lava Lamp • Glow", fullDesc: "CRITICAL: Black #000 background. Neon effect using CSS: Single animated blob with filter: blur(40px) and gradient colors. OR use radial-gradient blobs that animate position. Text has neon glow: text-shadow: 0 0 20px rgba(255,0,255,0.5). Keep layout clean, no overlapping blobs.", category: "shader" },
  { id: "matrix-rain", name: "Matrix Rain", desc: "Falling Code • Scramble Text • Hacker", fullDesc: "CRITICAL: Pure black #000 background. Green #00ff00 monospace text. Matrix rain effect: CSS animation with translateY on columns of characters, staggered delays. Or use a single canvas-style div with animated characters. Headlines can have scramble effect on load. NO overlapping elements.", category: "creative" },
  { id: "gradient-bar-waitlist", name: "Gradient Bar Waitlist", desc: "Orange Bars • Pulse • Startup", fullDesc: "Animated gradient bars rising from bottom with pulse animation. Dark premium background, waitlist form, social proof avatars. Space Grotesk font.", category: "dark" },
  { id: "blur-hero-minimal", name: "Blur Hero Minimal", desc: "Blur Reveal • Stagger • Clean SaaS", fullDesc: "Clean minimal hero with blur-to-clear text animations. Staggered word reveal, subtle spring physics. Customer logos section with hover blur effect.", category: "light" },
  { id: "messy-physics", name: "Messy Colorful Physics", desc: "Matter.js • Drag Tags • Bouncy Pills", fullDesc: "Playful physics-enabled interface with draggable colorful pill tags. Gravity simulation, throw and bounce mechanics. Italic serif headline.", category: "physics" },
  { id: "earthy-grid-reveal", name: "Earthy Grid Reveal", desc: "Grid Lines • Word Appear • Organic", fullDesc: `EARTHY GRID REVEAL - Where nature meets mathematics. Organic sophistication.

Imagine a website that feels like opening an architect's sketchbook in a forest cabin. Warm earthy colors - rich browns (#3D2B1F), warm creams (#F5F0E6), terracotta accents (#C67B5C), deep forest greens (#2D4A3E). But underneath this organic warmth, there's a precise VISIBLE GRID system holding everything together.

THE VIBE: The grid lines are part of the design - thin, elegant lines (#E0D5C7) that you can actually SEE dividing the page into modules. Content REVEALS itself as you scroll - words appearing one by one with a blur-to-sharp animation, scaling up from 90% to 100%. Mouse creates a subtle gradient glow that follows movement. Clicking creates ripples like dropping a stone in water.

SIGNATURE ELEMENTS:
- VISIBLE grid overlay - not hidden infrastructure, but a design feature
- Words that materialize: start blurred and small, animate to crisp and full size
- Organic color palette with nature-inspired tones
- Subtle paper/grain texture throughout
- Mouse-following gradient spotlight effect
- Click ripples that emanate outward
- Typography that mixes serif elegance with modern weight
- Sections that feel like "cards" sitting on the grid
- Animated lines that draw themselves on scroll

THE FEELING: A Japanese architect's portfolio. A luxury eco-resort website. Handcrafted meets precise. Warm but structured.

⚠️ CRITICAL: Extract ALL content from the video. Style transforms appearance only.`, category: "creative" },
  { id: "paper-shader-mesh", name: "Paper Shader Mesh", desc: "MeshGradient • Cyan Orange • SVG Filters", fullDesc: "Paper design system with animated mesh gradient. Cyan to orange color scheme, SVG glass filters, gooey buttons, pulsing border accent.", category: "shader" },
  { id: "myna-ai-mono", name: "Myna AI Mono", desc: "Orange CTA • Monospace • Business AI", fullDesc: "Clean business AI landing with monospace typography. Orange #FF6B2C accent, word-by-word headline animation, feature cards with icons, white background.", category: "light" },
  { id: "acme-clean-rounded", name: "Acme Clean Rounded", desc: "Rounded Nav • Motion • Dashboard Preview", fullDesc: "Modern clean SaaS with rounded pill navigation. Staggered motion animations, dark/light toggle, dashboard image showcase with gradient overlay.", category: "light" },
  { id: "acid-brutalist", name: "Acid Brutalist Code", desc: "Neo-Brutalist • Acid Lime • Marquee • Code", fullDesc: `NEO-BRUTALIST ACID DESIGN for developers/Web3.

COLORS: Bg #111111, text #FFFFFF, accent #CCFF00 (Acid Lime), secondary #6D28D9 (Purple), borders #333333 (2px solid).

TYPOGRAPHY: Display (Clash Display/Archivo Black) - weight 700-900, tracking -0.03em, UPPERCASE, text-6xl to text-9xl. Mono (JetBrains Mono) for tags, menus, code elements in {brackets}.

LAYOUT: Visible borders EVERYWHERE (border-b, border-r). Marquee strips between sections. Large padding (p-8 to p-16). Sharp edges (rounded-none). Oversized elements.

KEY ELEMENTS: Giant headlines, marquee bars ("OPEN FOR WORK ///"), table-style project lists with border-b, HUGE full-width CTA buttons, code decorations (<span>, {}, //).

ANIMATIONS: Infinite marquee scroll, hover color invert (lime↔black), text reveal from bottom with stagger.

⚠️ MANDATORY FLOW PRESERVATION:
- If video shows MULTIPLE SCREENS/PAGES → create SEPARATE navigable sections
- Each screen = separate section with working navigation links between them
- Style changes APPEARANCE only, NEVER removes content or screens
- Count screens in video and ensure ALL are represented`, category: "dark" },
  { id: "corporate-blueprint", name: "Corporate Blueprint Grid", desc: "Architectural Grid • Royal Blue • Swiss Clean", fullDesc: `ARCHITECTURAL SWISS CORPORATE design.

COLORS: Bg #FFFFFF (pure white), text #0F172A (slate-900, NOT black), accent #2563EB (blue-600) for CTAs ONLY, borders #E2E8F0 (slate-200).

TYPOGRAPHY: Inter font. Headings weight 600, tracking -0.02em. Labels: weight 500, UPPERCASE, 12px, tracking-widest, color #64748B.

LAYOUT: VISIBLE 1px borders on ALL sections (border-b, border-r). NO rounded corners on sections. Buttons: rounded-sm (4px). Large equal padding (p-10). Cards as bordered boxes.

KEY ELEMENTS: Navbar with border-b, split hero OR centered, large stats separated by vertical 1px lines ("10+ YEARS", "500+ PROJECTS"), footer with sitemap.

ANIMATIONS: Fade in up (y: 20px → 0), border draw (width 0% → 100%), button hover darkens to blue-700.

⚠️ MANDATORY FLOW PRESERVATION:
- If video shows MULTIPLE SCREENS/PAGES → create SEPARATE navigable sections
- Each screen = separate section with working navigation links between them
- Style changes APPEARANCE only, NEVER removes content or screens
- Count screens in video and ensure ALL are represented`, category: "light" },
  
  // === SPLINE 3D - HERO ONLY ===
  { id: "pastel-cloud", name: "Pastel Cloud", desc: "Spline 3D Hero • Clean sections below", fullDesc: `⚠️ SPLINE 3D IN HERO ONLY - Normal page below!

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="module" src="https://unpkg.com/@splinetool/viewer@1.12.35/build/spline-viewer.js"></script>
</head>
<body class="bg-white">

  <!-- NAV - Fixed, glass on hero, solid after scroll -->
  <nav class="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="text-xl font-bold text-gray-900">Logo</div>
      <div class="hidden md:flex items-center gap-8">
        <a href="#" class="text-gray-600 hover:text-gray-900 transition">Link</a>
      </div>
      <button class="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-medium shadow-lg transition">
        Get Started
      </button>
    </div>
  </nav>

  <!-- ⚠️ HERO WITH SPLINE BACKGROUND - Spline ONLY here! -->
  <section class="relative min-h-screen overflow-hidden">
    <!-- Spline 3D - absolute within hero only -->
    <div class="absolute inset-0 z-0">
      <spline-viewer url="https://prod.spline.design/H0rV8YuyqNW4BOJ9/scene.splinecode" style="width:100%;height:100%;"></spline-viewer>
    </div>
    <!-- Hero content -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
      <h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
        Your Headline
      </h1>
      <p class="text-gray-700 text-xl max-w-2xl mb-10">
        Description text here
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        <button class="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full shadow-xl transition">
          Primary CTA
        </button>
        <button class="px-8 py-4 bg-white/70 backdrop-blur-sm text-gray-800 font-semibold rounded-full border border-gray-200 hover:bg-white transition">
          Learn More
        </button>
      </div>
    </div>
  </section>

  <!-- FEATURES - Normal white background, clean design -->
  <section class="py-24 px-6 bg-white">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-gray-900 text-center mb-16">Features</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <div class="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl mb-4"></div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Feature One</h3>
          <p class="text-gray-600">Description here</p>
        </div>
        <div class="bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <div class="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl mb-4"></div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Feature Two</h3>
          <p class="text-gray-600">Description here</p>
        </div>
        <div class="bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl mb-4"></div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Feature Three</h3>
          <p class="text-gray-600">Description here</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section - Subtle gradient -->
  <section class="py-24 px-6 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-4xl font-bold text-gray-900 mb-6">Ready to start?</h2>
      <p class="text-gray-600 text-lg mb-8">Get started today</p>
      <button class="px-10 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full shadow-xl transition">
        Get Started Free
      </button>
    </div>
  </section>

  <!-- Footer - Clean -->
  <footer class="py-12 px-6 bg-gray-900 text-white">
    <div class="max-w-6xl mx-auto text-center">
      <p class="text-gray-400">© 2024 Company. All rights reserved.</p>
    </div>
  </footer>

</body>
</html>

⚠️ KEY RULES:
1. Spline is ONLY in hero section (absolute, not fixed!)
2. Body is bg-white - normal page
3. Sections below hero have normal backgrounds (bg-white, bg-gray-50)
4. Hero has relative + overflow-hidden to contain Spline

🎨 COLOR PALETTE:
- Hero text: text-gray-900 (dark, readable on pastel)
- Body text: text-gray-600
- Primary buttons: bg-violet-600 (matches Spline purples)
- Cards: bg-gray-50 border-gray-100
- Accent section: bg-gradient-to-br from-violet-50 to-pink-50
- Footer: bg-gray-900

✅ STRUCTURE:
- Hero: relative + Spline absolute inset-0 z-0 + content z-10
- Below hero: Normal sections with solid backgrounds
- No glass effect below hero - clean, professional look`, category: "shader" },

  // === SUPER HERO - ANIMATED LIQUID BACKGROUNDS ===
  { id: "super-hero", name: "Super Hero", desc: "Liquid Gradient • Animated Blob • Premium Hero", fullDesc: `SUPER HERO - Animated liquid gradient backgrounds like Framer's AnimatedLiquidBackground.

⚠️ CRITICAL: You MUST include this EXACT CSS in a <style> tag and the orb divs in the hero section. This creates the animated liquid background effect.

STEP 1 - Add this CSS in <style> tag at the top of your code:
\`\`\`css
<style>
  @keyframes blob1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(80px, -50px) scale(1.1); }
    50% { transform: translate(-40px, 80px) scale(0.9); }
    75% { transform: translate(-80px, -30px) scale(1.05); }
  }
  @keyframes blob2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-70px, 40px) scale(1.15); }
    66% { transform: translate(50px, -60px) scale(0.85); }
  }
  @keyframes blob3 {
    0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
    50% { transform: translate(60px, 60px) scale(1.1) rotate(180deg); }
  }
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.7;
    will-change: transform;
    pointer-events: none;
  }
  .orb-1 {
    width: 600px; height: 600px;
    background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
    top: -150px; left: -150px;
    animation: blob1 20s ease-in-out infinite;
  }
  .orb-2 {
    width: 500px; height: 500px;
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
    bottom: -100px; right: -100px;
    animation: blob2 25s ease-in-out infinite;
  }
  .orb-3 {
    width: 450px; height: 450px;
    background: linear-gradient(135deg, #EC4899 0%, #F97316 100%);
    top: 40%; left: 50%;
    animation: blob3 18s ease-in-out infinite;
  }
</style>
\`\`\`

STEP 2 - Hero section structure (MUST include the orb divs):
\`\`\`html
<section class="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0F0720] via-[#1A0B3E] to-[#0F0720]">
  <!-- Animated Liquid Background Orbs - MUST INCLUDE -->
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
  
  <!-- Content Container - above orbs -->
  <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
    <!-- Your content here -->
  </div>
</section>
\`\`\`

COLOR VARIATIONS (change orb gradients and section background):

COSMIC PURPLE (default):
- Section bg: from-[#0F0720] via-[#1A0B3E] to-[#0F0720]
- Orb 1: #8B5CF6 → #EC4899 (purple to pink)
- Orb 2: #3B82F6 → #8B5CF6 (blue to purple)
- Orb 3: #EC4899 → #F97316 (pink to orange)

OCEAN TEAL:
- Section bg: from-[#042F2E] via-[#0F766E] to-[#042F2E]
- Orb 1: #14B8A6 → #06B6D4 (teal to cyan)
- Orb 2: #06B6D4 → #10B981 (cyan to emerald)
- Orb 3: #10B981 → #14B8A6 (emerald to teal)

SUNSET WARMTH:
- Section bg: from-[#1F1005] via-[#7C2D12] to-[#1F1005]
- Orb 1: #F97316 → #FB7185 (orange to rose)
- Orb 2: #F59E0B → #F97316 (amber to orange)
- Orb 3: #FB7185 → #EF4444 (rose to red)

MIDNIGHT BLUE:
- Section bg: from-[#020617] via-[#0F172A] to-[#020617]
- Orb 1: #3B82F6 → #6366F1 (blue to indigo)
- Orb 2: #6366F1 → #0EA5E9 (indigo to sky)
- Orb 3: #0EA5E9 → #3B82F6 (sky to blue)

NEON CYBER:
- Section bg: #000000
- Orb 1: #FF00FF → #00FFFF (magenta to cyan)
- Orb 2: #00FFFF → #ADFF2F (cyan to lime)
- Orb 3: #ADFF2F → #FF00FF (lime to magenta)

TYPOGRAPHY: 
- Headlines: text-5xl md:text-7xl font-bold text-white
- Subheadlines: text-xl text-white/70 max-w-2xl
- Use Inter, system-ui, or sans-serif font

GLASS CARDS (for feature sections):
\`\`\`html
<div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
  <!-- Card content -->
</div>
\`\`\`

CTA BUTTONS:
\`\`\`html
<button class="px-8 py-4 bg-white text-[#0F0720] font-semibold rounded-full hover:bg-white/90 transition-all">
  Get Started
</button>
<button class="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all">
  Learn More
</button>
\`\`\`

⚠️ MANDATORY:
- MUST include the <style> tag with @keyframes
- MUST include the 3 orb divs in the hero section
- Content MUST have relative z-10 to appear above orbs
- Section MUST have overflow-hidden
- Preserve ALL content from video`, category: "creative" },
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

  // Find preset - default to "auto-detect" when no style selected (matches video vibe)
  const selectedPreset = STYLE_PRESETS.find(p => value === p.name || value.startsWith(p.name + ".")) 
    || (!value || value.trim() === "" ? STYLE_PRESETS.find(p => p.id === "auto-detect") : undefined);
  
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
      textareaRef.current.style.height = Math.max(60, Math.min(textareaRef.current.scrollHeight, 200)) + 'px';
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
      // Set to "Custom" so it's recognized as selected (not empty which defaults to auto-detect)
      onChange("Custom");
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
    <div className="space-y-2 w-full max-w-full overflow-hidden">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full max-w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors bg-[#0A0A0A] border border-white/[0.08] hover:border-white/15 box-border",
          isOpen && "border-[#FF6E3C]/30 bg-white/[0.05]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {selectedPreset && <StylePreview styleId={selectedPreset.id} />}
        <div className="flex-1 min-w-0">
          <span className={cn("text-sm block", selectedPreset ? "text-white" : "text-white/25")}>
            {selectedPreset ? selectedPreset.name : "Select a style..."}
          </span>
          {selectedPreset && (
            <span className="text-xs text-white/30 truncate block">{selectedPreset.desc}</span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* Collapsible Panel */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden w-full max-w-full"
          >
            <div className="border border-white/[0.08] rounded-xl bg-[#0a0a0a]/95 backdrop-blur-xl w-full max-w-full overflow-hidden">
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
                      <div className={cn("text-[9px] font-medium px-2 py-1 text-left", category.color)}>
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
                  <div className="text-left px-3 py-6 text-white/30 text-xs">
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

      {/* Custom Instructions - Only show for Custom mode or when no preset */}
      {(selectedPreset?.id === "custom" || !selectedPreset) && selectedPreset?.id !== "style-reference" && (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={selectedPreset?.id === "custom" ? value.replace(/^Custom\.?\s*/, '') : value}
            onChange={(e) => {
              if (selectedPreset?.id === "custom") {
                onChange(e.target.value ? `Custom. ${e.target.value}` : "Custom");
              } else {
                onChange(e.target.value);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? "Describe your style..." : animatedPlaceholder}
            disabled={disabled}
            rows={2}
            className={cn(
              "w-full px-2.5 py-2 text-[11px] text-white/70 placeholder:text-white/25 bg-white/[0.02] border border-white/[0.05] rounded-lg resize-y focus:outline-none focus:border-white/10 transition-colors min-h-[60px] max-h-[200px]",
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
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1 justify-start">
            <span className={cn("text-xs font-medium text-left", isSelected ? "text-[#FF6E3C]" : "text-white/80")}>
              {preset.name}
            </span>
            {isSelected && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-[#FF6E3C]/20 text-[#FF6E3C]">Active</span>
            )}
          </div>
          <span className="text-[9px] text-white/40 truncate block text-left">{preset.desc}</span>
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

      {/* Info Tooltip - shows short summary only */}
      <AnimatePresence>
        {isInfoOpen && preset.fullDesc && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 pt-0">
              <div className="text-[10px] text-white/50 leading-relaxed p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] max-h-[100px] overflow-y-auto">
                {/* Show only first ~200 chars for preview */}
                {preset.fullDesc.length > 200 
                  ? preset.fullDesc.slice(0, 200).replace(/\n.*$/, '') + "..." 
                  : preset.fullDesc}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
