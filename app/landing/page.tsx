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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { DitheringShader } from "@/components/ui/dithering-shader";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth/context";
import Avatar from "@/components/Avatar";
import { useProfile } from "@/lib/profile/context";

// ═══════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// SMOOTH SCROLL HANDLER
// ═══════════════════════════════════════════════════════════════

function smoothScrollTo(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ═══════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "Solution", href: "#solution" },
  { name: "Security", href: "#security" },
  { name: "Pricing", href: "/pricing" },
  { name: "Docs", href: "/docs" },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { user, isLoading: authLoading } = useAuth();
  const { profile } = useProfile();
  
  // Get user display name
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Track active section on scroll
  useEffect(() => {
    const handleSectionScroll = () => {
      const sections = ["features", "solution", "security"];
      let current = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleSectionScroll);
    return () => window.removeEventListener("scroll", handleSectionScroll);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      smoothScrollTo(href.substring(1));
      setMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav className={cn(
        "mx-auto max-w-6xl rounded-2xl transition-all duration-300",
        isScrolled 
          ? "bg-white/90 backdrop-blur-xl border border-zinc-200 shadow-lg" 
          : "bg-transparent"
      )}>
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo dark />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn("text-sm transition-all duration-200", item.href === `#${activeSection}` ? "text-orange-500 font-medium" : "text-zinc-600 hover:text-zinc-900")}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-200 animate-pulse" />
            ) : user ? (
              <>
                <Link 
                  href="/tool" 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors"
                >
                  Go to App
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/settings" className="flex items-center gap-2">
                  <Avatar 
                    src={profile?.avatar_url} 
                    fallback={displayName[0]?.toUpperCase() || 'U'} 
                    size={32}
                    className="border border-zinc-200"
                  />
                </Link>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="bg-zinc-900 text-white hover:bg-zinc-800">
                  <Link href="/contact">Book a Demo</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-zinc-200 px-6 py-4 bg-white rounded-b-2xl"
            >
              <div className="flex flex-col gap-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="text-zinc-600 hover:text-zinc-900 transition-colors py-2"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 pt-4 border-t border-zinc-200">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 py-2">
                        <Avatar 
                          src={profile?.avatar_url} 
                          fallback={displayName[0]?.toUpperCase() || 'U'} 
                          size={32}
                          className="border border-zinc-200"
                        />
                        <span className="text-sm font-medium text-zinc-700">{displayName}</span>
                      </div>
                      <Button variant="default" asChild className="w-full bg-zinc-900 hover:bg-zinc-800">
                        <Link href="/tool">Go to App</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="dark-outline" asChild className="w-full">
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <Button asChild className="w-full bg-zinc-900 text-white hover:bg-zinc-800">
                        <Link href="/contact">Book a Demo</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-zinc-950">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedGroup preset="blur-slide" className="flex flex-col items-center">
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 border border-zinc-800 rounded-full bg-zinc-900/50">
                Visual Reverse Engineering for Enterprise
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-white">
              <span className="whitespace-nowrap">Modernize without{" "}<span className="italic text-zinc-500">rewriting.</span></span>
              <br />
              <span className="whitespace-nowrap">Document without{" "}<span className="italic text-zinc-500">archaeology.</span></span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-sm md:text-base text-zinc-500 max-w-xl leading-relaxed">
              Replay observes real user workflows in your legacy system and generates 
              documented React components — directly from video.
            </p>

            {/* Proof Bullets */}
            <motion.div 
              className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {["No rewrites", "No reverse engineering", "No guesswork", "Engineer-owned code"].map((item) => (
                <motion.div 
                  key={item}
                  variants={fadeInUp}
                  className="flex items-center gap-1.5 text-zinc-500"
                >
                  <Check className="w-4 h-4 text-zinc-600" />
                  <span className="text-xs">{item}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="bg-white text-zinc-900 hover:bg-zinc-100">
                <Link href="/contact">
                  Book a pilot
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" asChild className="bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700">
                <Link href="https://www.replay.build/tool?project=flow_1769444036799_r8hrcxyx2">
                  Explore Demo
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

          </AnimatedGroup>
        </div>
      </div>

      {/* Hero Visual - Screen mockup */}
      <div className="relative z-10 px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {/* Browser header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 bg-zinc-900">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 text-center text-[10px] text-zinc-600">replay.build/tool</div>
            </div>
            {/* Screenshot placeholder */}
            <div className="aspect-[16/9] bg-zinc-950 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Play className="w-6 h-6 text-zinc-500 ml-0.5" />
                </div>
                <p className="text-zinc-600 text-xs">Legacy UI → Modern React Components</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL PROOF SECTION (Marquee)
// ═══════════════════════════════════════════════════════════════

function SocialProofSection() {
  const stats = [
    { value: "10+", label: "Enterprise pilots" },
    { value: "500k", label: "Lines analyzed" },
    { value: "70%", label: "Avg. time savings" },
    { value: "3mo", label: "To production" },
  ];

  const logos = [
    "Financial Services", "Healthcare Systems", "Insurance Platforms", "Government Legacy",
    "Retail Operations", "Supply Chain", "Manufacturing ERP", "Telecom Billing"
  ];

  return (
    <section className="py-16 bg-zinc-950 overflow-hidden">
      <div className="landing-container">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-light text-white tracking-tight">{stat.value}</p>
              <p className="text-xs text-zinc-600 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Marquee */}
      <div className="relative overflow-hidden py-6 border-y border-zinc-800/50">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
        
        <div className="flex whitespace-nowrap">
          <div className="animate-marquee flex">
            {logos.map((logo, i) => (
              <span key={i} className="mx-12 text-sm text-zinc-700 tracking-tight">{logo}</span>
            ))}
          </div>
          <div className="animate-marquee flex" aria-hidden="true">
            {logos.map((logo, i) => (
              <span key={`dup-${i}`} className="mx-12 text-sm text-zinc-700 tracking-tight">{logo}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROBLEM SECTION (Bento Grid)
// ═══════════════════════════════════════════════════════════════

function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-20 lg:py-32 bg-zinc-950 relative overflow-hidden" ref={ref}>
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="landing-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            Rewrites fail.{" "}
            <span className="italic text-zinc-500">Yours doesn't have to.</span>
          </h2>
          <p className="text-sm text-zinc-500 max-w-xl mx-auto">
            Manual modernization runs over budget, slips for quarters, or gets paused indefinitely.
          </p>
        </motion.div>

        {/* Problem Cards - Dark theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 - Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
              <FileQuestion className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-base font-medium text-white mb-2">The Documentation Gap</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              Nobody documented how it works. Senior devs spend months reverse engineering.
            </p>
            <div className="pt-4 border-t border-zinc-800/50">
              <p className="text-3xl font-light text-white">67%</p>
              <p className="text-xs text-zinc-600 mt-1">of legacy systems lack documentation</p>
            </div>
          </motion.div>

          {/* Card 2 - Roadmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
              <AlertOctagon className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-base font-medium text-white mb-2">The Roadmap Freeze</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              18 months of 'modernization'. Zero new features shipped. Leadership questions progress.
            </p>
            <div className="pt-4 border-t border-zinc-800/50">
              <p className="text-3xl font-light text-white">18mo</p>
              <p className="text-xs text-zinc-600 mt-1">average enterprise rewrite timeline</p>
            </div>
          </motion.div>

          {/* Card 3 - Risk */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
              <TrendingDown className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-base font-medium text-white mb-2">The Failure Rate</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              Most rewrites get paused, cancelled, or exceed their timeline and budget.
            </p>
            <div className="pt-4 border-t border-zinc-800/50">
              <p className="text-3xl font-light text-white">70%</p>
              <p className="text-xs text-zinc-600 mt-1">fail or exceed timeline</p>
            </div>
          </motion.div>
        </div>
        
        {/* Timeline Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Zap className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">Production-ready code in days, not years</h4>
                <p className="text-zinc-600 text-xs">Skip the discovery phase. Start with working UI.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-500 text-xs">Ready to deploy</span>
            </div>
          </div>

          {/* Timeline Bars */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/50">
            {/* Traditional */}
            <div className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0">
                <span className="text-xs text-zinc-500">Traditional</span>
                <p className="text-[10px] text-zinc-700">18-24 months</p>
              </div>
              <div className="flex-1">
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-zinc-600 to-red-500/60"
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: "100%" } : {}}
                    transition={{ duration: 2, delay: 0.3 }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-zinc-600 w-12 text-right">ongoing</span>
            </div>

            {/* Replay */}
            <div className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0">
                <span className="text-xs text-white">Replay</span>
                <p className="text-[10px] text-emerald-500/80">Days to weeks</p>
              </div>
              <div className="flex-1">
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: "12%" } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-emerald-500 w-12 text-right">done ✓</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOLUTION SECTION (3-Step Process) - Technical Minimalist
// ═══════════════════════════════════════════════════════════════

function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="solution" className="relative py-20 lg:py-32 bg-zinc-950 overflow-hidden" ref={ref}>
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="landing-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            From black box to{" "}
            <span className="italic text-zinc-500">documented codebase</span>
          </h2>
          <p className="text-sm text-zinc-500 max-w-xl mx-auto">
            Three steps. No guessing. No archaeology.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Step 1 - Record */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
          >
            <div className="w-7 h-7 mb-3 rounded-lg bg-zinc-800 flex items-center justify-center">
              <span className="font-mono text-xs text-zinc-400">01</span>
            </div>
            
            <h3 className="text-sm font-medium text-white mb-2">Record the Workflow</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">Your users already know how it works. A few minutes of screen recording replaces extensive documentation.</p>
            
            {/* Visual */}
            <div className="relative w-full h-24 bg-zinc-900/80 rounded-lg border border-zinc-800/50 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-3 h-3 rounded-full bg-zinc-600" />
                </motion.div>
              </div>
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] rounded font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-zinc-500" />
                REC
              </div>
            </div>
          </motion.div>

          {/* Step 2 - Extract */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
          >
            <div className="w-7 h-7 mb-3 rounded-lg bg-zinc-800 flex items-center justify-center">
              <span className="font-mono text-xs text-zinc-400">02</span>
            </div>
            
            <h3 className="text-sm font-medium text-white mb-2">Extraction Engine Maps</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">Replay maps screens, components, and interactions from real usage — including validations.</p>
            
            {/* Visual - Component mapping */}
            <div className="relative w-full h-24 bg-zinc-900/80 rounded-lg border border-zinc-800/50 p-2">
              <div className="flex gap-1.5 h-full">
                <div className="flex-1 rounded border border-zinc-800 bg-zinc-800/30" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex-1 rounded border border-zinc-800 bg-zinc-800/30" />
                  <div className="flex-1 rounded border border-zinc-800 bg-zinc-800/30" />
                </div>
              </div>
              <div className="absolute top-1 right-1 flex gap-1">
                {["Nav", "Form"].map((label) => (
                  <span key={label} className="px-1 py-0.5 bg-zinc-800 text-zinc-600 text-[8px] rounded font-mono">{label}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Step 3 - Export */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
          >
            <div className="w-7 h-7 mb-3 rounded-lg bg-zinc-800 flex items-center justify-center">
              <span className="font-mono text-xs text-zinc-400">03</span>
            </div>
            
            <h3 className="text-sm font-medium text-white mb-2">Export Documented Code</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">Clean React + Tailwind components. Your engineers review and connect to existing APIs.</p>
            
            {/* Code preview */}
            <div className="relative w-full h-24 bg-zinc-900/80 rounded-lg border border-zinc-800/50 p-2.5 font-mono text-[9px] overflow-hidden">
              <div className="space-y-0.5 text-zinc-600">
                <div><span className="text-zinc-500">export function</span> <span className="text-zinc-400">UserForm</span>() {"{"}</div>
                <div className="pl-2"><span className="text-zinc-600">return (</span></div>
                <div className="pl-4 text-zinc-700">// Generated</div>
                <div className="pl-2">)</div>
                <div>{"}"}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button size="lg" asChild className="bg-white text-zinc-900 hover:bg-zinc-100">
            <Link href="/pricing">
              Check Pricing
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" asChild className="bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700">
            <Link href="https://www.replay.build/tool?project=flow_1769444036799_r8hrcxyx2">
              Explore Demo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// BENTO FEATURES SECTION - Clean & Minimal
// ═══════════════════════════════════════════════════════════════

function BentoFeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Simple Bento Card Component - no hover effects, clean
  const BentoCard = ({ 
    className, 
    children, 
    delay = 0 
  }: { 
    className?: string; 
    children: React.ReactNode; 
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(
        "rounded-xl bg-zinc-900/60 border border-zinc-800/60 overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );

  return (
    <section className="relative py-20 lg:py-32 bg-zinc-950 overflow-hidden" ref={ref}>
      {/* Subtle Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />
      </div>

      <div className="landing-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-6">
            <span className="text-xs text-zinc-400">The Complete System</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            Everything you need to{" "}
            <span className="italic text-zinc-500">modernize</span>
          </h2>
          <p className="text-sm text-zinc-500 max-w-xl mx-auto">
            From video to deployed architecture. One unified system.
          </p>
        </motion.div>

        {/* Bento Grid - Library as Main */}
        <div className="grid grid-cols-12 gap-3 lg:gap-4">
          
          {/* LIBRARY - Large Main Card */}
          <BentoCard className="col-span-12 lg:col-span-8 row-span-2" delay={0.1}>
            <div className="p-5 lg:p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-base font-medium text-white">Library</h3>
              </div>
              <p className="text-zinc-500 text-xs mb-4 max-w-sm">
                Auto-generated Design System. Every button, color, and input cataloged as reusable tokens.
              </p>
              
              {/* Component Grid Preview */}
              <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  { name: "Button", el: <div className="w-full h-6 rounded bg-white" /> },
                  { name: "Input", el: <div className="w-full h-6 rounded border border-zinc-700 bg-zinc-800" /> },
                  { name: "Card", el: <div className="w-full h-6 rounded bg-zinc-800 border border-zinc-700" /> },
                  { name: "Badge", el: <div className="w-8 h-4 rounded-full bg-zinc-700 mx-auto" /> },
                  { name: "Avatar", el: <div className="w-6 h-6 rounded-full bg-zinc-600 mx-auto" /> },
                  { name: "Toggle", el: <div className="w-8 h-4 rounded-full bg-zinc-700 mx-auto" /> },
                  { name: "Select", el: <div className="w-full h-6 rounded bg-zinc-800 border border-zinc-700" /> },
                  { name: "Modal", el: <div className="w-full h-6 rounded bg-zinc-800 border border-zinc-600" /> },
                  { name: "Table", el: <div className="w-full h-6 rounded bg-zinc-800 flex gap-px"><div className="flex-1 bg-zinc-700" /><div className="flex-1 bg-zinc-700" /></div> },
                  { name: "Chart", el: <div className="w-full h-6 rounded bg-zinc-800 flex items-end gap-0.5 p-1"><div className="flex-1 bg-zinc-600 h-2" /><div className="flex-1 bg-zinc-600 h-4" /><div className="flex-1 bg-zinc-600 h-3" /></div> },
                  { name: "Nav", el: <div className="w-full h-6 rounded bg-zinc-800 flex items-center gap-1 px-1"><div className="w-2 h-2 rounded bg-zinc-600" /><div className="flex-1 h-1 bg-zinc-700" /></div> },
                  { name: "Form", el: <div className="w-full h-6 rounded bg-zinc-800 flex flex-col gap-0.5 p-1"><div className="w-full h-1 bg-zinc-700" /><div className="w-2/3 h-1 bg-zinc-700" /></div> },
                ].map((comp, i) => (
                  <motion.div
                    key={comp.name}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                    className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50"
                  >
                    <div className="mb-1.5">{comp.el}</div>
                    <span className="text-[9px] text-zinc-600 font-mono">{comp.name}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* Tags */}
              <div className="mt-4 pt-3 border-t border-zinc-800/50 flex flex-wrap gap-1.5">
                {["WCAG", "Visual Tests", "Controls", "Actions", "Variants"].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-zinc-800/50 text-[9px] text-zinc-500">{tag}</span>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* FLOW MAP - Vertical */}
          <BentoCard className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-2" delay={0.15}>
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-white">Flow Map</h3>
              </div>
              <p className="text-zinc-500 text-xs mb-4">
                Visual architecture mapping from video. Detecting visited pages and logic gaps.
              </p>
              
              {/* Flow Visualization */}
              <div className="flex-1 relative bg-zinc-900/50 rounded-lg border border-zinc-800/50 overflow-hidden min-h-[200px]">
                <div className="absolute inset-0 opacity-[0.02]"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                />
                {/* Nodes */}
                <motion.div
                  className="absolute top-6 left-6 w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <span className="text-zinc-400 text-[9px] font-mono">LOGIN</span>
                </motion.div>
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-600 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <span className="text-zinc-300 text-[10px] font-mono">DASH</span>
                </motion.div>
                <motion.div
                  className="absolute top-6 right-6 w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  <span className="text-zinc-400 text-[9px] font-mono">USERS</span>
                </motion.div>
                <motion.div
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 0.5 } : {}}
                  transition={{ duration: 0.4, delay: 0.9 }}
                >
                  <span className="text-zinc-600 text-[9px]">?</span>
                </motion.div>
                
                {/* Simple connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <motion.line
                    x1="60" y1="50" x2="50%" y2="50%"
                    stroke="rgba(113,113,122,0.3)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={isInView ? { pathLength: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  />
                  <motion.line
                    x1="50%" y1="50%" x2="calc(100% - 60px)" y2="50"
                    stroke="rgba(113,113,122,0.3)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={isInView ? { pathLength: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  />
                </svg>
                
                {/* Labels */}
                <div className="absolute bottom-2 left-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    <span className="text-[8px] text-zinc-600">Observed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full border border-dashed border-zinc-600" />
                    <span className="text-[8px] text-zinc-600">Detected</span>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* BLUEPRINTS */}
          <BentoCard className="col-span-6 lg:col-span-4" delay={0.2}>
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-white">Blueprints</h3>
              </div>
              <p className="text-zinc-500 text-[11px] mb-3">
                Edit components with AI. Changes propagate globally.
              </p>
              
              <div className="flex-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-2.5">
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-zinc-800/50">
                  <Zap className="w-3 h-3 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500">AI Edit</span>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono mb-2">
                  &gt; "Make it rounded"
                </div>
                <motion.div
                  className="w-full h-6 bg-zinc-800"
                  initial={{ borderRadius: "4px" }}
                  animate={isInView ? { borderRadius: "9999px" } : {}}
                  transition={{ duration: 0.6, delay: 0.8 }}
                />
              </div>
            </div>
          </BentoCard>

          {/* MULTIPLAYER */}
          <BentoCard className="col-span-6 lg:col-span-4" delay={0.25}>
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-white">Multiplayer</h3>
              </div>
              <p className="text-zinc-500 text-[11px] mb-3">
                Real-time collaboration with live cursors.
              </p>
              
              <div className="flex-1 relative bg-zinc-900/50 rounded-lg border border-zinc-800/50 min-h-[60px]">
                <motion.div
                  className="absolute flex items-center gap-1"
                  style={{ left: "20%", top: "30%" }}
                  animate={{ left: ["20%", "50%", "30%"], top: ["30%", "50%", "40%"] }}
                  transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
                >
                  <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.5 3.5L19.5 12L12 13L9 20.5L5.5 3.5Z" />
                  </svg>
                  <span className="px-1 py-0.5 rounded bg-zinc-700 text-[8px] text-zinc-300">Alex</span>
                </motion.div>
                <motion.div
                  className="absolute flex items-center gap-1"
                  style={{ left: "60%", top: "60%" }}
                  animate={{ left: ["60%", "30%", "50%"], top: ["60%", "35%", "55%"] }}
                  transition={{ duration: 7, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                >
                  <svg className="w-3 h-3 text-zinc-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.5 3.5L19.5 12L12 13L9 20.5L5.5 3.5Z" />
                  </svg>
                  <span className="px-1 py-0.5 rounded bg-zinc-700 text-[8px] text-zinc-300">Sam</span>
                </motion.div>
              </div>
            </div>
          </BentoCard>

          {/* AI AUTOMATION */}
          <BentoCard className="col-span-6 lg:col-span-4" delay={0.3}>
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium text-white">AI Automation</h3>
              </div>
              <p className="text-zinc-500 text-[11px] mb-3">
                API Contracts, E2E Tests, Tech Debt Audits.
              </p>
              
              <div className="flex-1 space-y-1.5">
                {[
                  { name: "API Contracts", done: true },
                  { name: "E2E Tests", done: true },
                  { name: "Documentation", done: false },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-1.5 px-2.5 rounded bg-zinc-900/50 border border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500">{item.name}</span>
                    {item.done ? (
                      <Check className="w-3 h-3 text-zinc-500" />
                    ) : (
                      <div className="w-3 h-3 border border-zinc-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* LIVE PREVIEW */}
          <BentoCard className="col-span-12 lg:col-span-6" delay={0.35}>
            <div className="p-5 h-full flex flex-col sm:flex-row gap-4">
              <div className="sm:w-1/3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-medium text-white">Preview</h3>
                </div>
                <p className="text-zinc-500 text-[11px] mb-3">
                  Point & click editing with instant feedback.
                </p>
                <div className="flex flex-wrap gap-1">
                  {["Mobile", "Desktop"].map((m) => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-zinc-800/50 text-[9px] text-zinc-600">{m}</span>
                  ))}
                </div>
              </div>
              
              <div className="sm:flex-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50 overflow-hidden min-h-[100px]">
                <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-zinc-800/50">
                  <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  <div className="flex-1 h-3 rounded bg-zinc-800/50 mx-4" />
                </div>
                <div className="p-3">
                  <div className="w-2/3 h-3 rounded bg-zinc-800 mb-2" />
                  <div className="w-1/2 h-2 rounded bg-zinc-800/50 mb-3" />
                  <div className="w-16 h-5 rounded bg-zinc-800 flex items-center justify-center">
                    <span className="text-[8px] text-zinc-500">Button</span>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* CODE EXPORT */}
          <BentoCard className="col-span-12 lg:col-span-6" delay={0.4}>
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Code className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium text-white">Export Code</h3>
              </div>
              <p className="text-zinc-500 text-[11px] mb-3">
                Clean React + Tailwind. Ready for your engineers.
              </p>
              
              <div className="flex-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-3 font-mono text-[9px] overflow-hidden">
                <div className="text-zinc-500">export function <span className="text-zinc-300">UserForm</span>() {'{'}</div>
                <div className="pl-2 text-zinc-600">return (</div>
                <div className="pl-4 text-zinc-600">&lt;div className="..."&gt;</div>
                <div className="pl-6 text-zinc-700">// Generated component</div>
                <div className="pl-4 text-zinc-600">&lt;/div&gt;</div>
                <div className="pl-2 text-zinc-600">)</div>
                <div className="text-zinc-500">{'}'}</div>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROI CALCULATOR SECTION
// ═══════════════════════════════════════════════════════════════

function ROICalculatorSection() {
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
    <section className="py-20 lg:py-32 bg-zinc-950 relative overflow-hidden" ref={ref}>
      {/* Top separator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>
      
      <div className="landing-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            Estimate your{" "}
            <span className="italic text-zinc-500">investment</span>
          </h2>
          <p className="text-sm text-zinc-500 max-w-xl mx-auto">
            See potential time savings with visual workflow extraction.
          </p>
        </motion.div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-4">
            {/* Inputs */}
            <div className="space-y-6 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">ROI Calculator</p>
              
              <div>
                <label className="flex justify-between mb-2">
                  <span className="text-xs text-zinc-400">Screens/Modules</span>
                  <span className="text-xs font-medium text-white">{screens}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={screens}
                  onChange={(e) => setScreens(Number(e.target.value))}
                  className="roi-slider-dark"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-2">
                  <span className="text-xs text-zinc-400">Hours per Screen (Manual)</span>
                  <span className="text-xs font-medium text-white">{hoursPerScreen}h</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={hoursPerScreen}
                  onChange={(e) => setHoursPerScreen(Number(e.target.value))}
                  className="roi-slider-dark"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-2">
                  <span className="text-xs text-zinc-400">Team Hourly Rate</span>
                  <span className="text-xs font-medium text-white">${hourlyRate}</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="roi-slider-dark"
                />
              </div>
            </div>

            {/* Results */}
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-4">Potential Savings</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-zinc-500">Hours Saved</p>
                  <p className="font-serif text-3xl text-white">{savedHours.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-[10px] text-zinc-500">Estimated Value</p>
                  <p className="font-serif text-4xl text-white">${savedValue.toLocaleString()}</p>
                </div>
                
                <div className="pt-4 border-t border-zinc-800/50">
                  <p className="text-[10px] text-zinc-600">
                    Based on typical pilot results. Actual savings vary.
                  </p>
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
// SECURITY SECTION - Technical Animated Version
// ═══════════════════════════════════════════════════════════════

// Animated Grid Background
function AnimatedGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Corner brackets */}
      <svg className="absolute top-8 left-8 w-16 h-16 text-white/10" viewBox="0 0 64 64">
        <path d="M0 20V0h20M44 0h20v20" stroke="currentColor" fill="none" strokeWidth="1"/>
      </svg>
      <svg className="absolute bottom-8 right-8 w-16 h-16 text-white/10" viewBox="0 0 64 64">
        <path d="M0 44v20h20M44 64h20V44" stroke="currentColor" fill="none" strokeWidth="1"/>
      </svg>
      
      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-[0.015]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
        }} 
      />
    </div>
  );
}

function SecuritySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Shield,
      title: "Configurable Retention",
      body: "Default is processing-only with no storage. Configure retention policies to match your compliance requirements.",
      badge: null
    },
    {
      icon: Eye,
      title: "PII Detection",
      body: "Automatic detection of sensitive data patterns. Blur or mask before processing.",
      badge: "BETA"
    },
    {
      icon: Server,
      title: "On-Premise Deployment",
      body: "Deploy Replay on your infrastructure for complete data isolation.",
      badge: "ENTERPRISE"
    },
    {
      icon: ClipboardCheck,
      title: "Security Controls",
      body: "Audit logging, access controls, and security practices aligned with SOC 2 framework.",
      badge: "IN PROGRESS"
    }
  ];

  return (
    <section id="security" className="relative py-20 lg:py-32 bg-zinc-950 text-white overflow-hidden" ref={ref}>
      {/* Animated Background */}
      <AnimatedGridBackground />
      
      <div className="landing-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6">
            Built for{" "}
            <span className="italic text-zinc-400">regulated environments</span>
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Your recordings, your control.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              {/* Animated border */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all duration-500 hover:bg-white/[0.04] h-full">
                {/* Scan line on hover */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                />
                
                <div className="flex items-start justify-between mb-4">
                  <motion.div 
                    className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center"
                    whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <feature.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                  </motion.div>
                  {feature.badge && (
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-mono tracking-wider rounded border",
                      feature.badge === "BETA" && "border-zinc-700 text-zinc-500",
                      feature.badge === "ENTERPRISE" && "border-zinc-700 text-zinc-500",
                      feature.badge === "IN PROGRESS" && "border-zinc-700 text-zinc-500"
                    )}>
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-white mb-2 group-hover:text-white transition-colors">{feature.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">{feature.body}</p>
                
                {/* Corner accent */}
                <div className="absolute bottom-2 right-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 16 16" className="w-full h-full text-white/10">
                    <path d="M12 16V12H16" stroke="currentColor" fill="none" strokeWidth="1"/>
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compliance Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-6 text-xs text-zinc-600 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              SOC 2 Type II
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              GDPR
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              HIPAA-ready
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FAQ SECTION - Technical Dark Theme
// ═══════════════════════════════════════════════════════════════

function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Does it connect to our backend systems?",
      a: "Replay generates frontend components. Your team connects them to existing APIs and databases during integration. We map data structure from what's visible in the UI."
    },
    {
      q: "Is the generated code maintainable?",
      a: "Yes. Output uses standard React patterns with Tailwind and Shadcn components. Code follows conventions your team already knows."
    },
    {
      q: "How accurate is the extraction?",
      a: "Accuracy depends on UI complexity and recording quality. Most teams use Replay to accelerate UI reconstruction, then review business logic during integration."
    },
    {
      q: "What about sensitive data in recordings?",
      a: "PII detection (beta) identifies common patterns. For maximum security, use on-premise deployment where recordings never leave your network."
    },
    {
      q: "Can we deploy on our infrastructure?",
      a: "Yes. Enterprise customers can deploy Replay on-premise with full network isolation."
    },
    {
      q: "What types of applications work best?",
      a: "Any application with consistent UI workflows that you can screen-record. Best results on form-based applications, dashboards, and data entry systems."
    }
  ];

  return (
    <section className="relative py-20 lg:py-32 bg-zinc-950 overflow-hidden" ref={ref}>
      {/* Top separator line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
      </div>
      
      {/* Background */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/15 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
          }} 
        />
      </div>
      
      <div className="landing-container max-w-3xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            Questions your team{" "}
            <span className="italic text-zinc-400">will ask</span>
          </h2>
          <p className="text-lg text-zinc-500">
            Clear answers for technical evaluation.
          </p>
        </motion.div>

        {/* FAQ Grid */}
        <div className="grid gap-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group"
            >
              <div className={cn(
                "relative p-5 rounded-xl border transition-all duration-300 cursor-pointer",
                openIndex === i 
                  ? "bg-white/[0.03] border-white/10" 
                  : "bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.02] hover:border-white/[0.08]"
              )}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                {/* Corner accent */}
                <svg className={cn(
                  "absolute top-3 right-3 w-4 h-4 transition-colors",
                  openIndex === i ? "text-white/20" : "text-white/5"
                )} viewBox="0 0 16 16">
                  <path d="M12 16V12H16" stroke="currentColor" fill="none" strokeWidth="1"/>
                </svg>
                
                <button className="w-full flex items-center justify-between text-left">
                  <span className={cn(
                    "font-medium text-sm transition-colors pr-8",
                    openIndex === i ? "text-white" : "text-zinc-300 group-hover:text-white"
                  )}>{faq.q}</span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform flex-shrink-0",
                    openIndex === i ? "rotate-180 text-zinc-400" : "text-zinc-600"
                  )} />
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FOOTER CTA SECTION + FOOTER (Combined dark)
// ═══════════════════════════════════════════════════════════════

function FooterSection() {
  return (
    <section className="relative bg-zinc-950 overflow-hidden">
      {/* Animated Background for dark sections */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
          }} 
        />
      </div>
      
      {/* CTA */}
      <div className="relative z-10 py-24 lg:py-32 border-t border-zinc-800/50">
        <div className="landing-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              See Replay extract from{" "}
              <span className="italic text-zinc-400">your legacy screen</span>
            </h2>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto mb-10">
              One recording. One call. Real output to evaluate.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild className="group bg-white text-zinc-900 border border-zinc-700 hover:bg-zinc-100">
                <Link href="/contact">
                  Book a Demo
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            
            <p className="mt-8 text-sm text-zinc-500">
              We'll process one of your workflows live during the call
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800">
        <div className="landing-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            </div>
            
            <p className="text-sm text-zinc-600">
              © 2026 Replay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </section>
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
    <div className="landing-page min-h-screen relative">
      {/* Global grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
        }} 
      />
      <Header />
      <main>
        <HeroSection />
        <SocialProofSection />
        <ProblemSection />
        <SolutionSection />
        <BentoFeaturesSection />
        <ROICalculatorSection />
        <SecuritySection />
        <FAQSection />
        <FooterSection />
      </main>
    </div>
  );
}
