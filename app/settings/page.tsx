"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useCredits, PLAN_LIMITS, CREDIT_COSTS } from "@/lib/credits/context";
import Logo from "@/components/Logo";
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
      "Public projects",
      "Basic export",
    ],
    cta: "Current plan",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$35",
    priceYearly: "$315",
    tagline: "For creators",
    credits: 3000,
    popular: true,
    features: [
      "3,000 credits / month",
      "~40 rebuilds / month",
      "Private projects",
      "All exports (React / HTML)",
      "Style presets",
      "Rollover up to 600 credits",
    ],
    cta: "Upgrade",
  },
  {
    id: "agency",
    name: "Agency",
    price: "$99",
    priceYearly: "$891",
    tagline: "For power users",
    credits: 10000,
    features: [
      "10,000 credits / month",
      "Unlimited rebuilds",
      "Team access (3 seats)",
      "Priority processing",
      "API access (coming soon)",
      "Rollover up to 2,000 credits",
    ],
    cta: "Upgrade",
  },
];

const TOPUPS = [
  { amount: 20, credits: 2000, label: "$20", creditsLabel: "2,000 credits" },
  { amount: 50, credits: 5500, label: "$50", creditsLabel: "5,500 credits", best: true },
  { amount: 100, credits: 12000, label: "$100", creditsLabel: "12,000 credits" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { user, signOut } = useAuth();
  const { wallet, membership, totalCredits, isLoading } = useCredits();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Sign in required</h1>
          <p className="text-white/50 mb-4">Please sign in to access settings.</p>
          <Link href="/tool" className="text-[#FF6E3C] hover:text-[#FF8F5C]">
            Go to tool →
          </Link>
        </div>
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
          <Link
            href="/tool"
            className="px-4 py-2 rounded-lg bg-white/5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Back to Tool
          </Link>
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
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-lg font-medium mb-4">Account</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Email</label>
                  <p className="text-white mt-1">{user.email}</p>
                </div>
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
            {/* Current plan banner */}
            <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-r from-[#FF6E3C]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Current plan</p>
                  <h2 className="text-2xl font-semibold capitalize">{currentPlan}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Credits remaining</p>
                  <p className="text-2xl font-semibold">{totalCredits.toLocaleString()}</p>
                </div>
              </div>
            </div>

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
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#FF6E3C]/20 text-xs text-[#FF6E3C]">
                Save 10%
              </span>
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
                      Downgrade
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
                    className={cn(
                      "relative p-6 rounded-xl border transition-all hover:border-white/20",
                      topup.best
                        ? "border-[#FF6E3C]/50 bg-[#FF6E3C]/5"
                        : "border-white/10 bg-white/[0.02]"
                    )}
                  >
                    {topup.best && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#FF6E3C] text-[10px] font-medium text-white">
                        Best value
                      </div>
                    )}
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

            {/* Test Credits - REMOVE IN PRODUCTION */}
            <div className="p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-medium text-yellow-500">Test Mode</h2>
              </div>
              <p className="text-sm text-white/50 mb-4">
                Add test credits for development. Remove this section before production.
              </p>
              {testMessage && (
                <div className={cn(
                  "p-3 rounded-lg mb-4 text-sm font-medium",
                  testMessage.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                  {testMessage.type === "success" ? "✅" : "❌"} {testMessage.text}
                </div>
              )}
              <button
                onClick={async () => {
                  setIsCheckingOut("test");
                  try {
                    const res = await fetch("/api/credits/test-add", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ amount: 1000 }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setTestMessage({ type: "success", text: "Added 1000 test credits!" });
                      setTimeout(() => window.location.reload(), 1500);
                    } else {
                      setTestMessage({ type: "error", text: `Error: ${data.error}` });
                    }
                  } catch (error) {
                    setTestMessage({ type: "error", text: "Failed to add test credits" });
                  } finally {
                    setIsCheckingOut(null);
                  }
                }}
                disabled={isCheckingOut === "test"}
                className="px-6 py-3 rounded-xl bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                {isCheckingOut === "test" ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "+ Add 1000 Test Credits"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
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

