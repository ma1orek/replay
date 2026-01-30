"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Menu,
  ChevronRight,
  ChevronDown,
  Play,
  Shield,
  Eye,
  Server,
  ClipboardCheck,
  FileQuestion,
  AlertOctagon,
  TrendingDown,
  Zap,
  Layers,
  Code,
  PhoneCall,
  MoveRight,
  Minus,
  Terminal,
  Cpu,
  Workflow,
  Box,
  Grid,
  Plus,
  Lock,
  FileText,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { DitheringShader } from "@/components/ui/dithering-shader";
// BeamsBackground removed - caused scroll lag
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth/context";
import Avatar from "@/components/Avatar";
import { useProfile } from "@/lib/profile/context";

import { Navbar } from "@/components/landing/Navbar";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { VideoCompare } from "@/components/ui/video-compare";
import { BlurFade } from "@/components/ui/blur-fade";

// ═══════════════════════════════════════════════════════════════
// UI HELPERS (Technical Style)
// ═══════════════════════════════════════════════════════════════

const TechGrid = () => (
  <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
    <div 
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #808080 1px, transparent 1px),
          linear-gradient(to bottom, #808080 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
      }}
    />
    <div 
      className="absolute inset-0 opacity-[0.015]" 
      style={{
        backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════

function HeroSection() {
  const ref = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };
      
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <section className="relative h-screen max-h-[1080px] flex flex-col overflow-hidden bg-[#09090b]">
      {/* Shader Background - Dark */}
      <div className="absolute inset-0 z-0">
        <DitheringShader
          width={dimensions.width}
          height={dimensions.height}
          shape="wave"
          type="8x8"
          colorBack="#09090b"
          colorFront="#f97316"
          pxSize={4}
          speed={0.3}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-20 md:pt-32">
        <div className="max-w-5xl mx-auto text-center">
          <AnimatedGroup preset="blur-slide" className="flex flex-col items-center">
            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight text-white">
              <span className="whitespace-nowrap">Modernize without{" "}<span className="italic text-orange-500">rewriting.</span></span>
              <br />
              <span className="whitespace-nowrap">Document without{" "}<span className="italic text-orange-500">archaeology.</span></span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-xl md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
              Replay observes real user workflows in your legacy system and generates 
              documented React components — directly from video.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="group bg-white text-zinc-900 border-2 border-white hover:bg-zinc-100 h-12 px-8 rounded-full text-base ring-1 ring-white/50">
                <Link href="/contact">
                  Book a pilot
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" asChild className="bg-transparent text-white border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 h-12 px-8 rounded-full text-base">
                <Link href="https://www.replay.build/tool?project=flow_1769444036799_r8hrcxyx2">
                  Explore Live Sandbox
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </AnimatedGroup>
        </div>
      </div>

      {/* Hero Visual - No Border/Stroke/Shadow */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="w-full max-w-6xl"
        >
          <div className="relative overflow-hidden">
            <img 
              src="/hero-bg.png" 
              alt="Replay Platform" 
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRUST BAR - Animated Marquee with Legacy Systems
// ═══════════════════════════════════════════════════════════════

function TrustBarSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // All the legacy systems, industries, and technologies
  const items = [
    // Industries
    "Financial Services",
    "Healthcare",
    "Telecom",
    "Logistics",
    "GovTech",
    "Insurance",
    "Banking",
    "Manufacturing",
    "Retail",
    "Energy",
    // Legacy Technologies
    "COBOL",
    "Mainframe",
    "AS/400",
    "Oracle Forms",
    "PowerBuilder",
    "Delphi",
    "Visual Basic 6",
    "Classic ASP",
    "Cold Fusion",
    "Lotus Notes",
    // Frameworks
    "JSP/JSF",
    "Struts",
    "Spring MVC",
    "PHP Legacy",
    "Perl CGI",
    "jQuery Spaghetti",
    "AngularJS 1.x",
    "Backbone.js",
    "ExtJS",
    "GWT",
    // Databases
    "DB2",
    "Informix",
    "Sybase",
    "MS Access",
    "FoxPro",
    // Systems
    "SAP GUI",
    "PeopleSoft",
    "Siebel CRM",
    "Salesforce Classic",
    "SharePoint 2010",
    "Lotus Domino",
    "Custom ERP",
    "Internal Portals",
    "Legacy Intranets",
    "Monolithic Apps"
  ];

  return (
    <section className="py-8 bg-zinc-950 border-t border-zinc-900 overflow-hidden" ref={ref}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <p className="text-xs text-zinc-500 text-center font-mono uppercase tracking-widest px-4">
          Built for teams modernizing mission-critical systems
        </p>
        
        {/* Marquee Container with Fade */}
        <div className="relative w-full">
          {/* Left Fade */}
          <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
          {/* Right Fade */}
          <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling Track */}
          <div className="flex overflow-hidden">
            <motion.div
              className="flex gap-8 items-center"
              animate={{
                x: [0, -50 * items.length],
              }}
              transition={{
                x: {
                  duration: 60,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            >
              {/* First set */}
              {items.map((item, i) => (
                <span 
                  key={`a-${i}`}
                  className="text-sm text-zinc-600 whitespace-nowrap font-medium tracking-wide flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  {item}
                </span>
              ))}
              {/* Duplicate for seamless loop */}
              {items.map((item, i) => (
                <span 
                  key={`b-${i}`}
                  className="text-sm text-zinc-600 whitespace-nowrap font-medium tracking-wide flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  {item}
                </span>
              ))}
              {/* Third set for extra smoothness */}
              {items.map((item, i) => (
                <span 
                  key={`c-${i}`}
                  className="text-sm text-zinc-600 whitespace-nowrap font-medium tracking-wide flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// MANUAL MODERNIZATION TRAP - Cards + Video Compare
// ═══════════════════════════════════════════════════════════════

function ManualModernizationTrapSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const trapCards = [
    {
      icon: FileQuestion,
      title: "The Documentation Gap",
      description: "Nobody knows how logic works. Senior devs spend months reverse-engineering undocumented spaghetti code instead of building."
    },
    {
      icon: AlertOctagon,
      title: "The Roadmap Freeze", 
      description: "18 months of 'modernization' means 18 months of zero new features. Business stalls while engineering plays catch-up."
    },
    {
      icon: TrendingDown,
      title: "The 'Broken' Delivery",
      description: "Manual rewrites introduce regressions. You fix the code but break the business logic that worked for 10 years."
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-zinc-950 border-t border-zinc-900" ref={ref}>
      <div className="landing-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            The Manual Modernization{" "}
            <span className="italic text-zinc-500">Trap</span>
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Why 70% of rewrite projects fail or run over budget.
          </p>
        </motion.div>

        {/* TOP: Video Compare - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* OLD WAY */}
          <BlurFade delay={0.1} inView>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <p className="text-sm font-mono text-zinc-400 uppercase tracking-wider">The Old Way</p>
                  <p className="text-xs text-zinc-600">Manual Reverse-Engineering</p>
                </div>
                <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-1 border border-zinc-800">12-18 mo</span>
              </div>
              <div className="border border-zinc-800 bg-zinc-900 overflow-hidden aspect-video">
                <video
                  src="https://auth.replay.build/storage/v1/object/public/videos/nqYIsFb5xQ6v3DJ3BCvg-_e5d2d52be84c475ca24219a8733c259d%20(1).mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              <p className="text-xs text-zinc-600 mt-3 px-1">High risk of regressions. Infinite loops. Team burnout.</p>
            </div>
          </BlurFade>

          {/* REPLAY WAY */}
          <BlurFade delay={0.2} inView>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <p className="text-sm font-mono text-orange-500 uppercase tracking-wider">The Replay Way</p>
                  <p className="text-xs text-zinc-600">Automated Extraction</p>
                </div>
                <span className="text-xs font-mono text-orange-500 bg-orange-500/10 px-2 py-1 border border-orange-500/30">Days</span>
              </div>
              <div className="border border-orange-500/30 bg-zinc-900 overflow-hidden aspect-video relative">
                <video
                  src="https://auth.replay.build/storage/v1/object/public/videos/n6_ouT2RyKYzCkGwtDRav_e8db0ca9272c47dbb9ee330d0194df86%20(1).mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              <p className="text-xs text-zinc-500 mt-3 px-1">Zero guessing. Pixel-perfect code. Strategic oversight.</p>
            </div>
          </BlurFade>
        </div>

        {/* BOTTOM: Three Problem Cards in a Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trapCards.map((card, index) => (
            <BlurFade key={index} delay={0.3 + index * 0.1} inView>
              <div className="group p-6 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors relative h-full">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700 opacity-50" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 opacity-50" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700 opacity-50" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-700 opacity-50" />
                
                <card.icon className="w-5 h-5 text-zinc-500 mb-4" />
                <h3 className="text-base font-medium text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROBLEM SECTION (Bento Grid) - Technical Style
// ═══════════════════════════════════════════════════════════════

function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-20 lg:py-28 bg-zinc-950 border-t border-zinc-900" ref={ref}>
      <div className="landing-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6">
            Rewrites fail.{" "}
            <span className="italic text-zinc-500">Yours doesn't have to.</span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto text-lg">
            Manual modernization runs over budget, slips for quarters, or gets paused indefinitely.
          </p>
        </motion.div>

        {/* Problem Cards - Dark Grid Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800 border border-zinc-800 rounded-lg overflow-hidden">
          {/* Card 1 - Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="group p-8 bg-zinc-950 hover:bg-zinc-900/50 transition-colors relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <FileQuestion className="w-4 h-4 text-zinc-400" />
              </div>
              <h3 className="text-base font-medium text-white">The Documentation Gap</h3>
            </div>
            <div className="mb-8">
              <motion.p 
                className="text-4xl font-light text-white tabular-nums tracking-tight"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                67%
              </motion.p>
              <p className="text-xs text-zinc-500 mt-2 uppercase tracking-wider">lack documentation</p>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Nobody documented how it works. Senior devs spend months reverse engineering undocumented code.
            </p>
          </motion.div>

          {/* Card 2 - Roadmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group p-8 bg-zinc-950 hover:bg-zinc-900/50 transition-colors relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4 text-zinc-400" />
              </div>
              <h3 className="text-base font-medium text-white">The Roadmap Freeze</h3>
            </div>
            <div className="mb-8">
              <motion.p 
                className="text-4xl font-light text-white tabular-nums tracking-tight"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
              >
                18mo
              </motion.p>
              <p className="text-xs text-zinc-500 mt-2 uppercase tracking-wider">rewrite timeline</p>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              18 months of 'modernization'. Zero new features shipped. Leadership questions progress.
            </p>
          </motion.div>

          {/* Card 3 - Risk */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group p-8 bg-zinc-950 hover:bg-zinc-900/50 transition-colors relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-zinc-400" />
              </div>
              <h3 className="text-base font-medium text-white">The Failure Rate</h3>
            </div>
            <div className="mb-8">
              <motion.p 
                className="text-4xl font-light text-white tabular-nums tracking-tight"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.7 }}
              >
                70%
              </motion.p>
              <p className="text-xs text-zinc-500 mt-2 uppercase tracking-wider">fail or exceed timeline</p>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Most rewrites get paused, cancelled, or dramatically exceed their timeline and budget.
            </p>
          </motion.div>
        </div>
        
        {/* Timeline Comparison - Technical */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 p-1 rounded-lg bg-zinc-800 border border-zinc-800"
        >
          <div className="bg-zinc-950 p-8 rounded border border-zinc-900 relative overflow-hidden">
            <TechGrid />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <h4 className="text-white text-sm font-medium">Production-ready code in days</h4>
                  </div>
                  <p className="text-zinc-500 text-xs">Skip the discovery phase. Start with working UI.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-zinc-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-500 text-xs font-mono">READY_TO_DEPLOY</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Traditional */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-2 font-mono">
                    <span>TRADITIONAL</span>
                    <span>18-24 MONTHS</span>
                  </div>
                  <div className="h-2 bg-zinc-900 rounded overflow-hidden border border-zinc-800">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-zinc-700 to-zinc-600"
                      initial={{ width: "0%" }}
                      animate={isInView ? { width: "100%" } : {}}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                  </div>
                  <span className="absolute right-0 top-8 text-[10px] text-zinc-600 font-mono">...ongoing</span>
                </div>

                {/* Replay */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs text-zinc-300 mb-2 font-mono">
                    <span className="text-white">REPLAY</span>
                    <span className="text-emerald-500">DAYS TO WEEKS</span>
                  </div>
                  <div className="h-2 bg-zinc-900 rounded overflow-hidden border border-zinc-800 relative">
                    {/* Grid lines inside bar */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xIDFhMSAxIDAgMCAxIDAgMmgxVjFIMXoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: "0%" }}
                      animate={isInView ? { width: "12%" } : {}}
                      transition={{ duration: 0.8, delay: 0.8 }}
                    />
                  </div>
                  <motion.div
                    className="absolute top-8 text-[10px] text-emerald-500 font-mono flex items-center gap-1"
                    style={{ left: "12%", transform: "translateX(-50%)" }}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 1.6 }}
                  >
                    <Check className="w-3 h-3" />
                    <span>DONE</span>
                  </motion.div>
                </div>
              </div>
              
              {/* Timeline Ticks */}
              <div className="mt-8 flex justify-between text-[9px] text-zinc-700 font-mono border-t border-zinc-900 pt-2">
                <span>START</span>
                <span>6 MO</span>
                <span>12 MO</span>
                <span>18 MO</span>
                <span>24 MO</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// BENTO FEATURES SECTION - Technical Command Grid
// ═══════════════════════════════════════════════════════════════

function BentoFeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const BentoCard = ({ 
    className, 
    children, 
    delay = 0,
    title,
    icon: Icon
  }: { 
    className?: string; 
    children: React.ReactNode; 
    delay?: number;
    title?: string;
    icon?: any;
  }) => (
    <BlurFade delay={delay} inView className={cn("h-full", className)}>
      <div
        className={cn(
          "relative group bg-zinc-950 border border-zinc-800 overflow-hidden h-full",
          className
        )}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700 opacity-50" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 opacity-50" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700 opacity-50" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-700 opacity-50" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col p-6">
          {(title || Icon) && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-900 border-dashed">
              {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
              {title && <span className="text-sm font-mono text-zinc-300 tracking-tight">{title}</span>}
            </div>
          )}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </BlurFade>
  );

  return (
    <section className="relative py-20 bg-zinc-950 overflow-hidden" ref={ref}>
      {/* Subtle gradient glow instead of heavy BeamsBackground */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle radial glow */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(100,150,255,0.3) 0%, transparent 60%)'
          }}
        />
        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-zinc-950 to-transparent" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      <div className="landing-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            Everything you need to{" "}
            <span className="italic text-zinc-500">modernize</span>
          </h2>
          <p className="text-sm text-zinc-500 max-w-xl mx-auto font-mono">
            From video to deployed architecture. One unified system.
          </p>
        </motion.div>

        {/* Technical Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* RECONSTRUCTION - First / Top */}
          <BentoCard className="col-span-1 md:col-span-12 min-h-[300px]" delay={0.05} title="RECONSTRUCTION" icon={Database}>
            <div className="flex flex-col md:flex-row gap-8 h-full">
              <div className="md:w-1/3 flex flex-col justify-center">
                <h3 className="text-xl text-white font-medium mb-3">Reconstruct from video</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Turn screen recordings into pixel-perfect React code. Our engine analyzes layout, typography, and spacing to recreate your interface with accuracy in given style creating new design system.
                </p>
              </div>
              <div className="md:w-2/3 relative rounded border border-zinc-800 overflow-hidden group">
                <img src="/recon.png" alt="Reconstruction" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          </BentoCard>
          
          {/* LIBRARY - Large Main Card */}
          <BentoCard className="col-span-1 md:col-span-8 md:row-span-2 min-h-[400px]" delay={0.1} title="COMPONENT LIBRARY" icon={Layers}>
            <p className="text-zinc-500 text-xs mb-6 max-w-sm">
              From chaos to a living Design System. Instantly catalog every button, color, and input as reusable tokens.
            </p>
            
            <div className="relative w-full h-[300px] rounded border border-zinc-800 overflow-hidden group">
              <img src="/lib.png" alt="Library" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </BentoCard>

          {/* FLOW MAP */}
          <BentoCard className="col-span-1 md:col-span-4 md:row-span-2 min-h-[400px]" delay={0.15} title="FLOW" icon={Workflow}>
            <p className="text-zinc-500 text-xs mb-6">
              Visual architecture mapping from video. Detecting visited pages and logic gaps.
            </p>
            
            <div className="relative w-full h-[300px] rounded border border-zinc-800 overflow-hidden group">
              <img src="/flow.png" alt="Flow Map" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </BentoCard>

          {/* BLUEPRINTS */}
          <BentoCard className="col-span-1 md:col-span-4 min-h-[240px]" delay={0.2} title="BLUEPRINTS" icon={Box}>
            <p className="text-zinc-500 text-[11px] mb-4">
              Create & edit components with AI. Changes propagate globally.
            </p>
            
            <div className="relative w-full h-32 rounded border border-zinc-800 overflow-hidden group">
              <img src="/blue.png" alt="Blueprints" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </BentoCard>

          {/* MULTIPLAYER - Animated */}
          <BentoCard className="col-span-1 md:col-span-4 min-h-[240px]" delay={0.25} title="MULTIPLAYER" icon={Grid}>
            <p className="text-zinc-500 text-[11px] mb-4">
              Real-time collaboration with live cursors.
            </p>
            
            <div className="relative w-full h-32 rounded border border-zinc-800 overflow-hidden">
              <img src="/multi-1.png" alt="Multiplayer" className="w-full h-full object-cover opacity-60" />
              
              {/* Animated Cursors */}
              <motion.div 
                className="absolute z-10 top-1/4 left-1/4"
                animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="relative">
                  <svg className="w-4 h-4 text-orange-500 fill-current" viewBox="0 0 24 24"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                  <span className="absolute left-3 top-3 bg-orange-500 text-black text-[8px] px-1 rounded font-bold">John</span>
                </div>
              </motion.div>

              <motion.div 
                className="absolute z-10 bottom-1/3 right-1/3"
                animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="relative">
                  <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                  <span className="absolute left-3 top-3 bg-blue-500 text-black text-[8px] px-1 rounded font-bold">Oliver</span>
                </div>
              </motion.div>

              <motion.div 
                className="absolute z-10 top-1/2 right-10"
                animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              >
                <div className="relative">
                  <svg className="w-4 h-4 text-purple-500 fill-current" viewBox="0 0 24 24"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                  <span className="absolute left-3 top-3 bg-purple-500 text-black text-[8px] px-1 rounded font-bold">Megan</span>
                </div>
              </motion.div>
            </div>
          </BentoCard>

          {/* AI AUTOMATION / CODE */}
          <BentoCard className="col-span-1 md:col-span-4 min-h-[240px]" delay={0.3} title="AUTOMATION & CODE" icon={Cpu}>
            <p className="text-zinc-500 text-[11px] mb-4">
              Instant API contracts, tests, and technical debt audits.
            </p>
            
            <div className="relative w-full h-32 rounded border border-zinc-800 overflow-hidden group">
              <img src="/code.png" alt="Code" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </BentoCard>

        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <Button size="lg" asChild className="h-11 px-6 rounded-full bg-white text-zinc-950 hover:bg-zinc-200">
            <Link href="/pricing" className="flex items-center gap-2">
              Check Pricing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="ghost" asChild className="h-11 px-6 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800">
            <Link href="https://www.replay.build/tool?project=flow_1769444036799_r8hrcxyx2" className="flex items-center gap-2">
              Try Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMBINED ROI + SECURITY SECTION - Side by Side
// ═══════════════════════════════════════════════════════════════

function ROIAndSecuritySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const [screens, setScreens] = useState(15);
  const [hoursPerScreen, setHoursPerScreen] = useState(40);
  const [hourlyRate, setHourlyRate] = useState(100);

  const totalHours = screens * hoursPerScreen;
  const replayHours = Math.round(totalHours * 0.3);
  const savedHours = totalHours - replayHours;
  const savedValue = savedHours * hourlyRate;

  return (
    <section className="py-20 lg:py-28 bg-zinc-950 border-t border-zinc-900" ref={ref}>
      <div className="landing-container">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT: Data-Driven Growth / ROI Calculator */}
          <BlurFade delay={0.1} inView className="flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl md:text-3xl text-white mb-2">
                Data-Driven Growth
              </h2>
              <p className="text-zinc-500 text-sm">
                Stop guessing. Start saving. Calculate your modernization potential.
              </p>
            </div>

            {/* ROI Panel */}
            <div className="bg-zinc-950 border border-zinc-800 flex-1">
              <TechGrid />
              
              {/* Header Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-500" />
                  <h3 className="text-sm font-medium text-zinc-300">Estimate Savings</h3>
                </div>
              </div>

              <div className="p-6 space-y-6 relative z-10">
                {[
                  { label: "Screens to Migrate", value: screens, setter: setScreens, min: 5, max: 50, unit: "" },
                  { label: "Hours per Screen", value: hoursPerScreen, setter: setHoursPerScreen, min: 20, max: 60, unit: "h" },
                  { label: "Hourly Rate", value: hourlyRate, setter: setHourlyRate, min: 50, max: 150, unit: "$" }
                ].map((control) => (
                  <div key={control.label}>
                    <div className="flex justify-between mb-2 font-mono text-xs">
                      <span className="text-zinc-500">{control.label}</span>
                      <span className="text-orange-500">{control.unit === "$" ? "$" : ""}{control.value}{control.unit !== "$" ? control.unit : ""}</span>
                    </div>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      value={control.value}
                      onChange={(e) => control.setter(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                ))}

                <div className="pt-6 border-t border-zinc-800 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-500">Hours Saved</span>
                    <motion.span 
                      key={savedHours}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-3xl font-light text-white tabular-nums"
                    >
                      {savedHours.toLocaleString()}
                    </motion.span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-500">Estimated Value</span>
                    <motion.span 
                      key={savedValue}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-4xl font-light text-white tabular-nums tracking-tight"
                    >
                      ${savedValue.toLocaleString()}
                    </motion.span>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-mono pt-2">
                    Based on 70% average time savings from pilot results.
                  </p>
                </div>
              </div>
            </div>
          </BlurFade>

          {/* RIGHT: Built for regulated environments / Security */}
          <BlurFade delay={0.2} inView className="flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl md:text-3xl text-white mb-2">
                Built for regulated environments
              </h2>
              <p className="text-zinc-500 text-sm">Your recordings, your control.</p>
            </div>

            {/* Security Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {/* Card 1 */}
              <div className="p-5 bg-zinc-950 border border-zinc-800">
                <h3 className="text-white font-medium mb-2 text-sm">Configurable Retention</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Default is processing-only with no storage. Configure retention policies to match your compliance requirements.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-3 right-3 px-2 py-0.5 border border-zinc-700 text-[9px] font-mono text-zinc-400">BETA</div>
                <h3 className="text-white font-medium mb-2 text-sm">PII Detection</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Automatic detection of sensitive data patterns. Blur or mask before processing.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-3 right-3 px-2 py-0.5 border border-zinc-700 text-[9px] font-mono text-zinc-400">ENTERPRISE</div>
                <h3 className="text-white font-medium mb-2 text-sm">On-Premise Deployment</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Deploy Replay on your infrastructure for complete data isolation.
                </p>
              </div>

              {/* Card 4 */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-3 right-3 px-2 py-0.5 border border-zinc-700 text-[9px] font-mono text-zinc-400">IN PROGRESS</div>
                <h3 className="text-white font-medium mb-2 text-sm">Security Controls</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Audit logging, access controls, and security practices aligned with SOC 2 framework.
                </p>
              </div>
            </div>
          </BlurFade>

        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FAQ SECTION - Expanded Accordion
// ═══════════════════════════════════════════════════════════════

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { 
      q: "Does Replay work with custom internal frameworks?", 
      a: "Yes. Replay's extraction engine is framework-agnostic at the visual level. We map pixels and interactions to your target design system, regardless of the legacy underlying tech (JSP, JSF, PHP, etc.)." 
    },
    { 
      q: "How accurate is the code generation?", 
      a: "We aim for 90-95% visual accuracy. The generated code is clean React + Tailwind, structured logically. It requires developer review for business logic connection, but the heavy lifting of UI reconstruction is automated." 
    },
    { 
      q: "Is my data safe?", 
      a: "Absolutely. We offer on-premise deployment for enterprise clients, ensuring no data ever leaves your VPC. For cloud users, we are SOC 2 Type II compliant." 
    },
    {
      q: "Can I export to other frameworks?",
      a: "Currently we optimize for React and Tailwind CSS. Support for Vue, Angular, and plain HTML/CSS is on our roadmap."
    },
    {
      q: "How does the pricing work?",
      a: "We offer usage-based pricing for teams and custom licenses for enterprise. Contact us for a pilot to estimate your modernization costs."
    }
  ];

  return (
    <section className="py-24 bg-zinc-950 border-t border-zinc-900">
      <div className="landing-container max-w-3xl">
        <BlurFade delay={0.1} inView>
          <h2 className="text-3xl font-serif text-white mb-12 text-center">Frequently Asked Questions</h2>
        </BlurFade>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <BlurFade key={i} delay={0.15 + i * 0.05} inView>
              <div className="border-b border-zinc-800 bg-transparent overflow-hidden">
                <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <span className="text-white font-medium">{faq.q}</span>
                <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform", openIndex === i && "rotate-180")} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 text-sm text-zinc-400 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRE-FOOTER CTA - Final Push
// ═══════════════════════════════════════════════════════════════

function PreFooterCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 lg:py-32 bg-zinc-950 border-t border-zinc-900 relative overflow-hidden" ref={ref}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(249,115,22,0.4) 0%, transparent 60%)'
          }}
        />
      </div>
      
      <div className="landing-container relative z-10">
        <BlurFade delay={0.1} inView className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-6">
            Rewrites fail.{" "}
            <span className="italic text-zinc-500">Yours doesn't have to.</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Manual modernization runs over budget, slips for quarters, or gets paused indefinitely.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="group bg-white text-zinc-900 border border-white hover:bg-zinc-100 h-12 px-8 rounded-full text-base">
              <Link href="/contact">
                Book a Pilot Strategy Call
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" asChild className="bg-transparent text-zinc-400 border border-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-600 h-12 px-8 rounded-full text-base">
              <Link href="/docs">
                View Documentation
                <FileText className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FOOTER - Minimal Dark
// ═══════════════════════════════════════════════════════════════

function FooterSection() {
  return (
    <footer className="py-12 bg-zinc-950 border-t border-zinc-900">
      <div className="landing-container flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Logo dark={false} />
        </div>
        <div className="flex gap-6 text-xs text-zinc-500 font-mono">
          <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY</Link>
          <Link href="/terms" className="hover:text-white transition-colors">TERMS</Link>
          <Link href="/docs" className="hover:text-white transition-colors">DOCS</Link>
        </div>
        <p className="text-xs text-zinc-600 font-mono">© 2026 REPLAY</p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function LandingPage() {
  // Smooth scroll behavior for the entire page
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="landing-page min-h-screen relative bg-black text-white selection:bg-orange-500/30">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBarSection />
        <ManualModernizationTrapSection />
        <BentoFeaturesSection />
        <SolutionSection />
        <ROIAndSecuritySection />
        <FAQSection />
        <PreFooterCTASection />
        <FooterSection />
      </main>
    </div>
  );
}
