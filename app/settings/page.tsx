"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  Camera,
  Pencil,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  Building2,
  Sparkles,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useCredits, PLAN_LIMITS, CREDIT_COSTS } from "@/lib/credits/context";
import { useProfile } from "@/lib/profile/context";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import AuthModal from "@/components/modals/AuthModal";
import { DitheringShader } from "@/components/ui/dithering-shader";
import { cn } from "@/lib/utils";

// Loading fallback
function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="spinner" />
    </div>
  );
}

const SIDEBAR_ITEMS = [
  { type: "section", label: "Account" },
  { id: "account", label: "Your account", icon: User },
  { id: "preferences", label: "Preferences", icon: Settings },
  { type: "section", label: "Billing" },
  { id: "plans", label: "Plans & credits", icon: CreditCard },
  { id: "credits", label: "Credits", icon: Zap },
  { type: "section", label: "Projects" },
  { id: "projects", label: "Your Projects", icon: FolderOpen },
];

// Pricing tiers - matching homepage
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
];

const TOPUPS = [
  { amount: 20, credits: 900, label: "$20", creditsLabel: "900 credits", gens: "~6 gens" },
  { amount: 50, credits: 2400, label: "$50", creditsLabel: "2,400 credits", gens: "~16 gens" },
  { amount: 100, credits: 5250, label: "$100", creditsLabel: "5,250 credits", gens: "~35 gens" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedTierIndex, setSelectedTierIndex] = useState(2);
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  
  const selectedTier = PRICING_TIERS[selectedTierIndex];
  
  // Profile states
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Preferences state
  const [soundOnComplete, setSoundOnComplete] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const { user, signOut } = useAuth();
  const { wallet, membership, totalCredits, isLoading, refreshCredits } = useCredits();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth * 2, height: window.innerHeight * 2 });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && SIDEBAR_ITEMS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "1") {
      setTestMessage({ type: "success", text: "Successfully upgraded to Pro!" });
    } else if (canceled === "1") {
      setTestMessage({ type: "error", text: "Checkout was canceled." });
    }
  }, [searchParams]);

  useEffect(() => {
    const savedSound = localStorage.getItem("replay_sound_on_complete");
    const savedAutoSave = localStorage.getItem("replay_auto_save");
    if (savedSound !== null) setSoundOnComplete(savedSound === "true");
    if (savedAutoSave !== null) setAutoSaveEnabled(savedAutoSave === "true");
  }, []);

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
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const handleSyncSubscription = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTestMessage({ type: "success", text: data.message || "Subscription synced!" });
        await refreshCredits();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setTestMessage({ type: "error", text: data.message || "Sync failed" });
      }
    } catch (error) {
      setTestMessage({ type: "error", text: "Failed to sync subscription" });
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSoundPreference = (enabled: boolean) => {
    setSoundOnComplete(enabled);
    localStorage.setItem("replay_sound_on_complete", enabled.toString());
  };
  
  const updateAutoSavePreference = (enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    localStorage.setItem("replay_auto_save", enabled.toString());
  };

  const needsAuth = !user;
  const currentPlan = membership?.plan || "free";
  const planLimits = PLAN_LIMITS[currentPlan];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Dithering Shader Background */}
      <div className="fixed inset-0 z-0">
        <DitheringShader
          width={dimensions.width}
          height={dimensions.height}
          shape="wave"
          type="8x8"
          colorBack="#0a0a0a"
          colorFront="#111111"
          pxSize={4}
          speed={0.2}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a]/90 via-[#0a0a0a]/70 to-[#0a0a0a]/90" />
      </div>

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0f0f0f]/80 backdrop-blur-xl border-r border-zinc-800/50 z-20 flex flex-col">
        {/* Back Link */}
        <div className="p-4 border-b border-zinc-800/50">
          <Link 
            href="/tool" 
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Go back</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <Avatar 
              src={profile?.avatar_url} 
              fallback={user?.email?.[0]?.toUpperCase() || "U"} 
              size={40}
              className="border border-zinc-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {profile?.full_name || user?.email?.split('@')[0] || "User"}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {SIDEBAR_ITEMS.map((item, i) => {
            if (item.type === "section") {
              return (
                <div key={i} className="px-4 py-2 mt-2 first:mt-0">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id!)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all",
                  activeTab === item.id 
                    ? "bg-zinc-800/60 text-zinc-100 border-l-2 border-orange-500" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border-l-2 border-transparent"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logo at bottom */}
        <div className="p-4 border-t border-zinc-800/50">
          <Link href="/" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <Logo />
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 relative z-10">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Status Messages */}
          <AnimatePresence>
            {testMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "mb-6 p-4 rounded-xl flex items-center justify-between",
                  testMessage.type === "success" 
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                )}
              >
                <span className="text-sm">{testMessage.text}</span>
                <button onClick={() => setTestMessage(null)} className="p-1 rounded hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === ACCOUNT TAB === */}
          {activeTab === "account" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Account settings</h1>
                <p className="text-sm text-zinc-500">Personalize how others see and interact with you</p>
              </div>

              {/* Profile Card */}
              <div className="bg-[#141414]/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold text-zinc-200">Profile</h2>
                  <Link href="#" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
                    Open profile <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                
                <div className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Avatar 
                        src={profile?.avatar_url} 
                        fallback={user?.email?.[0]?.toUpperCase() || "U"} 
                        size={64}
                        className="border-2 border-zinc-700"
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        {isUploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingAvatar(true);
                          const result = await uploadAvatar(file);
                          setIsUploadingAvatar(false);
                          if (result.success) {
                            setTestMessage({ type: "success", text: "Avatar updated!" });
                          } else {
                            setTestMessage({ type: "error", text: result.error || "Failed to upload" });
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-300">Profile picture</p>
                      <p className="text-xs text-zinc-500">Click to change</p>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="flex items-center justify-between py-4 border-t border-zinc-800/50">
                    <div>
                      <label className="text-sm text-zinc-300">Display Name</label>
                      <p className="text-xs text-zinc-500">Your name visible to others</p>
                    </div>
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
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
                            }
                          }}
                          disabled={isSavingName}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setNameInput(profile?.full_name || ""); setIsEditingName(true); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors"
                      >
                        {profile?.full_name || user?.email?.split('@')[0] || "Not set"}
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between py-4 border-t border-zinc-800/50">
                    <div>
                      <label className="text-sm text-zinc-300">Email</label>
                      <p className="text-xs text-zinc-500">Your email address</p>
                    </div>
                    <span className="text-sm text-zinc-400">{user?.email || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-[#141414]/80 backdrop-blur border border-red-500/20 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-red-400 mb-4">Danger zone</h2>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          )}

          {/* === PREFERENCES TAB === */}
          {activeTab === "preferences" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Preferences</h1>
                <p className="text-sm text-zinc-500">Customize your Replay experience</p>
              </div>

              {/* Sound Settings */}
              <div className="bg-[#141414]/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-zinc-200 mb-4">Generation complete sound</h2>
                <p className="text-sm text-zinc-500 mb-4">Plays a satisfying sound notification when a generation is finished.</p>
                
                <div className="space-y-3">
                  {[
                    { id: "first", label: "First generation", desc: "Only on first" },
                    { id: "always", label: "Always", desc: "Every time" },
                    { id: "never", label: "Never", desc: "Silent mode" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateSoundPreference(opt.id !== "never")}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                        (opt.id === "always" && soundOnComplete) || (opt.id === "never" && !soundOnComplete)
                          ? "bg-zinc-800 border border-zinc-700"
                          : "bg-transparent border border-transparent hover:bg-zinc-800/50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        (opt.id === "always" && soundOnComplete) || (opt.id === "never" && !soundOnComplete)
                          ? "border-orange-500"
                          : "border-zinc-600"
                      )}>
                        {((opt.id === "always" && soundOnComplete) || (opt.id === "never" && !soundOnComplete)) && (
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm text-zinc-200">{opt.label}</p>
                      </div>
                      {opt.id !== "never" && <Volume2 className="w-4 h-4 text-zinc-500" />}
                      {opt.id === "never" && <VolumeX className="w-4 h-4 text-zinc-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-save */}
              <div className="bg-[#141414]/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-200">Auto-save projects</h2>
                    <p className="text-sm text-zinc-500">Automatically save to the cloud</p>
                  </div>
                  <button
                    onClick={() => updateAutoSavePreference(!autoSaveEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      autoSaveEnabled ? "bg-orange-500" : "bg-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      autoSaveEnabled ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* === PLANS TAB === */}
          {activeTab === "plans" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Plans & credits</h1>
                <p className="text-sm text-zinc-500">Manage your subscription and billing</p>
              </div>

              {/* Current Plan */}
              <div className="bg-gradient-to-r from-orange-500/10 via-[#141414]/80 to-[#141414]/80 backdrop-blur border border-orange-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Current plan</p>
                    <h2 className="text-2xl font-bold text-zinc-100 capitalize flex items-center gap-2">
                      {currentPlan}
                      {currentPlan === "pro" && <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">PRO</span>}
                    </h2>
                    {membership?.current_period_end && currentPlan === "pro" && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Renews {new Date(membership.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSyncSubscription}
                      disabled={isSyncing}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                      title="Sync subscription"
                    >
                      {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    </button>
                    {currentPlan === "pro" && (
                      <button
                        onClick={handleManageSubscription}
                        disabled={isManagingSubscription}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 flex items-center gap-2 transition-colors"
                      >
                        {isManagingSubscription ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 py-4">
                <span className={cn("text-sm font-medium", billingInterval === "monthly" ? "text-zinc-200" : "text-zinc-500")}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    billingInterval === "yearly" ? "bg-orange-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    billingInterval === "yearly" ? "left-7" : "left-1"
                  )} />
                </button>
                <span className={cn("text-sm font-medium", billingInterval === "yearly" ? "text-zinc-200" : "text-zinc-500")}>
                  Yearly
                </span>
                {billingInterval === "yearly" && (
                  <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Save 20%</span>
                )}
              </div>

              {/* Pricing Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Free */}
                <div className={cn(
                  "bg-[#141414]/80 backdrop-blur border rounded-2xl p-6",
                  currentPlan === "free" ? "border-emerald-500" : "border-zinc-800/50"
                )}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-zinc-200">Free</h3>
                    <p className="text-sm text-zinc-500">For testing</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-zinc-100">$0</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {["100 credits/month", "~1 generation", "Preview only"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                        <Check className="w-4 h-4 text-zinc-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {currentPlan === "free" ? (
                    <div className="w-full py-2.5 rounded-xl text-sm text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Current plan
                    </div>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl text-sm text-center bg-zinc-800 text-zinc-500">
                      Included
                    </div>
                  )}
                </div>

                {/* Pro */}
                <div className={cn(
                  "bg-[#141414]/80 backdrop-blur border rounded-2xl p-6 relative",
                  currentPlan === "pro" ? "border-orange-500" : "border-zinc-800/50"
                )}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs bg-orange-500 text-white rounded-full font-medium">Most Popular</span>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-orange-500">Pro</h3>
                    <p className="text-sm text-zinc-500">For developers</p>
                  </div>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-zinc-100">
                      ${billingInterval === "yearly" ? selectedTier.yearlyPriceMonthly : selectedTier.monthlyPrice}
                    </span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                  {billingInterval === "yearly" && (
                    <p className="text-xs text-emerald-400 mb-4">Save {selectedTier.yearlySavings}/year</p>
                  )}
                  
                  {/* Capacity dropdown */}
                  <div className="relative mb-4">
                    <button
                      onClick={() => setTierDropdownOpen(!tierDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300"
                    >
                      <span>{selectedTier.credits.toLocaleString()} credits</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform", tierDropdownOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {tierDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-10"
                        >
                          {PRICING_TIERS.map((tier, idx) => (
                            <button
                              key={tier.id}
                              onClick={() => { setSelectedTierIndex(idx); setTierDropdownOpen(false); }}
                              className={cn(
                                "w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors",
                                idx === selectedTierIndex ? "bg-zinc-800 text-orange-500" : "text-zinc-300"
                              )}
                            >
                              {tier.credits.toLocaleString()} credits - ${tier.monthlyPrice}/mo
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {[`${selectedTier.credits.toLocaleString()} credits/month`, `~${Math.floor(selectedTier.credits / 150)} generations`, "Private projects", "Publish to web"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                        <Check className="w-4 h-4 text-orange-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  
                  {currentPlan === "pro" ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                      className="w-full py-2.5 rounded-xl text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                    >
                      {isManagingSubscription ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Manage Plan"}
                    </button>
                  ) : (
                    <button
                      onClick={handleProSubscription}
                      disabled={isCheckingOut === "pro"}
                      className="w-full py-2.5 rounded-xl text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                      {isCheckingOut === "pro" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Subscribe"}
                    </button>
                  )}
                </div>

                {/* Enterprise */}
                <div className="bg-[#141414]/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-zinc-200">Enterprise</h3>
                    <p className="text-sm text-zinc-500">For teams</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-zinc-100">Custom</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {["Everything in Pro", "Unlimited seats", "Priority support", "Custom contracts"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                        <Check className="w-4 h-4 text-zinc-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className="block w-full py-2.5 rounded-xl text-sm text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* === CREDITS TAB === */}
          {activeTab === "credits" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Credits</h1>
                <p className="text-sm text-zinc-500">Track and manage your credits</p>
              </div>

              {/* Credits Overview */}
              <div className="bg-[#141414]/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    Available credits
                  </h2>
                  <span className="text-2xl font-bold text-orange-500">{totalCredits.toLocaleString()}</span>
                </div>

                {/* Progress bar - ORANGE */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-zinc-500">Usage this period</span>
                    <span className="text-zinc-300">
                      {totalCredits.toLocaleString()} / {planLimits.monthlyCredits.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                      style={{ width: `${Math.min((totalCredits / planLimits.monthlyCredits) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Monthly", value: wallet?.monthly_credits || 0, icon: Calendar },
                    { label: "Rollover", value: wallet?.rollover_credits || 0, icon: RotateCcw },
                    { label: "Top-up", value: wallet?.topup_credits || 0, icon: Plus },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                        <item.icon className="w-3 h-3" />
                        {item.label}
                      </div>
                      <p className="text-xl font-semibold text-zinc-100">{item.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Credit Costs */}
              <div className="bg-[#141414]/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-zinc-200 mb-4">Credit costs</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                    <span className="text-zinc-400">Generate from video</span>
                    <span className="font-medium text-zinc-200">{CREDIT_COSTS.VIDEO_GENERATE} credits</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-400">AI edit / refine</span>
                    <span className="font-medium text-zinc-200">{CREDIT_COSTS.AI_EDIT} credits</span>
                  </div>
                </div>
              </div>

              {/* Buy Credits */}
              <div className="bg-[#141414]/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-zinc-200 mb-2">Buy credits</h2>
                <p className="text-sm text-zinc-500 mb-4">One-time credit packs</p>
                <div className="grid grid-cols-3 gap-4">
                  {TOPUPS.map((topup) => (
                    <button
                      key={topup.amount}
                      onClick={() => handleCheckout("topup", { topupAmount: topup.amount })}
                      disabled={isCheckingOut === topup.amount.toString()}
                      className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-orange-500/50 hover:bg-zinc-800 transition-all text-center"
                    >
                      {isCheckingOut === topup.amount.toString() ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        <>
                          <p className="text-xl font-bold text-zinc-100 mb-1">{topup.label}</p>
                          <p className="text-sm text-zinc-400">{topup.creditsLabel}</p>
                          <p className="text-xs text-zinc-500">{topup.gens}</p>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* === PROJECTS TAB === */}
          {activeTab === "projects" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Your Projects</h1>
                <p className="text-sm text-zinc-500">All your generated UI projects</p>
              </div>

              <div className="bg-[#141414]/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-12 text-center">
                <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">Your projects will appear here</p>
                <Link
                  href="/tool"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Create your first project
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Auth Overlay */}
      {needsAuth && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[#141414] border border-zinc-800 rounded-2xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center">
                <User className="w-8 h-8 text-orange-500" />
              </div>
              
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">Sign in required</h2>
              <p className="text-zinc-500 text-sm mb-6">
                Sign in to access your account settings.
              </p>
              
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all mb-4"
              >
                Sign in
              </button>
              
              <Link href="/tool" className="text-orange-500 hover:text-orange-400 transition-colors text-sm">
                Go to tool →
              </Link>
            </motion.div>
          </div>
          
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
