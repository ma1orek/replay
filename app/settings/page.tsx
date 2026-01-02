"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useCredits, PLAN_LIMITS, CREDIT_COSTS } from "@/lib/credits/context";
import { useProfile } from "@/lib/profile/context";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import AuthModal from "@/components/modals/AuthModal";
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
];

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceYearly: "$0",
    tagline: "For getting started",
    credits: 150,
    features: [
      "150 credits / month",
      "~2 rebuilds / month",
      "Live preview",
      "Basic export",
      "Style presets",
    ],
    cta: "Current plan",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$35",
    priceYearly: "$378",
    tagline: "For creators",
    credits: 3000,
    popular: true,
    features: [
      "3,000 credits / month",
      "~40 rebuilds / month",
      "Private workspace",
      "All exports (React / HTML)",
      "Style presets",
      "Rollover up to 600 credits",
    ],
    cta: "Upgrade",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceYearly: "Custom",
    tagline: "For teams & orgs",
    credits: "Custom",
    features: [
      "Custom credit allocation",
      "Team seats (custom)",
      "Priority processing",
      "SSO / SAML (coming soon)",
      "Dedicated support & SLA",
      "API access (coming soon)",
    ],
    cta: "Contact sales",
  },
];

const TOPUPS = [
  { amount: 20, credits: 2000, label: "$20", creditsLabel: "2,000 credits" },
  { amount: 50, credits: 5500, label: "$50", creditsLabel: "5,500 credits" },
  { amount: 100, credits: 12000, label: "$100", creditsLabel: "12,000 credits" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDebug, setSyncDebug] = useState<any>(null);
  
  // Profile states
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
      setTestMessage({ type: "success", text: "Successfully upgraded to Pro! 🎉" });
    } else if (canceled === "1") {
      setTestMessage({ type: "error", text: "Checkout was canceled." });
    }
  }, [searchParams]);

  const handleCheckout = async (type: "subscription" | "topup", options: any) => {
    setIsCheckingOut(options.plan || options.topupAmount?.toString());
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...options }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsCheckingOut(null);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/landing">
              <Logo />
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF6E3C]/5 border border-[#FF6E3C]/20 flex items-center justify-center">
              <User className="w-10 h-10 text-[#FF6E3C]" />
            </div>

            <h1 className="text-2xl font-semibold text-white mb-2">Sign in required</h1>
            <p className="text-white/50 mb-8">
              Sign in to access your account settings, manage your subscription, and view your credits.
            </p>

            {/* Sign in button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 px-6 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors mb-4"
            >
              Sign in
            </button>

            {/* Links */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <Link 
                href="/landing" 
                className="text-white/50 hover:text-white transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
              <Link 
                href="/tool" 
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
      </div>
    );
  }

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

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-8">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-fit mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
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
                    fallback={user.email?.[0]?.toUpperCase() || "U"} 
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
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setIsUploadingAvatar(true);
                      const result = await uploadAvatar(file);
                      setIsUploadingAvatar(false);
                      
                      if (result.success) {
                        setTestMessage({ type: "success", text: "Avatar updated!" });
                      } else {
                        setTestMessage({ type: "error", text: result.error || "Failed to upload avatar" });
                      }
                      
                      // Clear input
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
                        <p className="text-white">{profile?.full_name || "Not set"}</p>
                        <button
                          onClick={() => {
                            setNameInput(profile?.full_name || "");
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
                    <p className="text-white mt-1">{user.email}</p>
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
                  <p className="text-white/50 text-sm mt-1 font-mono">{user.id}</p>
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
                  {/* Sync button - useful if webhook failed */}
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
            
            {/* Credit note */}
            <p className="text-xs text-white/40 text-center">
              Credits are consumed per reconstruction — Replay rebuilds flow + structure + code + design system in one run.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={cn("text-sm", billingInterval === "monthly" ? "text-white" : "text-white/40")}>
                Monthly
              </span>
              <button
                onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
                className="relative w-12 h-6 rounded-full bg-white/10 transition-colors"
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-[#FF6E3C] transition-all",
                    billingInterval === "yearly" ? "left-7" : "left-1"
                  )}
                />
              </button>
              <span className={cn("text-sm", billingInterval === "yearly" ? "text-white" : "text-white/40")}>
                Yearly
              </span>
              {billingInterval === "yearly" && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#FF6E3C]/20 text-xs text-[#FF6E3C]">
                  Save 10%
                </span>
              )}
            </div>

            {/* Plan cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative p-6 rounded-xl border transition-all",
                    plan.popular
                      ? "border-[#FF6E3C]/50 bg-[#FF6E3C]/5"
                      : "border-white/10 bg-white/[0.02]",
                    currentPlan === plan.id && "ring-2 ring-[#FF6E3C]"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#FF6E3C] text-xs font-medium text-white">
                      Most popular
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-xs text-white/40">{plan.tagline}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold">
                      {billingInterval === "yearly" ? plan.priceYearly : plan.price}
                    </span>
                    <span className="text-white/40 text-sm">
                      /{billingInterval === "yearly" ? "year" : "mo"}
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 text-[#FF6E3C] shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {currentPlan === plan.id ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg bg-white/5 text-white/40 text-sm font-medium cursor-default"
                    >
                      Current plan
                    </button>
                  ) : plan.id === "free" ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg bg-white/5 text-white/40 text-sm font-medium cursor-default"
                    >
                      Included
                    </button>
                  ) : plan.id === "enterprise" ? (
                    <button
                      onClick={() => setShowEnterpriseModal(true)}
                      className="w-full py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                      Contact sales
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout("subscription", { plan: plan.id, interval: billingInterval })}
                      disabled={isCheckingOut === plan.id}
                      className="w-full py-2.5 rounded-lg bg-[#FF6E3C] text-white text-sm font-medium hover:bg-[#FF8F5C] transition-colors disabled:opacity-50"
                    >
                      {isCheckingOut === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        "Upgrade"
                      )}
                    </button>
                  )}
                </div>
              ))}
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
              <h2 className="text-lg font-medium mb-4">Buy credits</h2>
              <div className="grid grid-cols-3 gap-4">
                {TOPUPS.map((topup) => (
                  <button
                    key={topup.amount}
                    onClick={() => handleCheckout("topup", { topupAmount: topup.amount })}
                    disabled={isCheckingOut === topup.amount.toString()}
                    className="relative p-6 rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    {isCheckingOut === topup.amount.toString() ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold mb-1">{topup.label}</p>
                        <p className="text-sm text-white/50">{topup.creditsLabel}</p>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </div>

      {/* Enterprise Contact Modal */}
      {showEnterpriseModal && (
        <EnterpriseModal onClose={() => setShowEnterpriseModal(false)} />
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
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

