"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  Github,
  Monitor,
  MousePointer2,
  Upload,
  Wand2,
  Zap,
  Eye,
  Palette,
  Menu,
  X,
  Video,
  Target,
  Copy,
  ExternalLink,
} from "lucide-react";
import Logo from "@/components/Logo";
import StyleInjector from "@/components/StyleInjector";
import { cn } from "@/lib/utils";
import { usePendingFlow } from "../providers";

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 100], ["rgba(3,3,3,0)", "rgba(3,3,3,0.9)"]);
  const headerBorder = useTransform(scrollY, [0, 100], ["rgba(255,255,255,0)", "rgba(255,255,255,0.05)"]);

  const scrollToSection = (href: string) => {
    setIsOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <motion.header
        style={{ backgroundColor: headerBg, borderBottomColor: headerBorder }}
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/tool"
              className="hidden sm:flex px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white hover:opacity-90 transition-opacity"
            >
              Start Building
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-[#030303]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-4 space-y-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className="block w-full text-left py-3 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <Link
                  href="/tool"
                  className="block w-full text-center py-3 mt-4 rounded-xl text-sm font-medium bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white"
                >
                  Start Building
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// BACKGROUND EFFECTS
// ═══════════════════════════════════════════════════════════════

function FloatingOrbs() {
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

function GridLines() {
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

// ═══════════════════════════════════════════════════════════════
// HERO INPUT
// ═══════════════════════════════════════════════════════════════

function HeroInput({ 
  onSend, 
  canSend,
  heroFlow,
  context,
  setContext,
  styleDirective,
  setStyleDirective,
  isRecording,
  startRecording,
  stopRecording,
  fileInputRef,
  onBrowse,
  onFile,
}: {
  onSend: () => void;
  canSend: boolean;
  heroFlow: { blob: Blob | null; name: string; previewUrl: string | null };
  context: string;
  setContext: (v: string) => void;
  styleDirective: string;
  setStyleDirective: (v: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onBrowse: () => void;
  onFile: (f: File) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative w-full max-w-3xl mx-auto"
    >
      {/* Animated glow behind */}
      <motion.div
        className="absolute -inset-4 rounded-[2rem] opacity-60"
        style={{
          background: "linear-gradient(135deg, rgba(255,110,60,0.15) 0%, rgba(255,110,60,0) 50%, rgba(255,140,80,0.1) 100%)",
          filter: "blur(40px)",
        }}
        animate={{
          opacity: [0.4, 0.6, 0.4],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div
        className={cn(
          "relative rounded-2xl border bg-[#0a0a0a]/90 backdrop-blur-2xl overflow-hidden transition-all duration-300",
          isDragging ? "border-[#FF6E3C]/50 shadow-[0_0_80px_rgba(255,110,60,0.15)]" : "border-white/[0.08]",
          "shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
      >
        {/* Drop zone header */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                heroFlow.blob ? "bg-[#FF6E3C]/20" : "bg-white/[0.03]"
              )}>
                <Video className={cn("w-5 h-5 transition-colors", heroFlow.blob ? "text-[#FF6E3C]" : "text-white/30")} />
              </div>
              <div className="text-left">
                <div className="text-base text-white/90 font-medium">
                  {heroFlow.blob ? heroFlow.name : "Drop your video"}
                </div>
                <div className="text-sm text-white/40">
                  {heroFlow.blob ? "Ready to process" : "or record your screen"}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onBrowse}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-[#FF6E3C]" />
                Upload video
              </button>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Monitor className="w-4 h-4 text-[#FF6E3C]" />
                  Record screen
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium bg-[#FF6E3C]/20 hover:bg-[#FF6E3C]/30 border border-[#FF6E3C]/30 text-[#FF6E3C] transition-all flex items-center justify-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-[#FF6E3C] animate-pulse" />
                  Stop
                </button>
              )}
            </div>
            
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
          
          <p className="text-sm text-white/40 leading-relaxed">
            Upload any video that shows a UI — screen recording, product demo, reference clip or walkthrough.
            <br />
            <span className="text-white/50">Replay rebuilds the UI you see.</span>
          </p>
        </div>

        {/* Context & Style */}
        <div className="p-6 space-y-5">
          <div>
            <label className="text-sm text-white/50 mb-2 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-[#FF6E3C]" />
              Context <span className="text-white/30">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              placeholder="Add data logic, constraints or details. Replay works without it — context just sharpens the result."
              className="w-full px-4 py-3 rounded-xl text-sm text-white/80 placeholder:text-white/25 bg-white/[0.03] border border-white/[0.06] focus:outline-none focus:border-[#FF6E3C]/20 focus:bg-white/[0.035] transition-colors duration-300 ease-out resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-white/50 mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#FF6E3C]" />
              Style
            </label>
            <p className="text-xs text-white/30 mb-2">Choose a visual system or override the original look.</p>
            <StyleInjector value={styleDirective} onChange={setStyleDirective} disabled={false} />
          </div>

          <motion.button
            onClick={onSend}
            disabled={!canSend}
            whileHover={{ scale: canSend ? 1.01 : 1 }}
            whileTap={{ scale: canSend ? 0.99 : 1 }}
            className={cn(
              "w-full relative overflow-hidden rounded-xl py-4 text-base font-semibold transition-all",
              canSend 
                ? "bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white shadow-[0_20px_40px_-15px_rgba(255,110,60,0.4)]" 
                : "bg-white/[0.05] text-white/30 cursor-not-allowed"
            )}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Building
              <ArrowRight className="w-5 h-5" />
            </span>
          </motion.button>
          
          <p className="text-center text-xs text-white/30">
            No setup. No specs.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

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

export default function LandingPage() {
  const router = useRouter();
  const { setPending } = usePendingFlow();
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
  const [styleDirective, setStyleDirective] = useState("Custom");
  const [isRecording, setIsRecording] = useState(false);

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
  }, [mimeType, setFlowBlob]);

  const stopRecording = useCallback(() => {
    try {
      recorderRef.current?.requestData?.();
      recorderRef.current?.stop();
    } catch {}
  }, []);

  const canSend = !!heroFlow.blob;

  const onSend = useCallback(() => {
    if (!heroFlow.blob) return;
    setPending({
      blob: heroFlow.blob,
      name: heroFlow.name || "Flow",
      context: context.trim(),
      styleDirective: styleDirective?.trim() || "Custom",
      createdAt: Date.now(),
    });
    router.push("/tool");
  }, [context, heroFlow.blob, heroFlow.name, router, setPending, styleDirective]);

  return (
    <div className="min-h-screen bg-[#030303] text-white font-poppins overflow-x-hidden">
      <FloatingOrbs />
      <GridLines />
      <div className="grain-overlay-landing" />
      
      <Navigation />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO - Centered */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-20">
        <div className="mx-auto max-w-5xl px-6 py-20 w-full text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent whitespace-nowrap">
              Rebuild UI from Video.
            </span>{" "}
            <span className="bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] bg-clip-text text-transparent">
              Instantly.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Turn any video into a clean, production-ready UI.
            <br />
            Code, structure, interactions and style — rebuilt directly from what's on screen.
          </motion.p>

          <HeroInput
            onSend={onSend}
            canSend={canSend}
            heroFlow={heroFlow}
            context={context}
            setContext={setContext}
            styleDirective={styleDirective}
            setStyleDirective={setStyleDirective}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            fileInputRef={fileInputRef as any}
            onBrowse={onBrowse}
            onFile={onFile}
          />

        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-white/30"
          >
            <span className="text-xs">Scroll to explore</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SOCIAL PROOF */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 border-t border-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-8">
              Built on modern frontend stack
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { name: "React", icon: Code2 },
                { name: "Tailwind CSS", icon: Palette },
                { name: "Production-ready output", icon: Zap },
              ].map((tech, i) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <tech.icon className="w-4 h-4 text-[#FF6E3C]" />
                  <span className="text-sm text-white/50">{tech.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <HowItWorks />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FEATURES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <FeaturesBento />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SHOWCASE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <ShowcaseSection />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* USE CASES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <UseCases />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PRICING */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <PricingSection />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FAQ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <FAQSection />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FINAL CTA */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <FinalCTA />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.05] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo />
            <p className="text-xs text-white/30">
              © 2025 Replay · replay.build
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOW IT WORKS
// ═══════════════════════════════════════════════════════════════

function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      icon: Video,
      title: "Upload or Record",
      desc: "Capture any UI in motion. Replay treats the video as the source of truth.",
    },
    {
      icon: MousePointer2,
      title: "Add Context (Optional)",
      desc: "Describe logic, edge cases or style intent. Replay understands visuals first — context only refines the result.",
    },
    {
      icon: Code2,
      title: "Get UI + Code",
      desc: "Replay generates clean UI code, component structure, visible design system, desktop & mobile preview. Ready to copy, export or deploy.",
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">How it works</p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How Replay works
          </h2>
          <p className="text-white/50 text-lg">Video → Context → UI</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className="group"
            >
              <div className="relative h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-8 overflow-hidden hover:border-white/[0.12] transition-all duration-300">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF6E3C]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  <step.icon className="w-8 h-8 text-[#FF6E3C] mb-6" />
                  
                  <div className="text-xs text-white/30 mb-2">Step {i + 1}</div>
                  <h3 className="text-xl font-semibold mb-3 text-white/90">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURES BENTO
// ═══════════════════════════════════════════════════════════════

function FeaturesBento() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="relative z-10 py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">Why Replay</p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            Why Replay
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-4">
          {/* Large card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-8 relative overflow-hidden group hover:border-white/[0.12] transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6E3C]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative">
                <Eye className="w-8 h-8 text-[#FF6E3C] mb-6" />
                
                <h3 className="text-2xl font-semibold mb-3 text-white/90">UI reconstruction, not screenshots</h3>
                <p className="text-white/50 leading-relaxed mb-6">
                  Replay doesn't guess layouts from single frames.
                  It analyzes the video over time to understand structure, states and transitions.
                </p>
                
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/40 italic">
                  "From a short video → a complete UI scaffold."
                </div>
              </div>
            </div>
          </motion.div>

          {/* Small card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-8 hover:border-white/[0.12] transition-all duration-300">
              <Target className="w-8 h-8 text-[#FF6E3C] mb-6" />
              
              <h3 className="text-xl font-semibold mb-3 text-white/90">Grounded in the video</h3>
              <p className="text-white/50 leading-relaxed">
                Replay stays anchored to what's actually visible.
                No speculative layouts. No invented structure.
              </p>
            </div>
          </motion.div>

          {/* Bottom row */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <div className="h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-8 hover:border-white/[0.12] transition-all duration-300">
              <Code2 className="w-8 h-8 text-[#FF6E3C] mb-6" />
              
              <h3 className="text-xl font-semibold mb-3 text-white/90">Developer-friendly output</h3>
              <p className="text-white/50 leading-relaxed mb-4">
                Clean, readable code generated the way a senior frontend developer would write it.
                Easy to refactor. Easy to extend.
              </p>
              
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Github className="w-4 h-4 text-[#FF6E3C]" />
                export-ready output
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-7"
          >
            <div className="h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-8 hover:border-white/[0.12] transition-all duration-300">
              <Wand2 className="w-8 h-8 text-[#FF6E3C] mb-6" />
              
              <h3 className="text-xl font-semibold mb-3 text-white/90">Style remix</h3>
              <p className="text-white/50 leading-relaxed mb-6">
                Keep the same structure. Change the look. Apply a new visual system instantly — without breaking layout or interactions.
              </p>
              
              <div className="flex flex-wrap gap-2">
                {["Apple", "Material", "Linear", "Cyberpunk", "Glass"].map((style) => (
                  <span 
                    key={style}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-[#FF6E3C]/30 hover:text-[#FF6E3C] transition-colors cursor-default"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHOWCASE SECTION (The Magic)
// ═══════════════════════════════════════════════════════════════

function ShowcaseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">The Magic</p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Watch. Drop. Ship.
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            Seconds of video replace hours of UI work.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Input side */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-4 h-4 text-[#FF6E3C]" />
              <span className="text-xs text-white/40 uppercase tracking-wider">Input</span>
            </div>
            
            <div className="rounded-xl border border-white/[0.06] bg-[#080808] p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6E3C]/5 to-transparent" />
              
              <div className="relative space-y-4">
                <motion.div
                  className="flex items-center gap-3"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-3 h-3 rounded-full bg-[#FF6E3C]" />
                  <span className="text-sm text-white/50">Video showing:</span>
                </motion.div>
                
                <div className="h-32 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                  <motion.div
                    className="w-4 h-4 rounded-full bg-[#FF6E3C]/30"
                    animate={{ 
                      x: [0, 60, 0, -40, 0],
                      y: [0, 20, -10, 30, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </div>
                
                <div className="text-xs text-white/30 space-y-1">
                  <div>• cursor movement</div>
                  <div>• clicks</div>
                  <div>• scrolling</div>
                  <div>• hover states</div>
                </div>
              </div>
            </div>
          </div>

          {/* Output side */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-4 h-4 text-[#FF6E3C]" />
              <span className="text-xs text-white/40 uppercase tracking-wider">Output</span>
            </div>
            
            <div className="rounded-xl border border-white/[0.06] bg-[#080808] p-6">
              <div className="font-mono text-xs leading-relaxed space-y-1">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-[#FF6E3C]">&lt;header</span>
                  <span className="text-white/40"> className=</span>
                  <span className="text-green-400/70">"sticky top-0 z-50"</span>
                  <span className="text-[#FF6E3C]">&gt;</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.7 }}
                  className="pl-4 text-white/30"
                >
                  {"// Navigation with hover states"}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.9 }}
                >
                  <span className="text-[#FF6E3C]">&lt;/header&gt;</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 1.1 }}
                >
                  <span className="text-[#FF6E3C]">&lt;main</span>
                  <span className="text-white/40"> className=</span>
                  <span className="text-green-400/70">"max-w-7xl mx-auto"</span>
                  <span className="text-[#FF6E3C]">&gt;</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 1.3 }}
                  className="pl-4 text-white/30"
                >
                  {"// Hero, features, pricing..."}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 1.5 }}
                >
                  <span className="text-[#FF6E3C]">&lt;/main&gt;</span>
                </motion.div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/40 mb-3">Clean. Predictable. Production-ready.</p>
                <div className="flex items-center gap-3 text-xs">
                  <button className="flex items-center gap-1.5 text-[#FF6E3C] hover:text-[#FF8F5C] transition-colors">
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                  <span className="text-white/20">→</span>
                  <button className="flex items-center gap-1.5 text-[#FF6E3C] hover:text-[#FF8F5C] transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    Export
                  </button>
                  <span className="text-white/20">→</span>
                  <button className="flex items-center gap-1.5 text-[#FF6E3C] hover:text-[#FF8F5C] transition-colors">
                    <Zap className="w-3 h-3" />
                    Deploy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// USE CASES
// ═══════════════════════════════════════════════════════════════

function UseCases() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const cases = [
    {
      title: "For Founders",
      desc: "Rebuild competitor UIs or old products fast. Get to a working UI without specs or mockups.",
      icon: Zap,
    },
    {
      title: "For Developers",
      desc: "Skip layout and interaction boilerplate. Start from real structure, not a blank file.",
      icon: Code2,
    },
    {
      title: "For Designers",
      desc: "Turn references and demos into real code. No handoff friction.",
      icon: Palette,
    },
  ];

  return (
    <section id="use-cases" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">Use Cases</p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            Built for real work
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            >
              <div className="h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 p-8 hover:border-white/[0.12] transition-all duration-300 group">
                <c.icon className="w-8 h-8 text-[#FF6E3C] mb-6 group-hover:scale-110 transition-transform" />
                
                <h3 className="text-xl font-semibold mb-3 text-white/90">{c.title}</h3>
                <p className="text-white/50 leading-relaxed">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRICING
// ═══════════════════════════════════════════════════════════════

function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    { 
      name: "Free", 
      price: "$0",
      priceYearly: "$0",
      tagline: "For getting started", 
      features: [
        "150 credits / month",
        "~2 rebuilds / month",
        "Live preview",
        "Public projects",
        "Basic export",
      ],
      cta: "Get started",
    },
    { 
      name: "Pro", 
      price: "$35",
      priceYearly: "$315",
      tagline: "For creators", 
      features: [
        "3,000 credits / month",
        "~40 rebuilds / month",
        "Private projects",
        "All exports",
        "Style presets",
        "Rollover up to 600 credits",
      ], 
      popular: true,
      cta: "Upgrade",
    },
    { 
      name: "Agency", 
      price: "$99",
      priceYearly: "$891",
      tagline: "For power users", 
      features: [
        "10,000 credits / month",
        "Team access (3 seats)",
        "Priority processing",
        "API access (coming soon)",
        "Rollover up to 2,000 credits",
      ],
      cta: "Upgrade",
    },
  ];

  return (
    <section id="pricing" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Start for free. Upgrade as you go.
          </h2>
          <p className="text-white/50">Pay only for what you generate.</p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <span className={cn("text-sm", !isYearly ? "text-white" : "text-white/40")}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-12 h-6 rounded-full bg-white/10 transition-colors"
          >
            <div className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-[#FF6E3C] transition-all",
              isYearly ? "left-7" : "left-1"
            )} />
          </button>
          <span className={cn("text-sm", isYearly ? "text-white" : "text-white/40")}>Yearly</span>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-[#FF6E3C]/20 text-xs text-[#FF6E3C]">Save 10%</span>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className={cn(
                "rounded-2xl border p-8 relative overflow-hidden transition-all duration-300",
                plan.popular 
                  ? "border-[#FF6E3C]/30 bg-gradient-to-b from-[#FF6E3C]/10 to-transparent hover:border-[#FF6E3C]/50" 
                  : "border-white/[0.06] bg-[#0a0a0a]/50 hover:border-white/[0.12]"
              )}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-[#FF6E3C] text-xs font-medium text-white">
                  Most popular
                </div>
              )}
              
              <div className="text-sm text-white/50 mb-2">{plan.name}</div>
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">
                  {isYearly ? plan.priceYearly : plan.price}
                </span>
                <span className="text-white/40 text-sm">/{isYearly ? "year" : "mo"}</span>
              </div>
              <div className="text-xs text-white/30 mb-6">{plan.tagline}</div>
              
              <div className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <Check className="w-4 h-4 text-[#FF6E3C] shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              
              <Link
                href="/tool"
                className={cn(
                  "block w-full text-center py-3.5 rounded-xl text-sm font-medium transition-all",
                  plan.popular
                    ? "bg-[#FF6E3C] text-white hover:bg-[#FF8F5C]"
                    : "bg-white/[0.05] text-white/70 hover:bg-white/[0.08] border border-white/[0.08]"
                )}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Top-ups block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 max-w-2xl mx-auto text-center"
        >
          <p className="text-sm text-white/50 mb-4">Buy credits anytime</p>
          <div className="flex items-center justify-center gap-4">
            {[
              { price: "$20", credits: "2,000" },
              { price: "$50", credits: "5,500", best: true },
              { price: "$100", credits: "12,000" },
            ].map((pkg) => (
              <div
                key={pkg.price}
                className={cn(
                  "relative px-6 py-4 rounded-xl border transition-colors",
                  pkg.best 
                    ? "border-[#FF6E3C]/50 bg-[#FF6E3C]/10" 
                    : "border-white/10 bg-white/[0.02]"
                )}
              >
                {pkg.best && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#FF6E3C] text-[10px] font-medium text-white">
                    Best value
                  </span>
                )}
                <div className="text-lg font-bold text-white">{pkg.price}</div>
                <div className="text-xs text-white/50">{pkg.credits} credits</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════

function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const faqs = [
    { q: "Does Replay work with mobile apps?", a: "Yes — any video that shows a UI can be used." },
    { q: "Is the code really usable?", a: "Yes. Replay generates clean frontend code designed to be extended." },
    { q: "Can I export to GitHub?", a: "Yes. Copy or export with one click." },
    { q: "Do I need to describe the flow?", a: "No. The video is enough. Context is optional." },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            Questions & Answers
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full text-left rounded-xl border border-white/[0.06] bg-[#0a0a0a]/50 p-6 hover:border-white/[0.12] transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-white/90">{faq.q}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-[#FF6E3C] transition-transform duration-300",
                    openIndex === i && "rotate-180"
                  )} />
                </div>
                
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="pt-4 text-white/50 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FINAL CTA
// ═══════════════════════════════════════════════════════════════

function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl border border-white/[0.06] bg-[#0a0a0a]/50 p-12 md:p-20 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FF6E3C]/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative text-center">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white/90">
              Turn any video into a working UI.
            </h2>
            <p className="text-2xl sm:text-3xl font-bold mb-8 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] bg-clip-text text-transparent">
              Start building.
            </p>
            
            <Link
              href="/tool"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-semibold text-lg shadow-[0_20px_60px_-20px_rgba(255,110,60,0.5)] hover:shadow-[0_30px_80px_-20px_rgba(255,110,60,0.6)] transition-all hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
