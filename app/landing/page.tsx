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
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ 
        width: window.innerWidth * 2, 
        height: window.innerHeight * 2 
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Shader Background */}
      <div className="absolute inset-0 z-0">
        <DitheringShader
          width={dimensions.width}
          height={dimensions.height}
          shape="wave"
          type="8x8"
          colorBack="#fffbf7"
          colorFront="#f97316"
          pxSize={4}
          speed={0.3}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fffbf7]/90 via-[#fffbf7]/70 to-[#fffbf7]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20">
        <div className="max-w-5xl mx-auto text-center">
          <AnimatedGroup preset="blur-slide" className="flex flex-col items-center">
            {/* Badge - Subtle */}
            <div className="mb-8 self-start"><span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 border border-zinc-200 rounded-full bg-white/80 backdrop-blur-sm">Visual Reverse Engineering for Enterprise</span></div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] tracking-tight text-zinc-900">
              <span className="whitespace-nowrap">Modernize without{" "}<span className="italic text-orange-600">rewriting.</span></span>
              <br />
              <span className="whitespace-nowrap">Document without{" "}<span className="italic text-orange-600">archaeology.</span></span>
            </h1>

            {/* Subheadline */}
            <p className="mt-8 text-lg md:text-xl text-zinc-600 max-w-2xl leading-relaxed">
              Replay observes real user workflows in your legacy system and generates 
              documented React components — directly from video.
            </p>

            {/* Proof Bullets */}
            <motion.div 
              className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {["No rewrites", "No reverse engineering workshops", "No guesswork", "Engineer-owned code"].map((item, i) => (
                <motion.div 
                  key={item}
                  variants={fadeInUp}
                  className="flex items-center gap-2 text-zinc-700"
                >
                  <Check className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium">{item}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Button size="xl" asChild className="group bg-zinc-900 text-white border border-zinc-900 hover:bg-zinc-800 shadow-sm">
                <Link href="/contact">
                  Book a pilot
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="xl" asChild className="bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50 shadow-sm">
                <Link href="https://www.replay.build/tool?project=flow_1769444036799_r8hrcxyx2">
                  Explore Live Sandbox
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

          </AnimatedGroup>
        </div>
      </div>

      {/* Hero Visual - Screen mockup */}
      <div className="relative z-10 px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-200/50 overflow-hidden">
            {/* Browser header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center text-xs text-zinc-400">replay.build</div>
            </div>
            {/* Screenshot placeholder */}
            <div className="aspect-[16/9] bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <p className="text-zinc-400 text-sm">Legacy UI → Modern React Components</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Curve transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-white" style={{ borderRadius: "2rem 2rem 0 0" }} />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL PROOF SECTION (Marquee)
// ═══════════════════════════════════════════════════════════════

function SocialProofSection() {
  const stats = [
    { value: "10+", label: "Enterprise pilots" },
    { value: "500k", label: "Lines of legacy code analyzed" },
    { value: "70%", label: "Avg. time savings" },
    { value: "3", label: "Months to production" },
  ];

  const logos = [
    "Financial Services", "Healthcare Systems", "Insurance Platforms", "Government Legacy",
    "Retail Operations", "Supply Chain", "Manufacturing ERP", "Telecom Billing"
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="landing-container">
        {/* "Built for teams" FIRST */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-lg text-zinc-600 font-medium">
            Built for teams modernizing mission-critical systems
          </p>
        </motion.div>

        {/* Stats Grid - consistent sizing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-5xl md:text-6xl font-light text-zinc-900 tracking-tight">{stat.value}</p>
              <p className="text-base text-zinc-500 mt-3">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Marquee */}
      <div className="relative overflow-hidden py-8 border-y border-zinc-100">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-white to-transparent z-10" />
        
        <div className="flex whitespace-nowrap">
          <div className="animate-marquee flex">
            {logos.map((logo, i) => (
              <span
                key={i}
                className="mx-16 text-lg text-zinc-400 tracking-tight"
              >
                {logo}
              </span>
            ))}
          </div>
          <div className="animate-marquee flex" aria-hidden="true">
            {logos.map((logo, i) => (
              <span
                key={`dup-${i}`}
                className="mx-16 text-lg text-zinc-400 tracking-tight"
              >
                {logo}
              </span>
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
    <section id="features" className="py-20 lg:py-32 bg-white" ref={ref}>
      <div className="landing-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-zinc-900 mb-6">
            Rewrites fail.{" "}
            <span className="italic text-orange-600">Yours doesn't have to.</span>
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Manual modernization runs over budget, slips for quarters, or gets paused indefinitely.
          </p>
        </motion.div>

        {/* Problem Cards - Clean, consistent, minimal colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 - Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
              <FileQuestion className="w-6 h-6 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">The Documentation Gap</h3>
            <p className="text-zinc-600 leading-relaxed mb-6">
              Nobody documented how it works. Senior devs spend months reverse engineering undocumented code.
            </p>
            <div className="pt-6 border-t border-zinc-100">
              <p className="text-4xl font-light text-zinc-900">67%</p>
              <p className="text-sm text-zinc-500 mt-1">of legacy systems lack documentation</p>
            </div>
          </motion.div>

          {/* Card 2 - Roadmap */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-8 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
              <AlertOctagon className="w-6 h-6 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">The Roadmap Freeze</h3>
            <p className="text-zinc-600 leading-relaxed mb-6">
              18 months of 'modernization'. Zero new features shipped. Leadership questions progress.
            </p>
            <div className="pt-6 border-t border-zinc-100">
              <p className="text-4xl font-light text-zinc-900">18mo</p>
              <p className="text-sm text-zinc-500 mt-1">average enterprise rewrite timeline</p>
            </div>
          </motion.div>

          {/* Card 3 - Risk */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
              <TrendingDown className="w-6 h-6 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">The Failure Rate</h3>
            <p className="text-zinc-600 leading-relaxed mb-6">
              Most rewrites get paused, cancelled, or dramatically exceed their timeline and budget.
            </p>
            <div className="pt-6 border-t border-zinc-100">
              <p className="text-4xl font-light text-zinc-900">70%</p>
              <p className="text-sm text-zinc-500 mt-1">fail or exceed timeline</p>
            </div>
          </motion.div>
        </div>
        
        {/* Combined Solution Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-zinc-200/60 shadow-sm"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-zinc-800 font-medium text-base tracking-tight">Production-ready code in days, not years</h4>
                <p className="text-zinc-500 text-sm">Skip the discovery phase. Start with working UI components.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 text-sm font-medium">Ready to deploy</span>
            </div>
          </div>

          {/* Timeline Bars */}
          <div className="space-y-5 pt-4 border-t border-zinc-100">
            {/* Traditional Rewrite Bar */}
            <div className="flex items-start gap-4">
              <div className="w-28 flex-shrink-0 pt-1">
                <span className="text-sm font-medium text-zinc-700">Traditional</span>
                <p className="text-[10px] text-zinc-400">18-24 months</p>
              </div>
              <div className="flex-1">
                <div className="w-full h-[2px] bg-zinc-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #a1a1aa 0%, #a1a1aa 60%, #ef4444 100%)" }}
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: "100%" } : {}}
                    transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
                  />
                </div>
                <motion.span 
                  className="block text-right mt-1 text-[10px] font-medium text-red-400"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 2.5 }}
                >
                  ...ongoing
                </motion.span>
              </div>
            </div>

            {/* Replay Bar */}
            <div className="flex items-start gap-4">
              <div className="w-28 flex-shrink-0 pt-1">
                <span className="text-sm font-medium text-zinc-900">Replay</span>
                <p className="text-[10px] text-emerald-600">Days to weeks</p>
              </div>
              <div className="flex-1 relative">
                <div className="w-full h-[2px] bg-zinc-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: "12%" } : {}}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
                {/* Done label below bar */}
                <motion.span
                  className="absolute mt-1 text-[10px] font-semibold text-emerald-600"
                  style={{ left: "12%", transform: "translateX(-50%)" }}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: 1.3 }}
                >
                  Done ✓
                </motion.span>
              </div>
            </div>
          </div>
          
          {/* Scale indicator */}
          <div className="mt-6 ml-32 flex items-center justify-between text-[9px] text-zinc-400">
            <span>Start</span>
            <span>6 mo</span>
            <span>12 mo</span>
            <span>18 mo</span>
            <span>24 mo</span>
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
    <section id="solution" className="relative py-20 lg:py-32 bg-zinc-50 overflow-hidden" ref={ref}>
      {/* Grain overlay for light section */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
        }} 
      />
      
      <div className="landing-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-zinc-900 mb-6">
            From black box to{" "}
            <span className="italic text-zinc-500">documented codebase</span>
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Three steps. No guessing. No archaeology.
          </p>
        </motion.div>

        {/* Steps with technical animations */}
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {/* Step 1 - Record */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="group relative"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-zinc-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all duration-500 h-full">
              {/* Corner accent */}
              <svg className="absolute top-3 right-3 w-6 h-6 text-zinc-200 group-hover:text-zinc-400 transition-colors" viewBox="0 0 24 24">
                <path d="M18 24V18H24" stroke="currentColor" fill="none" strokeWidth="1"/>
              </svg>
              
              {/* Step Number */}
              <div className="w-8 h-8 mb-4 rounded-lg bg-zinc-900 flex items-center justify-center">
                <span className="font-mono text-sm text-white">01</span>
              </div>
              
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Record the Workflow</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">Your users already know how it works. A few minutes of screen recording replaces extensive documentation efforts.</p>
              
              {/* Technical Visual */}
              <div className="relative w-full h-28 bg-zinc-950 rounded-lg overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div 
                      className="w-4 h-4 rounded-full bg-white"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/10 backdrop-blur text-white text-[10px] rounded font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  REC 00:05:32
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2 - Extract */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="group relative"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-zinc-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all duration-500 h-full">
              <svg className="absolute top-3 right-3 w-6 h-6 text-zinc-200 group-hover:text-zinc-400 transition-colors" viewBox="0 0 24 24">
                <path d="M18 24V18H24" stroke="currentColor" fill="none" strokeWidth="1"/>
              </svg>
              
              <div className="w-8 h-8 mb-4 rounded-lg bg-zinc-900 flex items-center justify-center">
                <span className="font-mono text-sm text-white">02</span>
              </div>
              
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Extraction Engine Maps</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">Replay maps screens, components, and interactions from real usage — including validations and data relationships.</p>
              
              {/* Technical Visual - Component mapping */}
              <div className="relative w-full h-28 bg-zinc-950 rounded-lg overflow-hidden p-3">
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                />
                <div className="relative flex gap-2 h-full">
                  <motion.div 
                    className="flex-1 rounded border border-white/20 bg-white/5"
                    animate={{ borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="flex-1 flex flex-col gap-2">
                    <motion.div 
                      className="flex-1 rounded border border-white/20 bg-white/5"
                      animate={{ borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div 
                      className="flex-1 rounded border border-white/20 bg-white/5"
                      animate={{ borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    />
                  </div>
                </div>
                <div className="absolute top-1 right-1 flex gap-1">
                  {["Nav", "Form", "Table"].map((label, i) => (
                    <motion.span 
                      key={label}
                      className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[9px] rounded font-mono"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: 1 + i * 0.15 }}
                    >
                      {label}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 3 - Export */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-zinc-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all duration-500 h-full">
              <svg className="absolute top-3 right-3 w-6 h-6 text-zinc-200 group-hover:text-zinc-400 transition-colors" viewBox="0 0 24 24">
                <path d="M18 24V18H24" stroke="currentColor" fill="none" strokeWidth="1"/>
              </svg>
              
              <div className="w-8 h-8 mb-4 rounded-lg bg-zinc-900 flex items-center justify-center">
                <span className="font-mono text-sm text-white">03</span>
              </div>
              
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Export Documented Code</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">Clean React + Tailwind components. Your engineers review the output and connect to existing APIs.</p>
              
              {/* Code preview */}
              <div className="relative w-full h-28 bg-zinc-950 rounded-lg p-3 font-mono text-[10px] overflow-hidden">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
                <motion.div 
                  className="space-y-1 text-white/70"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.8 }}
                >
                  <div><span className="text-white/40">export</span> <span className="text-white/60">function</span> <span className="text-white">UserForm</span><span className="text-white/40">()</span> <span className="text-white/40">{"{"}</span></div>
                  <div className="pl-3"><span className="text-white/40">return</span> <span className="text-white/40">(</span></div>
                  <div className="pl-6 text-white/30">{"// Generated component"}</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-16 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" asChild className="group bg-zinc-900 text-white hover:bg-zinc-800">
            <Link href="/pricing">
              Check Pricing
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" asChild className="bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50">
            <Link href="https://www.replay.build/tool?project=flow_1769444036799_r8hrcxyx2">
              Explore Demo Workflow
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
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
  const replayHours = Math.round(totalHours * 0.3); // 70% savings estimate
  const savedHours = totalHours - replayHours;
  const savedValue = savedHours * hourlyRate;

  return (
    <section className="py-20 lg:py-32 bg-white" ref={ref}>
      <div className="landing-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-zinc-900 mb-6">
            Estimate your modernization{" "}
            <span className="italic text-orange-600">investment</span>
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            See potential time savings with visual workflow extraction.
          </p>
        </motion.div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-8 p-8 rounded-2xl bg-zinc-50 border border-zinc-200">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">ROI Calculator</p>
              
              <div>
                <label className="flex justify-between mb-3">
                  <span className="text-sm font-medium text-zinc-700">Screens/Modules to Migrate</span>
                  <span className="text-sm font-bold text-orange-600">{screens}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={screens}
                  onChange={(e) => setScreens(Number(e.target.value))}
                  className="roi-slider"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-3">
                  <span className="text-sm font-medium text-zinc-700">Hours per Screen (Manual)</span>
                  <span className="text-sm font-bold text-orange-600">{hoursPerScreen}h</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={hoursPerScreen}
                  onChange={(e) => setHoursPerScreen(Number(e.target.value))}
                  className="roi-slider"
                />
              </div>
              
              <div>
                <label className="flex justify-between mb-3">
                  <span className="text-sm font-medium text-zinc-700">Team Hourly Rate</span>
                  <span className="text-sm font-bold text-orange-600">${hourlyRate}</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="roi-slider"
                />
              </div>
            </div>

            {/* Results */}
            <div className="p-8 rounded-2xl bg-zinc-900 text-white border-2 border-orange-500/30">
              <h3 className="text-sm font-medium text-zinc-400 mb-6">POTENTIAL SAVINGS</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-zinc-400">Hours Saved</p>
                  <p className="font-serif text-4xl text-white">{savedHours.toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-zinc-400">Estimated Value</p>
                  <p className="font-serif text-5xl text-orange-500">${savedValue.toLocaleString()}</p>
                </div>
                
                <div className="pt-6 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">
                    Estimates based on typical pilot results. Actual savings vary by system complexity.
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
        <ROICalculatorSection />
        <SecuritySection />
        <FAQSection />
        <FooterSection />
      </main>
    </div>
  );
}
