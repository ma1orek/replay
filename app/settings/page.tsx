"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  CreditCard,
  Zap,
  Check,
  ArrowLeft,
  Calendar,
  RotateCcw,
  Plus,
  ExternalLink,
  Loader2,
  Info,
  X,
  Send,
  Camera,
  Pencil,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  Palette,
  Building2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useCredits, PLAN_LIMITS, CREDIT_COSTS } from "@/lib/credits/context";
import { useProfile } from "@/lib/profile/context";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import AuthModal from "@/components/modals/AuthModal";
import { StylePreview } from "@/components/StyleInjector";
import { cn } from "@/lib/utils";

// Loading fallback for Suspense
function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin" />
    </div>
  );
}

const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "plans", label: "Plans", icon: CreditCard },
  { id: "credits", label: "Credits", icon: Zap },
  { id: "preferences", label: "Preferences", icon: Settings },
];

// Elastic "PRO" Subscription Tiers with Stripe Price IDs (Lovable-style)
const PRICING_TIERS = [
  {
    id: 'pro25',
    label: "10 Generations",
    credits: 1500,
    monthlyPrice: 25,
    stripePriceId_Monthly: "price_1SotL1Axch1s4iBGWMvO0JBZ",
    yearlyPriceMonthly: 20,
    yearlyPriceTotal: 240,
    yearlySavings: "$60",
    stripePriceId_Yearly: "price_1SotSpAxch1s4iBGbDC8je02",
  },
  {
    id: 'pro50',
    label: "22 Generations",
    credits: 3300,
    monthlyPrice: 50,
    stripePriceId_Monthly: "price_1SotLqAxch1s4iBG1ViXkfc2",
    yearlyPriceTotal: 480,
    yearlyPriceMonthly: 40,
    yearlySavings: "$120",
    stripePriceId_Yearly: "price_1SotT5Axch1s4iBGUt6BTDDf",
  },
  {
    id: 'pro100',
    label: "50 Generations",
    credits: 7500,
    popular: true,
    monthlyPrice: 100,
    stripePriceId_Monthly: "price_1SotMYAxch1s4iBGLZZ7ATBs",
    yearlyPriceTotal: 960,
    yearlyPriceMonthly: 80,
    yearlySavings: "$240",
    stripePriceId_Yearly: "price_1SotTJAxch1s4iBGYRBGTHK6",
  },
  {
    id: 'pro200',
    label: "110 Generations",
    credits: 16500,
    monthlyPrice: 200,
    stripePriceId_Monthly: "price_1SotN4Axch1s4iBGUJEfzznw",
    yearlyPriceTotal: 1920,
    yearlyPriceMonthly: 160,
    yearlySavings: "$480",
    stripePriceId_Yearly: "price_1SotTdAxch1s4iBGpyDigl9b",
  },
  {
    id: 'pro300',
    label: "170 Generations",
    credits: 25500,
    monthlyPrice: 300,
    stripePriceId_Monthly: "price_1SotNMAxch1s4iBGzRD7B7VI",
    yearlyPriceTotal: 2880,
    yearlyPriceMonthly: 240,
    yearlySavings: "$720",
    stripePriceId_Yearly: "price_1SotTqAxch1s4iBGgaWwuU0Z",
  },
  {
    id: 'pro500',
    label: "300 Generations",
    credits: 45000,
    monthlyPrice: 500,
    stripePriceId_Monthly: "price_1SotNuAxch1s4iBGPl81sHqx",
    yearlyPriceTotal: 4800,
    yearlyPriceMonthly: 400,
    yearlySavings: "$1,200",
    stripePriceId_Yearly: "price_1SotU1Axch1s4iBGC1uEWWXN",
  },
  {
    id: 'pro1000',
    label: "640 Generations",
    credits: 96000,
    monthlyPrice: 1000,
    stripePriceId_Monthly: "price_1SotO9Axch1s4iBGCDE83jPv",
    yearlyPriceTotal: 9600,
    yearlyPriceMonthly: 800,
    yearlySavings: "$2,400",
    stripePriceId_Yearly: "price_1SotUEAxch1s4iBGUqWwl9Db",
  },
  {
    id: 'pro2000',
    label: "1,500 Generations",
    credits: 225000,
    monthlyPrice: 2000,
    stripePriceId_Monthly: "price_1SotOOAxch1s4iBGWiUHzG1M",
    yearlyPriceTotal: 19200,
    yearlyPriceMonthly: 1600,
    yearlySavings: "$4,800",
    stripePriceId_Yearly: "price_1SotV0Axch1s4iBGZYfILH0H",
  }
];

// One-time top-ups (reduced credits to make subscription more attractive)
const TOPUPS = [
  { amount: 20, credits: 900, label: "$20", creditsLabel: "900 credits", gens: "~6 gens" },
  { amount: 50, credits: 2400, label: "$50", creditsLabel: "2,400 credits", gens: "~16 gens" },
  { amount: 100, credits: 5250, label: "$100", creditsLabel: "5,250 credits", gens: "~35 gens" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly"); // Default to monthly
  const [selectedTierIndex, setSelectedTierIndex] = useState(0); // Default to $25 tier (index 0)
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDebug, setSyncDebug] = useState<any>(null);
  
  const selectedTier = PRICING_TIERS[selectedTierIndex];
  
  // Profile states
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Avatar crop modal
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Preferences state
  const [soundOnComplete, setSoundOnComplete] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [defaultStylePreset, setDefaultStylePreset] = useState("auto-detect");
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  
  // Style presets list (matching StyleInjector - ALL styles)
  const STYLE_PRESET_OPTIONS = [
    // === SPECIAL ===
    { id: "auto-detect", name: "Auto-Detect", desc: "Match video style automatically", category: "special" },
    
    // === DARK PREMIUM ===
    { id: "aura-glass", name: "High-End Dark Glass", desc: "Aurora Glow • Spotlight • Premium", category: "dark" },
    { id: "void-spotlight", name: "Void Spotlight", desc: "Deep Void • Mouse Glow • Heavy", category: "dark" },
    { id: "dark-cosmos", name: "Dark Cosmos", desc: "Purple/Cyan Glow • Glass • Float", category: "dark" },
    { id: "linear", name: "Linear", desc: "Clean dark with subtle borders", category: "dark" },
    { id: "liquid-chrome", name: "Liquid Chrome", desc: "Metallic • Y2K • Reflections", category: "dark" },
    { id: "molten-aurora", name: "Molten Aurora SaaS", desc: "Volcanic Glow • Dark Glass • Orange", category: "dark" },
    { id: "midnight-aurora", name: "Midnight Aurora", desc: "Purple Glow • Neon • Blue Accent", category: "dark" },
    { id: "glass-cascade", name: "Glass Blue Tech", desc: "Deep Blue • Stacked Glass • Float", category: "dark" },
    { id: "glowframe-product", name: "Dark Product Glowframe", desc: "Teal Glow • Inner Glow Cards", category: "dark" },
    { id: "deadpan-documentation", name: "Deadpan Documentation", desc: "Industrial Grid • Linear • System", category: "dark" },
    { id: "cctv-drift", name: "CCTV Drift", desc: "Surveillance • Sensor Noise • Fixed", category: "dark" },
    { id: "abrupt-termination", name: "Abrupt Termination", desc: "Pre-Cut Drift • Mid-Motion Freeze", category: "dark" },
    
    // === LIGHT & CLEAN ===
    { id: "swiss-grid", name: "Swiss Grid", desc: "Visible Grid • Massive Type • Sharp", category: "light" },
    { id: "soft-organic", name: "Soft Organic", desc: "Blobs • Pastel • Underwater", category: "light" },
    { id: "silent-luxury", name: "Silent Luxury", desc: "Radical Minimal • White Void", category: "light" },
    { id: "ethereal-mesh", name: "Ethereal Mesh", desc: "Aurora Blobs • Soft SaaS • Modern", category: "light" },
    { id: "airy-blue-aura", name: "Airy Blue Aura", desc: "White Void • Blue Blob • SaaS", category: "light" },
    { id: "blur-hero-minimal", name: "Blur Hero Minimal", desc: "Blur Reveal • Stagger • Clean", category: "light" },
    { id: "myna-ai-mono", name: "Myna AI Mono", desc: "Orange CTA • Monospace • Business", category: "light" },
    { id: "acme-clean-rounded", name: "Acme Clean Rounded", desc: "Rounded Nav • Motion • Dashboard", category: "light" },
    { id: "bureaucratic-void", name: "Bureaucratic Void", desc: "Paper White • 1px Dividers • Dull", category: "light" },
    
    // === CREATIVE & EXPERIMENTAL ===
    { id: "glassmorphism", name: "Glassmorphism", desc: "Glass panels • Gradients • Blur", category: "creative" },
    { id: "neubrutalism", name: "Neo-Brutalism", desc: "Hard Shadow • Thick Border • Bouncy", category: "creative" },
    { id: "kinetic-brutalism", name: "Kinetic Brutalism", desc: "15vw Type • Acid Yellow • Bold", category: "creative" },
    { id: "spatial-glass", name: "Spatial Glass", desc: "Vision Pro • 3D Tilt • Light", category: "creative" },
    { id: "particle-brain", name: "Particle Brain", desc: "AI Cloud • 50k Points • WebGL", category: "creative" },
    { id: "old-money", name: "Old Money Heritage", desc: "Cream • Gold Serif • Classic", category: "creative" },
    { id: "tactical-hud", name: "Tactical HUD", desc: "Sci-Fi Game • Brackets • Scanning", category: "creative" },
    { id: "urban-grunge", name: "Urban Grunge", desc: "Concrete • Spray Paint • Street", category: "creative" },
    { id: "ink-zen", name: "Ink & Zen", desc: "Japanese • Vertical • Sumi-e", category: "creative" },
    { id: "infinite-tunnel", name: "Infinite Tunnel", desc: "Z-Axis • Fly Through • Warp", category: "creative" },
    { id: "frosted-acrylic", name: "Frosted Acrylic", desc: "Thick Glass • Solid • Glow Through", category: "creative" },
    { id: "datamosh", name: "Datamosh Glitch", desc: "Pixel Sort • Melt • RGB Split", category: "creative" },
    { id: "origami-fold", name: "Origami Fold", desc: "Paper 3D • Unfold • Envelope", category: "creative" },
    { id: "gravity-physics", name: "Gravity Physics", desc: "Falling Tags • Drag & Throw • Bounce", category: "creative" },
    { id: "neo-retro-os", name: "Neo-Retro OS", desc: "Windows 95 • Draggable • Vaporwave", category: "creative" },
    { id: "soft-clay-pop", name: "Soft Clay Pop", desc: "Claymorphism • Pastel • Bouncy", category: "creative" },
    { id: "deconstructed-editorial", name: "Deconstructed Editorial", desc: "Fashion • Vertical Text • Chaos", category: "creative" },
    { id: "cinematic-product", name: "Cinematic Product", desc: "Apple Page • Scroll-Driven 3D", category: "creative" },
    { id: "digital-collage", name: "Digital Collage", desc: "Scrapbook • Stickers • Draggable", category: "creative" },
    { id: "halftone-beam", name: "Halftone Solar Beam", desc: "Dot Matrix • Grid • Wordmark", category: "creative" },
    { id: "mono-wave", name: "Monochrome Wave", desc: "Black White • Marquee • Editorial", category: "creative" },
    { id: "fractured-grid", name: "Fractured Grid", desc: "Modular Grid • Split Headline", category: "creative" },
    { id: "matrix-rain", name: "Matrix Rain", desc: "Falling Code • Scramble • Hacker", category: "creative" },
    { id: "indifferent-kinetic", name: "Indifferent Kinetic", desc: "Deadpan Motion • Acid Yellow", category: "creative" },
    { id: "inefficient-loop", name: "Inefficient Loop", desc: "Overcorrection • Handoff Pause", category: "creative" },
    { id: "accidental-capture", name: "Accidental Capture", desc: "Found Footage • Incidental", category: "creative" },
    
    // === MOTION & SCROLL ===
    { id: "xray-blueprint", name: "X-Ray Blueprint", desc: "Wireframe Reveal • Scanner", category: "motion" },
    { id: "opposing-scroll", name: "Opposing Scroll", desc: "Bi-Directional • Velocity • Marquee", category: "motion" },
    { id: "stacked-cards", name: "Stacked Card Deck", desc: "iOS Tabs • Depth • Scale", category: "motion" },
    { id: "horizontal-inertia", name: "Horizontal Inertia", desc: "Skew • Velocity • Spring", category: "motion" },
    { id: "split-curtain", name: "Split Curtain Reveal", desc: "Dual Panel • Theater • Typography", category: "motion" },
    
    // === INTERACTIVE ===
    { id: "phantom-border", name: "Phantom Border UI", desc: "Invisible Grid • Cursor Proximity", category: "interactive" },
    { id: "inverted-lens", name: "Inverted Lens Cursor", desc: "Window Mask • Hidden Layer", category: "interactive" },
    { id: "elastic-sidebar", name: "Elastic Sidebar", desc: "Rubber Band • SVG Curve • Wobble", category: "interactive" },
    { id: "morphing-nav", name: "Morphing Fluid Nav", desc: "Dynamic Island • Apple Physics", category: "interactive" },
    
    // === SHADERS ===
    { id: "liquid-neon", name: "Liquid Neon", desc: "WebGL Metaballs • Lava Lamp • Glow", category: "shader" },
    { id: "chromatic-dispersion", name: "Chromatic Dispersion", desc: "RGB Split • Movement Speed", category: "shader" },
    { id: "viscous-hover", name: "Viscous Hover", desc: "Displacement Map • Liquid • Gooey", category: "shader" },
    { id: "globe-data", name: "Interactive Globe", desc: "3D Sphere • Points • Data Arcs", category: "shader" },
    { id: "liquid-text-mask", name: "Liquid Text Masking", desc: "Video in Text • Drip • SVG Goo", category: "shader" },
    { id: "noise-gradient", name: "Dynamic Noise Gradient", desc: "Canvas Grain • Perlin • Aurora", category: "shader" },
    { id: "fluid-prismatic", name: "Fluid Prismatic", desc: "Fluid Simulation • Mouse Distort", category: "shader" },
    { id: "paper-shader-mesh", name: "Paper Shader Mesh", desc: "MeshGradient • Cyan Orange", category: "shader" },
    { id: "gradient-bar-waitlist", name: "Gradient Bar Waitlist", desc: "Orange Bars • Pulse • Startup", category: "shader" },
    { id: "earthy-grid-reveal", name: "Earthy Grid Reveal", desc: "Grid Lines • Word Appear • Organic", category: "shader" },
    
    // === PHYSICS & 3D ===
    { id: "gyroscopic-levitation", name: "Gyroscopic Levitation", desc: "Shadow Physics • Lift • Tilt", category: "physics" },
    { id: "exploded-view", name: "Exploded View Scroll", desc: "3D Disassembly • Parts Separate", category: "physics" },
    { id: "skeuomorphic", name: "Skeuomorphic Controls", desc: "Physical Switches • Plastic • 3D", category: "physics" },
    { id: "messy-physics", name: "Messy Colorful Physics", desc: "Matter.js • Drag Tags • Bouncy", category: "physics" },
    
    // === BRAND INSPIRED ===
    { id: "apple", name: "Apple Style", desc: "Frosted Glass • Clean • SF Pro", category: "brand" },
    { id: "stripe", name: "Stripe Design", desc: "Premium Gradient • Trust Blue", category: "brand" },
    { id: "vercel", name: "Vercel", desc: "Black & White • Triangle • Minimal", category: "brand" },
    
    // === DATA & DASHBOARD ===
    { id: "live-dashboard", name: "Live Dashboard", desc: "Data Heavy • Micro-Animations", category: "data" },
    { id: "crt-noise", name: "CRT Signal Noise", desc: "Scanlines • RGB Shift • Flicker", category: "data" },
    
    // === OTHER ===
    { id: "biomimetic-organic", name: "Biomimetic Organic", desc: "Natural Forms • Flowing Shapes", category: "other" },
    { id: "generative-ascii", name: "Generative ASCII", desc: "Text Art • Monospace • Retro", category: "other" },
    { id: "cinematic-portals", name: "Cinematic Portals", desc: "Video BG • Transitions • Epic", category: "other" },
    { id: "typographic-architecture", name: "Typographic Architecture", desc: "Giant Letters • Structure", category: "other" },
  ];
  
  // Load preferences from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem("replay_sound_on_complete");
    const savedAutoSave = localStorage.getItem("replay_auto_save");
    const savedDefaultStyle = localStorage.getItem("replay_default_style_preset");
    if (savedSound !== null) setSoundOnComplete(savedSound === "true");
    if (savedAutoSave !== null) setAutoSaveEnabled(savedAutoSave === "true");
    if (savedDefaultStyle !== null) setDefaultStylePreset(savedDefaultStyle);
  }, []);
  
  // Save preferences to localStorage
  const updateSoundPreference = (enabled: boolean) => {
    setSoundOnComplete(enabled);
    localStorage.setItem("replay_sound_on_complete", enabled.toString());
  };
  
  const updateAutoSavePreference = (enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    localStorage.setItem("replay_auto_save", enabled.toString());
  };
  
  const updateDefaultStylePreset = (presetId: string) => {
    setDefaultStylePreset(presetId);
    localStorage.setItem("replay_default_style_preset", presetId);
    setShowStyleDropdown(false);
  };

  const { user, signOut } = useAuth();
  const { wallet, membership, totalCredits, isLoading, refreshCredits } = useCredits();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  
  // Auth modal state (must be before conditional return)
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
    
    // Check for success/canceled params
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "1") {
      setTestMessage({ type: "success", text: "Successfully upgraded to Pro!" });
    } else if (canceled === "1") {
      setTestMessage({ type: "error", text: "Checkout was canceled." });
    }
  }, [searchParams]);

  const handleCheckout = async (type: "subscription" | "topup", options: any) => {
    setIsCheckingOut(options.plan || options.topupAmount?.toString() || "pro");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...options }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setTestMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setTestMessage({ type: "error", text: "Failed to start checkout" });
    } finally {
      setIsCheckingOut(null);
    }
  };
  
  const handleProSubscription = () => {
    const priceId = billingInterval === "yearly" 
      ? selectedTier.stripePriceId_Yearly 
      : selectedTier.stripePriceId_Monthly;
    
    handleCheckout("subscription", {
      priceId,
      tierId: selectedTier.id,
      credits: selectedTier.credits,
      interval: billingInterval,
    });
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const handleSyncSubscription = async () => {
    setIsSyncing(true);
    setSyncDebug(null);
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = await res.json();
      console.log("Sync response:", data); // Debug log
      
      // Store debug info to display
      if (data.debug) {
        setSyncDebug(data.debug);
      }
      
      if (data.success) {
        setTestMessage({ type: "success", text: data.message || "Subscription synced! Reloading..." });
        await refreshCredits();
        // Force hard reload after short delay
        setTimeout(() => {
          window.location.href = window.location.href;
        }, 1000);
      } else {
        setTestMessage({ type: "error", text: data.message || data.error || "Sync failed" });
      }
    } catch (error) {
      console.error("Sync error:", error);
      setTestMessage({ type: "error", text: "Failed to sync subscription" });
    } finally {
      setIsSyncing(false);
    }
  };

  // Show auth modal overlay when not logged in (but still render page behind with blur)
  const needsAuth = !user;

  const currentPlan = membership?.plan || "free";
  const planLimits = PLAN_LIMITS[currentPlan];

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/tool" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </Link>
            <Logo />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="text-xl md:text-2xl font-semibold mb-6 md:mb-8">Settings</h1>

        {/* Tabs - horizontally scrollable on mobile */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6 md:mb-8 scrollbar-hide">
          <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-max md:w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 md:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] md:min-h-0",
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/70"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === "account" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Section */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-medium mb-6">Profile</h2>
              
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar 
                    src={profile?.avatar_url} 
                    fallback={user?.email?.[0]?.toUpperCase() || "U"} 
                    size={80}
                    className="text-2xl"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // Open crop modal
                      setOriginalFile(file);
                      const reader = new FileReader();
                      reader.onload = () => {
                        setCropImageSrc(reader.result as string);
                        setShowCropModal(true);
                      };
                      reader.readAsDataURL(file);
                      
                      // Clear input for next selection
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Name & Email */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Display Name</label>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Enter your name"
                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6E3C]/50"
                          autoFocus
                        />
                        <button
                          onClick={async () => {
                            setIsSavingName(true);
                            const result = await updateProfile({ full_name: nameInput || null });
                            setIsSavingName(false);
                            if (result.success) {
                              setIsEditingName(false);
                              setTestMessage({ type: "success", text: "Name updated!" });
                            } else {
                              setTestMessage({ type: "error", text: result.error || "Failed to update name" });
                            }
                          }}
                          disabled={isSavingName}
                          className="px-3 py-2 rounded-lg bg-[#FF6E3C] text-white text-sm hover:bg-[#FF8F5C] transition-colors disabled:opacity-50"
                        >
                          {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </button>
                        <button
                          onClick={() => setIsEditingName(false)}
                          className="px-3 py-2 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-white">
                          {profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Not set"}
                        </p>
                        <button
                          onClick={() => {
                            setNameInput(profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "");
                            setIsEditingName(true);
                          }}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-white/50" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Email</label>
                    <p className="text-white mt-1">{user?.email || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-medium mb-4">Account Info</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">User ID</label>
                  <p className="text-white/50 text-sm mt-1 font-mono">{user?.id || "—"}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-medium mb-4">Danger zone</h2>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "plans" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status messages */}
            {testMessage && (
              <div className={cn(
                "p-4 rounded-xl text-sm font-medium",
                testMessage.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
              )}>
                {testMessage.text}
              </div>
            )}
            
            {/* Current plan banner */}
            <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#FF6E3C]/10 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-white/50">Current plan</p>
                  <h2 className="text-2xl font-semibold capitalize">{currentPlan}</h2>
                  {membership?.current_period_end && currentPlan === "pro" && (
                    <p className="text-xs text-white/40 mt-1">
                      Renews {new Date(membership.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <div className="text-right">
                    <p className="text-sm text-white/50">Credits remaining</p>
                    <p className="text-2xl font-semibold">{totalCredits.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleSyncSubscription}
                    disabled={isSyncing}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                    title="Sync subscription from Stripe"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Sync
                  </button>
                  {currentPlan === "pro" && membership?.stripe_subscription_id && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      {isManagingSubscription ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Manage
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={cn("text-sm font-medium transition-colors", billingInterval === "monthly" ? "text-white" : "text-white/40")}>
                Monthly
              </span>
              <button
                onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
                className="relative w-12 h-6 rounded-full bg-white/10 border border-white/10 transition-all hover:border-white/20"
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-[#FF6E3C] transition-all duration-200",
                    billingInterval === "yearly" ? "left-7" : "left-1"
                  )}
                />
              </button>
              <span className={cn("text-sm font-medium transition-colors", billingInterval === "yearly" ? "text-white" : "text-white/40")}>
                Yearly
              </span>
            </div>

            {/* Pricing Cards Grid - Lovable Style */}
            <div className="grid lg:grid-cols-3 gap-6 mt-8 lg:mt-12 items-stretch">
              {/* FREE Card */}
              <div className={cn(
                "p-6 rounded-2xl bg-white/[0.02] border backdrop-blur-sm h-full flex flex-col",
                currentPlan === "free" ? "border-emerald-500/50 ring-1 ring-emerald-500/30" : "border-white/[0.08]"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white/60" />
                  </div>
                  <span className="text-sm font-medium text-white/60">Free</span>
                </div>
                
                <div className="mb-1">
                  <span className="text-4xl font-bold text-white">$0</span>
                </div>
                <p className="text-sm text-white/40 mb-6">Forever free to start</p>
                
                <div className="space-y-3 mb-6 flex-grow">
                  {[
                    "100 credits / month",
                    "~1 generation",
                    "Preview only",
                    "Public projects only",
                    "Community support",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-white/60">
                      <Check className="w-4 h-4 text-white/40 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                
                {currentPlan === "free" ? (
                  <div className="w-full py-2.5 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 mt-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    Active Plan
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/[0.05] text-white/40 border border-white/[0.08] cursor-default mt-auto"
                  >
                    Included
                  </button>
                )}
              </div>

              {/* PRO Card - Elastic with Dropdown */}
              <div className="relative pt-4">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-xs font-semibold text-white shadow-lg shadow-[#FF6E3C]/30">
                    Most Popular
                  </div>
                </div>
                
                <div className={cn(
                  "h-full p-6 rounded-2xl bg-gradient-to-b from-[#FF6E3C]/10 to-transparent border backdrop-blur-sm relative overflow-hidden flex flex-col",
                  currentPlan === "pro" ? "border-[#FF6E3C] ring-2 ring-[#FF6E3C]" : "border-[#FF6E3C]/30"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#FF6E3C]/5 to-transparent pointer-events-none" />
                  
                  <div className="relative flex-grow flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#FF6E3C]/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#FF6E3C]" />
                      </div>
                      <span className="text-sm font-medium text-[#FF6E3C]">Pro</span>
                    </div>
                    
                    {/* Price Display */}
                    <div className="mb-1 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        ${billingInterval === "yearly" ? selectedTier.yearlyPriceMonthly : selectedTier.monthlyPrice}
                      </span>
                      <span className="text-white/40">/mo</span>
                    </div>
                    
                    {/* Savings Badge - only show on yearly */}
                    {billingInterval === "yearly" && (
                      <div className="mb-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                          Save {selectedTier.yearlySavings}
                        </span>
                      </div>
                    )}
                    {billingInterval !== "yearly" && <div className="mb-4" />}

                    {/* Capacity Dropdown */}
                    <div className="relative mb-6">
                      <label className="block text-xs font-medium text-white/50 mb-2">Capacity</label>
                      <button
                        onClick={() => setTierDropdownOpen(!tierDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white hover:border-white/20 transition-all"
                      >
                        <span>{selectedTier.credits.toLocaleString()} credits</span>
                        <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", tierDropdownOpen && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {tierDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 shadow-xl z-50 max-h-64 overflow-y-auto"
                          >
                            {PRICING_TIERS.map((tier, idx) => (
                              <button
                                key={tier.id}
                                onClick={() => {
                                  setSelectedTierIndex(idx);
                                  setTierDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors",
                                  idx === selectedTierIndex && "bg-[#FF6E3C]/10 text-[#FF6E3C]"
                                )}
                              >
                                {tier.credits.toLocaleString()} credits
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5 mb-6 flex-grow">
                      {[
                        "Everything in Free, plus:",
                        `${selectedTier.credits.toLocaleString()} credits / month`,
                        `~${Math.floor(selectedTier.credits / 75)} generations`,
                        "Private projects",
                        "Full code access & export",
                        "Publish to web",
                        "Credits roll over",
                      ].map((f, idx) => (
                        <div key={f} className={cn("flex items-center gap-3 text-sm", idx === 0 ? "text-[#FF6E3C] font-medium" : "text-white/70")}>
                          <Check className="w-4 h-4 text-[#FF6E3C] shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                    
                    {currentPlan === "pro" ? (
                      <button
                        onClick={handleManageSubscription}
                        disabled={isManagingSubscription}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        {isManagingSubscription ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            Manage Plan
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleProSubscription}
                        disabled={isCheckingOut === "pro"}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#FF6E3C]/30"
                      >
                        {isCheckingOut === "pro" ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          "Subscribe"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ENTERPRISE Card */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white/60" />
                  </div>
                  <span className="text-sm font-medium text-white/60">Enterprise</span>
                </div>
                
                <div className="mb-1">
                  <span className="text-4xl font-bold text-white">Custom</span>
                </div>
                <p className="text-sm text-white/40 mb-6">For teams & organizations</p>
                
                <div className="space-y-3 mb-6 flex-grow">
                  {[
                    "Everything in Pro, plus:",
                    "Custom credit allocation",
                    "Team seats",
                    "Priority processing",
                    "SSO / SAML",
                    "Dedicated support & SLA",
                    "API access",
                  ].map((f, idx) => (
                    <div key={f} className={cn("flex items-center gap-3 text-sm", idx === 0 ? "text-white/80 font-medium" : "text-white/60")}>
                      <Check className="w-4 h-4 text-white/40 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                
                <Link
                  href="/contact"
                  className="block w-full text-center py-2.5 rounded-xl text-sm font-medium transition-all bg-white/[0.05] text-white/70 hover:bg-white/[0.08] border border-white/[0.08] mt-auto"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
            
            {/* Terms disclaimer */}
            <p className="text-xs text-white/30 text-center mt-6">
              By subscribing, you agree to our{" "}
              <Link href="/terms" className="text-white/50 hover:text-white/70 underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-white/50 hover:text-white/70 underline">Privacy Policy</Link>.
            </p>
          </motion.div>
        )}

        {activeTab === "credits" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Credits overview */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-medium mb-4">Credits</h2>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/50">Available credits</span>
                  <span className="text-white font-medium">
                    {totalCredits.toLocaleString()} / {planLimits.monthlyCredits.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C]"
                    style={{
                      width: `${Math.min((totalCredits / planLimits.monthlyCredits) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Calendar className="w-3 h-3" />
                    Monthly
                  </div>
                  <p className="text-xl font-semibold">{wallet?.monthly_credits.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <RotateCcw className="w-3 h-3" />
                    Rollover
                  </div>
                  <p className="text-xl font-semibold">{wallet?.rollover_credits.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                    <Plus className="w-3 h-3" />
                    Top-up
                  </div>
                  <p className="text-xl font-semibold">{wallet?.topup_credits.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 p-4 rounded-lg bg-white/5">
                <div className="flex items-start gap-2 text-xs text-white/50">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    Monthly credits reset on{" "}
                    {membership?.current_period_end
                      ? new Date(membership.current_period_end).toLocaleDateString()
                      : "the 1st of each month"}
                  </span>
                </div>
                {planLimits.rolloverCap > 0 && (
                  <div className="flex items-start gap-2 text-xs text-white/50">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Up to {planLimits.rolloverCap.toLocaleString()} credits roll over each month</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-xs text-white/50">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>Buy credits anytime — they never expire</span>
                </div>
              </div>
            </div>

            {/* Credit costs */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-medium mb-4">Credit costs</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Generate from video</span>
                  <span className="text-white font-medium">{CREDIT_COSTS.VIDEO_GENERATE} credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">AI edit / refine</span>
                  <span className="text-white font-medium">{CREDIT_COSTS.AI_EDIT} credits</span>
                </div>
              </div>
            </div>

            {/* Buy credits */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-medium mb-2">Buy credits</h2>
              <p className="text-xs text-white/40 mb-4">One-time credit packs for extra capacity</p>
              <div className="grid grid-cols-3 gap-4">
                {TOPUPS.map((topup) => (
                  <button
                    key={topup.amount}
                    onClick={() => handleCheckout("topup", { topupAmount: topup.amount })}
                    disabled={isCheckingOut === topup.amount.toString()}
                    className="relative p-6 rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-50"
                  >
                    {isCheckingOut === topup.amount.toString() ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold mb-1">{topup.label}</p>
                        <p className="text-sm text-white/50">{topup.creditsLabel}</p>
                        <p className="text-[10px] text-white/30">{topup.gens}</p>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Sound Settings */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-5 h-5 text-[#FF6E3C]" />
                <h2 className="text-lg font-medium">Notifications</h2>
              </div>
              
              <div className="space-y-4">
                {/* Sound on complete */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {soundOnComplete ? (
                      <Volume2 className="w-5 h-5 text-white/60 flex-shrink-0" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-white/40 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">Sound on generation complete</p>
                      <p className="text-xs md:text-sm text-white/50 truncate">Play a sound when AI finishes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSoundPreference(!soundOnComplete)}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors flex-shrink-0",
                      soundOnComplete ? "bg-[#FF6E3C]" : "bg-white/20"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                        soundOnComplete ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>
                
                {/* Test sound button */}
                {soundOnComplete && (
                  <button
                    onClick={() => {
                      const audio = new Audio("/finish.mp3");
                      audio.volume = 1.0;
                      audio.play();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                    Test sound
                  </button>
                )}
              </div>
            </div>
            
            {/* Editor Settings */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-[#FF6E3C]" />
                <h2 className="text-lg font-medium">Editor</h2>
              </div>
              
              <div className="space-y-4">
                {/* Default Style Preset */}
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Default Style Preset</p>
                      <p className="text-sm text-white/50">Applied to new projects automatically</p>
                    </div>
                  </div>
                  
                  {/* Style Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Preview thumbnail - using StylePreview from StyleInjector */}
                        <StylePreview styleId={defaultStylePreset} />
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium truncate">
                            {STYLE_PRESET_OPTIONS.find(s => s.id === defaultStylePreset)?.name || "Auto-Detect"}
                          </p>
                          <p className="text-xs text-white/40 truncate">
                            {STYLE_PRESET_OPTIONS.find(s => s.id === defaultStylePreset)?.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-white/40 transition-transform flex-shrink-0",
                        showStyleDropdown && "rotate-180"
                      )} />
                    </button>
                    
                    {/* Dropdown Options with categories */}
                    {showStyleDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl z-50 max-h-[400px] overflow-y-auto">
                        {/* Category labels */}
                        {["special", "dark", "light", "creative", "motion", "interactive", "shader", "physics", "brand", "data", "other"].map(category => {
                          const categoryStyles = STYLE_PRESET_OPTIONS.filter(s => s.category === category);
                          if (categoryStyles.length === 0) return null;
                          
                          const categoryLabels: Record<string, { name: string; color: string }> = {
                            special: { name: "Special", color: "text-[#FF6E3C]" },
                            dark: { name: "Dark Premium", color: "text-purple-400" },
                            light: { name: "Light & Clean", color: "text-blue-400" },
                            creative: { name: "Creative & Experimental", color: "text-orange-400" },
                            motion: { name: "Motion & Scroll", color: "text-cyan-400" },
                            interactive: { name: "Interactive & Cursor", color: "text-pink-400" },
                            shader: { name: "WebGL & Shaders", color: "text-emerald-400" },
                            physics: { name: "Physics & 3D", color: "text-amber-400" },
                            brand: { name: "Brand Inspired", color: "text-green-400" },
                            data: { name: "Data & Dashboard", color: "text-indigo-400" },
                            other: { name: "Other", color: "text-gray-400" },
                          };
                          
                          return (
                            <div key={category}>
                              <div className={cn("px-4 py-2 text-[10px] font-medium uppercase tracking-wider", categoryLabels[category]?.color)}>
                                {categoryLabels[category]?.name}
                              </div>
                              {categoryStyles.map((style) => (
                                <button
                                  key={style.id}
                                  onClick={() => updateDefaultStylePreset(style.id)}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left",
                                    defaultStylePreset === style.id && "bg-[#FF6E3C]/10"
                                  )}
                                >
                                  {/* Mini preview - using StylePreview from StyleInjector */}
                                  <div className={cn(
                                    "rounded overflow-hidden border flex-shrink-0",
                                    defaultStylePreset === style.id ? "border-[#FF6E3C]" : "border-white/10"
                                  )}>
                                    <StylePreview styleId={style.id} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={cn(
                                      "text-xs font-medium truncate",
                                      defaultStylePreset === style.id ? "text-[#FF6E3C]" : "text-white/80"
                                    )}>
                                      {style.name}
                                    </p>
                                    <p className="text-[10px] text-white/40 truncate">{style.desc}</p>
                                  </div>
                                  {defaultStylePreset === style.id && (
                                    <Check className="w-4 h-4 text-[#FF6E3C] flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Auto-save */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base">Auto-save projects</p>
                    <p className="text-xs md:text-sm text-white/50 truncate">Automatically save to the cloud</p>
                  </div>
                  <button
                    onClick={() => updateAutoSavePreference(!autoSaveEnabled)}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors flex-shrink-0",
                      autoSaveEnabled ? "bg-[#FF6E3C]" : "bg-white/20"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                        autoSaveEnabled ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Info */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/50">
                  Preferences are saved locally in your browser. They will persist across sessions but not across devices.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Enterprise Contact Modal */}
      {showEnterpriseModal && (
        <EnterpriseModal onClose={() => setShowEnterpriseModal(false)} />
      )}

      {/* Avatar Crop Modal */}
      {showCropModal && cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Crop Avatar</h2>
              <button 
                onClick={() => {
                  setShowCropModal(false);
                  setCropImageSrc(null);
                  setOriginalFile(null);
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            {/* Image preview - square crop */}
            <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border-2 border-white/20">
              <img 
                src={cropImageSrc} 
                alt="Crop preview"
                className="w-full h-full object-cover"
              />
            </div>
            
            <p className="text-sm text-white/50 text-center mb-6">
              Image will be cropped to a circle
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCropImageSrc(null);
                  setOriginalFile(null);
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!originalFile) return;
                  
                  setIsUploadingAvatar(true);
                  setShowCropModal(false);
                  
                  // Create canvas for cropping to square
                  const img = document.createElement('img');
                  img.src = cropImageSrc;
                  
                  await new Promise(resolve => img.onload = resolve);
                  
                  const canvas = document.createElement('canvas');
                  const size = Math.min(img.width, img.height);
                  canvas.width = 256;
                  canvas.height = 256;
                  
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    // Draw centered crop
                    const sx = (img.width - size) / 2;
                    const sy = (img.height - size) / 2;
                    ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
                    
                    // Convert to blob
                    canvas.toBlob(async (blob) => {
                      if (blob) {
                        const croppedFile = new File([blob], originalFile.name, { type: 'image/jpeg' });
                        const result = await uploadAvatar(croppedFile);
                        
                        if (result.success) {
                          setTestMessage({ type: "success", text: "Avatar updated!" });
                        } else {
                          setTestMessage({ type: "error", text: result.error || "Failed to upload avatar" });
                        }
                      }
                      setIsUploadingAvatar(false);
                      setCropImageSrc(null);
                      setOriginalFile(null);
                    }, 'image/jpeg', 0.9);
                  }
                }}
                disabled={isUploadingAvatar}
                className="flex-1 py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Save Avatar'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Auth Overlay - Blur background with popup modal when not logged in */}
      {needsAuth && (
        <>
          {/* Backdrop with blur */}
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          
          {/* Auth Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF6E3C]/5 border border-[#FF6E3C]/20 flex items-center justify-center">
                <User className="w-8 h-8 text-[#FF6E3C]" />
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">Sign in required</h2>
              <p className="text-white/50 text-sm mb-6">
                Sign in to access your account settings, manage your subscription, and view your credits.
              </p>
              
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3 px-6 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors mb-4"
              >
                Sign in
              </button>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <Link 
                  href="/landing" 
                  className="text-white/50 hover:text-white transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </Link>
                <Link 
                  href="/" 
                  className="text-[#FF6E3C] hover:text-[#FF8F5C] transition-colors"
                >
                  Go to tool →
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Auth Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            title="Sign in to settings"
            description="Access your account, subscription, and credits."
          />
        </>
      )}
    </div>
  );
}

function EnterpriseModal({ onClose }: { onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    role: "",
    useCase: "",
    links: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-white/10 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Thanks, {formData.firstName}!</h2>
          <p className="text-white/60 mb-6">
            We've received your inquiry and will get back to you within 48 hours.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#0a0a0a] rounded-2xl border border-white/10 my-8"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Contact Sales</h2>
            <p className="text-sm text-white/50">Enterprise plan inquiry</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">First name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Last name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Work email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
              placeholder="john@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Company *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
                placeholder="Acme Inc"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
                placeholder="Product Manager"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">What are you rebuilding?</label>
            <textarea
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 resize-none"
              placeholder="Legacy dashboard, competitor analysis, design system extraction..."
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Links (optional)</label>
            <input
              type="text"
              value={formData.links}
              onChange={(e) => setFormData({ ...formData, links: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
              placeholder="Product URL, Loom recording, demo..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send inquiry
              </>
            )}
          </button>

          <p className="text-xs text-white/30 text-center">
            We typically respond within 48 hours
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}

