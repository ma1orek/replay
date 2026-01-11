"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function LandingFeatures() {
  const ref = useRef(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const examples = [
    { name: "Y Combinator", before: "/yvbefore.mp4", after: "/AFTERYC.mp4" },
    { name: "Microsoft", before: "/microbefore.mp4", after: "/microafter.mp4" },
    { name: "Craigslist", before: "/craiglistbefore.mp4", after: "/craigafter.mp4" },
    { name: "Eleven Labs", before: "/elevenbefore.mp4", after: "/elevenafter.mp4" },
  ];

  const inputTags = ["cursor movement", "clicks", "scrolling", "hover states", "logic"];
  const outputFeatures = [
    "New responsive UI",
    "Componentized production code", 
    "Full flow map with possible paths", 
    "Design system",
    "Interactive Data Charts (Real Recharts, not static SVGs)",
    "Mobile-First Navigation (Working hamburgers, drawers & sticky headers)",
  ];

  // Auto-advance slider every 8 seconds (when not paused)
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % examples.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [examples.length, isAutoPlaying]);

  // Force autoplay on mobile - iOS Safari needs explicit play() call
  useEffect(() => {
    const playVideos = () => {
      beforeVideoRef.current?.play().catch(() => {});
      afterVideoRef.current?.play().catch(() => {});
    };
    playVideos();
    // Also play when slide changes
  }, [activeSlide]);

  return (
    <section id="features" ref={ref} className="relative z-10 py-32 border-t border-white/[0.03]">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">The Magic</p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Watch. Drop. Ship.</h2>
          <p className="text-white/50 text-lg">Seconds of video replace hours of work.</p>
        </motion.div>

        {/* Before/After Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* INPUT - Before */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Input</span>
              </div>
              <span className="text-sm text-white/30">before</span>
            </div>

            <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0a0a0a]">
              <AnimatePresence mode="wait">
                <motion.video
                  ref={beforeVideoRef}
                  key={`before-${activeSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                  style={{ aspectRatio: "1920/940" }}
                  autoPlay muted loop playsInline
                  preload="auto"
                  src={examples[activeSlide].before}
                />
              </AnimatePresence>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#030303]/30 via-transparent to-transparent" />
            </div>

            <div className="space-y-4">
              <p className="text-sm text-white/50">Replay watches the UI over time.</p>
              <div className="flex flex-wrap gap-2">
                {inputTags.map((tag, i) => (
                  <span key={tag} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-white/30 italic">Video is treated as the source of truth.</p>
            </div>
          </motion.div>

          {/* OUTPUT - After */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-[#FF6E3C]/10 border border-[#FF6E3C]/20">
                <span className="text-xs font-medium text-[#FF6E3C] uppercase tracking-wider">Output</span>
              </div>
              <span className="text-sm text-white/30">after</span>
            </div>

            <div className="relative rounded-2xl border border-[#FF6E3C]/20 overflow-hidden bg-[#0a0a0a]">
              <AnimatePresence mode="wait">
                <motion.video
                  ref={afterVideoRef}
                  key={`after-${activeSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                  style={{ aspectRatio: "1920/940" }}
                  autoPlay muted loop playsInline
                  preload="auto"
                  src={examples[activeSlide].after}
                />
              </AnimatePresence>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#030303]/30 via-transparent to-transparent" />
              <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-[#FF6E3C]/10" />
            </div>

            <div className="space-y-3">
              <p className="text-sm text-white/50">You get:</p>
              <div className="space-y-2">
                {outputFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#FF6E3C]" />
                    <span className="text-sm text-white/60">{feature}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#FF6E3C]/60 font-medium mt-4">Everything stays editable. With AI.</p>
            </div>
          </motion.div>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center justify-center gap-4 mt-12">
          {/* Stop/Play Button */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={cn(
              "p-2 rounded-full transition-all duration-300",
              isAutoPlaying 
                ? "bg-white/10 hover:bg-white/20" 
                : "bg-[#FF6E3C]/20 hover:bg-[#FF6E3C]/30"
            )}
            title={isAutoPlaying ? "Pause autoplay" : "Resume autoplay"}
          >
            {isAutoPlaying ? (
              <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[#FF6E3C]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          {/* Slider Dots */}
          <div className="flex items-center gap-3">
            {examples.map((ex, i) => (
              <button
                key={ex.name}
                onClick={() => setActiveSlide(i)}
                className={cn(
                  "relative w-3 h-3 rounded-full transition-all duration-300",
                  activeSlide === i 
                    ? "bg-[#FF6E3C] scale-110" 
                    : "bg-white/20 hover:bg-white/40"
                )}
              >
                {activeSlide === i && (
                  <motion.div
                    layoutId="activeSlide"
                    className="absolute inset-0 rounded-full ring-2 ring-[#FF6E3C]/30"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
