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
  Send,
  Camera,
  Pencil,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
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

// Loading fallback
function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="spinner" />
    </div>
  );
}

const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "plans", label: "Plans", icon: CreditCard },
  { id: "credits", label: "Credits", icon: Zap },
  { id: "preferences", label: "Preferences", icon: Settings },
];

// Pricing tiers
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

// Style presets (simplified for brevity)
const STYLE_PRESET_OPTIONS = [
  { id: "auto-detect", name: "Auto-Detect", desc: "Match video style automatically", category: "special" },
  { id: "aura-glass", name: "High-End Dark Glass", desc: "Aurora Glow • Spotlight • Premium", category: "dark" },
  { id: "linear", name: "Linear", desc: "Clean dark with subtle borders", category: "dark" },
  { id: "glassmorphism", name: "Glassmorphism", desc: "Glass panels • Gradients • Blur", category: "creative" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedTierIndex, setSelectedTierIndex] = useState(2); // Default to $100 tier
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
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
  const [defaultStylePreset, setDefaultStylePreset] = useState("auto-detect");
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  
  const { user, signOut } = useAuth();
  const { wallet, membership, totalCredits, isLoading, refreshCredits } = useCredits();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) {
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

  // Load preferences from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem("replay_sound_on_complete");
    const savedAutoSave = localStorage.getItem("replay_auto_save");
    const savedDefaultStyle = localStorage.getItem("replay_default_style_preset");
    if (savedSound !== null) setSoundOnComplete(savedSound === "true");
    if (savedAutoSave !== null) setAutoSaveEnabled(savedAutoSave === "true");
    if (savedDefaultStyle !== null) setDefaultStylePreset(savedDefaultStyle);
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
    <div className="min-h-screen bg-[#111111]">
      {/* Minimal Top Bar - Logo left, Back right */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#141414]">
        <div className="h-full px-6 flex items-center justify-between">
          <Link href="/tool" className="flex items-center gap-3">
            <Logo />
          </Link>
          
          <Link 
            href="/tool" 
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-8">Settings</h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-zinc-800/50">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === tab.id 
                    ? "text-zinc-200 bg-zinc-800" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {testMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "mb-4 p-3 rounded-md flex items-center justify-between",
                testMessage.type === "success" 
                  ? "bg-green-500/10 border border-green-500/20 text-green-400" 
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              )}
            >
              <span className="text-sm">{testMessage.text}</span>
              <button onClick={() => setTestMessage(null)} className="p-1 rounded hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === ACCOUNT TAB === */}
        {activeTab === "account" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800/30">
              <h2 className="text-base font-semibold text-zinc-200 mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-500" />
                Profile
              </h2>
              
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar 
                    src={profile?.avatar_url} 
                    fallback={user?.email?.[0]?.toUpperCase() || "U"} 
                    size={80}
                    className="text-2xl border-2 border-zinc-700"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
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

                {/* Name & Email */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Display Name</label>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Enter your name"
                          className="input-pro flex-1 py-2.5"
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
                              setTestMessage({ type: "error", text: result.error || "Failed" });
                            }
                          }}
                          disabled={isSavingName}
                          className="btn-primary py-2 px-4 text-sm"
                        >
                          {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </button>
                        <button
                          onClick={() => setIsEditingName(false)}
                          className="btn-ghost py-2 px-4 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-zinc-200 font-medium">
                          {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Not set"}
                        </p>
                        <button
                          onClick={() => {
                            setNameInput(profile?.full_name || "");
                            setIsEditingName(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Email</label>
                    <p className="text-zinc-200 mt-1">{user?.email || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Account Info</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">User ID</label>
                  <p className="text-zinc-500 text-sm mt-1 font-mono">{user?.id || "—"}</p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6 border-status-error/20">
              <h2 className="text-lg font-semibold mb-4 text-status-error">Danger zone</h2>
              <button
                onClick={() => signOut()}
                className="px-4 py-2.5 rounded-xl bg-status-error-bg border border-status-error/30 text-status-error text-sm font-medium hover:bg-status-error/20 transition-colors"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}

        {/* === PLANS TAB === */}
        {activeTab === "plans" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Current Plan Banner */}
            <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6 bg-gradient-to-r from-accent-orange/10 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Current plan</p>
                  <h2 className="text-2xl font-bold capitalize">{currentPlan}</h2>
                  {membership?.current_period_end && currentPlan === "pro" && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Renews {new Date(membership.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">Credits remaining</p>
                    <p className="text-data-lg text-accent-orange">{totalCredits.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleSyncSubscription}
                    disabled={isSyncing}
                    className="btn-icon"
                    title="Sync subscription"
                  >
                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  </button>
                  {currentPlan === "pro" && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                      className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                    >
                      {isManagingSubscription ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                      Manage
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={cn("text-sm font-medium transition-colors", billingInterval === "monthly" ? "text-zinc-200" : "text-zinc-500")}>
                Monthly
              </span>
              <button
                onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
                className={cn("toggle", billingInterval === "yearly" && "active")}
              >
                <div className="toggle-handle" />
              </button>
              <span className={cn("text-sm font-medium transition-colors", billingInterval === "yearly" ? "text-zinc-200" : "text-zinc-500")}>
                Yearly
              </span>
              {billingInterval === "yearly" && (
                <span className="badge badge-green text-xs">Save 20%</span>
              )}
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
              {/* FREE Card */}
              <div className={cn(
                "bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6 flex flex-col",
                currentPlan === "free" && "ring-2 ring-status-success"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-zinc-500" />
                  </div>
                  <span className="text-sm font-medium text-zinc-500">Free</span>
                </div>
                
                <div className="mb-1">
                  <span className="text-data-lg">$0</span>
                </div>
                <p className="text-sm text-zinc-500 mb-6">Forever free to start</p>
                
                <div className="space-y-3 mb-6 flex-grow">
                  {["100 credits / month", "~1 generation", "Preview only", "Community support"].map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-zinc-500">
                      <Check className="w-4 h-4 text-text-disabled shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                
                {currentPlan === "free" ? (
                  <div className="w-full py-3 rounded-xl text-sm font-medium bg-status-success-bg text-status-success border border-status-success/30 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-status-success" />
                    Active Plan
                  </div>
                ) : (
                  <button disabled className="w-full py-3 rounded-xl text-sm font-medium bg-white/5 text-text-disabled border border-zinc-800 cursor-default">
                    Included
                  </button>
                )}
              </div>

              {/* PRO Card */}
              <div className="relative md:col-span-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 rounded-full bg-gradient-orange text-xs font-semibold text-white shadow-btn-primary">
                    Most Popular
                  </div>
                </div>
                
                <div className={cn(
                  "bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6 h-full flex flex-col bg-gradient-to-b from-accent-orange/5 to-transparent",
                  currentPlan === "pro" && "ring-2 ring-accent-orange"
                )}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-orange/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-accent-orange" />
                    </div>
                    <span className="text-sm font-medium text-accent-orange">Pro</span>
                  </div>
                  
                  {/* Price */}
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-data-lg">
                      ${billingInterval === "yearly" ? selectedTier.yearlyPriceMonthly : selectedTier.monthlyPrice}
                    </span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                  
                  {billingInterval === "yearly" && (
                    <span className="inline-flex w-fit mb-4 badge badge-green">
                      Save {selectedTier.yearlySavings}
                    </span>
                  )}
                  {billingInterval !== "yearly" && <div className="mb-4" />}

                  {/* Capacity Dropdown */}
                  <div className="relative mb-6">
                    <label className="block text-xs font-medium text-zinc-500 mb-2">Capacity</label>
                    <button
                      onClick={() => setTierDropdownOpen(!tierDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm hover:border-border-hover transition-all"
                    >
                      <span>{selectedTier.credits.toLocaleString()} credits</span>
                      <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", tierDropdownOpen && "rotate-180")} />
                    </button>
                    
                    <AnimatePresence>
                      {tierDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="glass-dropdown absolute top-full left-0 right-0 mt-2 z-50 max-h-64 overflow-y-auto"
                        >
                          {PRICING_TIERS.map((tier, idx) => (
                            <button
                              key={tier.id}
                              onClick={() => {
                                setSelectedTierIndex(idx);
                                setTierDropdownOpen(false);
                              }}
                              className={cn(
                                "dropdown-item w-full",
                                idx === selectedTierIndex && "active"
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
                      `~${Math.floor(selectedTier.credits / 150)} generations`,
                      "Private projects",
                      "Publish to web",
                      "Credits roll over",
                    ].map((f, idx) => (
                      <div key={f} className={cn("flex items-center gap-3 text-sm", idx === 0 ? "text-accent-orange font-medium" : "text-zinc-400")}>
                        <Check className="w-4 h-4 text-accent-orange shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  
                  {currentPlan === "pro" ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-status-success-bg text-status-success border border-status-success/30 hover:bg-status-success/20 flex items-center justify-center gap-2 transition-colors"
                    >
                      {isManagingSubscription ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-status-success" />
                          Manage Plan
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleProSubscription}
                      disabled={isCheckingOut === "pro"}
                      className="btn-reconstruct w-full"
                    >
                      {isCheckingOut === "pro" ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        "Subscribe"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* ENTERPRISE Card */}
              <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-zinc-500" />
                  </div>
                  <span className="text-sm font-medium text-zinc-500">Enterprise</span>
                </div>
                
                <div className="mb-1">
                  <span className="text-data-lg">Custom</span>
                </div>
                <p className="text-sm text-zinc-500 mb-6">For teams</p>
                
                <div className="space-y-3 mb-6 flex-grow">
                  {["Everything in Pro", "Custom credits", "Team seats", "Priority support", "API access"].map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-zinc-500">
                      <Check className="w-4 h-4 text-text-disabled shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                
                <Link
                  href="/contact"
                  className="w-full text-center py-3 rounded-xl text-sm font-medium btn-secondary"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* === CREDITS TAB === */}
        {activeTab === "credits" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Credits Overview */}
            <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-orange" />
                Credits
              </h2>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-500">Available credits</span>
                  <span className="text-zinc-200 font-medium">
                    {totalCredits.toLocaleString()} / {planLimits.monthlyCredits.toLocaleString()}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min((totalCredits / planLimits.monthlyCredits) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                    <Calendar className="w-3 h-3" />
                    Monthly
                  </div>
                  <p className="text-xl font-semibold">{wallet?.monthly_credits.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                    <RotateCcw className="w-3 h-3" />
                    Rollover
                  </div>
                  <p className="text-xl font-semibold">{wallet?.rollover_credits.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                    <Plus className="w-3 h-3" />
                    Top-up
                  </div>
                  <p className="text-xl font-semibold">{wallet?.topup_credits.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                <div className="flex items-start gap-2 text-xs text-zinc-500">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>Credits reset on {membership?.current_period_end ? new Date(membership.current_period_end).toLocaleDateString() : "the 1st"}</span>
                </div>
                {planLimits.rolloverCap > 0 && (
                  <div className="flex items-start gap-2 text-xs text-zinc-500">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Up to {planLimits.rolloverCap.toLocaleString()} credits roll over</span>
                  </div>
                )}
              </div>
            </div>

            {/* Credit Costs */}
            <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Credit costs</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Generate from video</span>
                  <span className="font-medium">{CREDIT_COSTS.VIDEO_GENERATE} credits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">AI edit / refine</span>
                  <span className="font-medium">{CREDIT_COSTS.AI_EDIT} credits</span>
                </div>
              </div>
            </div>

            {/* Buy Credits */}
            <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">Buy credits</h2>
              <p className="text-xs text-zinc-500 mb-4">One-time credit packs</p>
              <div className="grid grid-cols-3 gap-4">
                {TOPUPS.map((topup) => (
                  <button
                    key={topup.amount}
                    onClick={() => handleCheckout("topup", { topupAmount: topup.amount })}
                    disabled={isCheckingOut === topup.amount.toString()}
                    className="glass-card p-6 text-center"
                  >
                    {isCheckingOut === topup.amount.toString() ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold mb-1">{topup.label}</p>
                        <p className="text-sm text-zinc-500">{topup.creditsLabel}</p>
                        <p className="text-xs text-text-disabled">{topup.gens}</p>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* === PREFERENCES TAB === */}
        {activeTab === "preferences" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Sound Settings */}
            <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-5 h-5 text-accent-orange" />
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                  <div className="flex items-center gap-3 flex-1">
                    {soundOnComplete ? <Volume2 className="w-5 h-5 text-zinc-500" /> : <VolumeX className="w-5 h-5 text-text-disabled" />}
                    <div>
                      <p className="font-medium text-sm">Sound on generation complete</p>
                      <p className="text-xs text-zinc-500">Play a sound when AI finishes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSoundPreference(!soundOnComplete)}
                    className={cn("toggle", soundOnComplete && "active")}
                  >
                    <div className="toggle-handle" />
                  </button>
                </div>
                
                {soundOnComplete && (
                  <button
                    onClick={() => {
                      const audio = new Audio("/finish.mp3");
                      audio.volume = 1.0;
                      audio.play();
                    }}
                    className="btn-ghost text-sm py-2 px-4 flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    Test sound
                  </button>
                )}
              </div>
            </div>
            
            {/* Editor Settings */}
            <div className="bg-zinc-900/80 border border-zinc-800/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-accent-orange" />
                <h2 className="text-lg font-semibold">Editor</h2>
              </div>
              
              <div className="space-y-4">
                {/* Auto-save */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Auto-save projects</p>
                    <p className="text-xs text-zinc-500">Automatically save to the cloud</p>
                  </div>
                  <button
                    onClick={() => updateAutoSavePreference(!autoSaveEnabled)}
                    className={cn("toggle", autoSaveEnabled && "active")}
                  >
                    <div className="toggle-handle" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Info */}
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <p className="text-sm text-zinc-500">
                  Preferences are saved locally in your browser.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Auth Overlay */}
      {needsAuth && (
        <>
          <div className="modal-backdrop" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="modal-content w-full max-w-sm p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-accent-orange/20 to-accent-orange/5 border border-accent-orange/20 flex items-center justify-center">
                <User className="w-8 h-8 text-accent-orange" />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
              <p className="text-zinc-500 text-sm mb-6">
                Sign in to access your account settings.
              </p>
              
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary w-full mb-4"
              >
                Sign in
              </button>
              
              <Link href="/tool" className="text-accent-orange hover:text-accent-orange-hover transition-colors text-sm">
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
