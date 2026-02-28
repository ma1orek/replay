"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Zap, Building2, Smile, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/modals/AuthModal";
import { useAuth } from "@/lib/auth/context";
import { STRIPE_PRICES, PLAN_CONFIGS } from "@/lib/stripe";

// One-time top-ups
const TOPUPS = [
  { amount: 20, price: "$20", credits: "900", gens: "~12" },
  { amount: 50, price: "$50", credits: "2,400", gens: "~32" },
  { amount: 100, price: "$100", credits: "5,250", gens: "~70" },
];

export default function LandingPricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isAnnual, setIsAnnual] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "subscription" | "topup"; plan?: string; amount?: number } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Handle pending action after successful auth
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction.type === "subscription" && pendingAction.plan) {
        handleSubscription(pendingAction.plan);
      } else if (pendingAction.type === "topup" && pendingAction.amount) {
        handleBuyCredits(pendingAction.amount);
      }
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  const handleSubscription = async (plan: string) => {
    if (!user) {
      setPendingAction({ type: "subscription", plan });
      setShowAuthModal(true);
      return;
    }

    setIsCheckingOut(plan);
    try {
      const priceId = plan === "agency"
        ? (isAnnual ? STRIPE_PRICES.AGENCY_YEARLY : STRIPE_PRICES.AGENCY_MONTHLY)
        : (isAnnual ? STRIPE_PRICES.PRO_YEARLY : STRIPE_PRICES.PRO_MONTHLY);

      const credits = plan === "agency" ? PLAN_CONFIGS.agency.credits : PLAN_CONFIGS.pro.credits;

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          priceId,
          tierId: plan,
          credits,
          interval: isAnnual ? "yearly" : "monthly",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error("Checkout error:", data.error);
        alert("Failed to start checkout: " + data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsCheckingOut(null);
    }
  };

  const handleBuyCredits = async (amount: number) => {
    if (!user) {
      setPendingAction({ type: "topup", amount });
      setShowAuthModal(true);
      return;
    }

    setIsCheckingOut(amount.toString());
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "topup", topupAmount: amount }),
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

  const handleGetStarted = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      router.push("/");
    }
  };

  // Prices (from lib/stripe.ts PLAN_CONFIGS)
  const proMonthly = PLAN_CONFIGS.pro.price / 100; // $19
  const proYearly = PLAN_CONFIGS.pro.yearlyPrice / 100; // $15
  const agencyMonthly = PLAN_CONFIGS.agency.price / 100; // $99
  const agencyYearly = PLAN_CONFIGS.agency.yearlyPrice / 100; // $79

  const proDisplay = isAnnual ? proYearly : proMonthly;
  const agencyDisplay = isAnnual ? agencyYearly : agencyMonthly;

  return (
    <section id="pricing" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Pricing
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Start for free. Upgrade for private projects and massive capacity. Unused credits always roll over.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <span className={cn("text-sm font-medium transition-colors", !isAnnual ? "text-white" : "text-white/40")}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-12 h-6 rounded-full bg-white/10 border border-white/10 transition-all hover:border-white/20"
          >
            <div
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-[#FF6E3C] transition-all duration-200",
                isAnnual ? "left-7" : "left-1"
              )}
            />
          </button>
          <span className={cn("text-sm font-medium transition-colors", isAnnual ? "text-white" : "text-white/40")}>
            Yearly
          </span>
          {isAnnual && (
            <span className="text-xs text-emerald-400 font-medium">Save 20%</span>
          )}
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">

          {/* FREE Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0 }}
            className="relative"
          >
            <div className="h-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Smile className="w-4 h-4 text-white/60" />
                </div>
                <span className="text-sm font-medium text-white/60">Free</span>
              </div>

              <div className="mb-1">
                <span className="text-4xl font-bold text-white">$0</span>
              </div>
              <p className="text-sm text-white/40 mb-5">Forever free to start</p>

              <div className="space-y-2.5 mb-6">
                {[
                  "100 credits / month",
                  "~1 generation",
                  "Preview only",
                  "Public projects",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <Check className="w-4 h-4 text-white/40 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-white/[0.05] text-white/70 hover:bg-white/[0.08] border border-white/[0.08]"
              >
                Get Started
              </button>
            </div>
          </motion.div>

          {/* PRO Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative lg:-mt-4 lg:mb-4"
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-xs font-semibold text-white shadow-lg shadow-[#FF6E3C]/30">
                Most Popular
              </div>
            </div>

            <div className="h-full p-6 rounded-2xl bg-gradient-to-b from-[#FF6E3C]/10 to-transparent border border-[#FF6E3C]/30 backdrop-blur-sm relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#FF6E3C]/5 to-transparent pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6E3C]/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#FF6E3C]" />
                  </div>
                  <span className="text-sm font-medium text-[#FF6E3C]">Pro</span>
                </div>

                {/* Price Display */}
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">${proDisplay}</span>
                  <span className="text-white/40">/mo</span>
                </div>

                {/* Savings Badge - only show on yearly */}
                {isAnnual ? (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                      Save $360/yr
                    </span>
                  </div>
                ) : (
                  <div className="mb-4" />
                )}

                {/* Features */}
                <div className="space-y-2.5 mb-6">
                  {PLAN_CONFIGS.pro.features.map((f, idx) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-white/70">
                      <Check className="w-4 h-4 text-[#FF6E3C] shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscription("pro")}
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
              </div>
            </div>
          </motion.div>

          {/* AGENCY Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <div className="h-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white/60" />
                </div>
                <span className="text-sm font-medium text-white/60">Agency</span>
              </div>

              {/* Price Display */}
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">${agencyDisplay}</span>
                <span className="text-white/40">/mo</span>
              </div>

              {/* Savings Badge */}
              {isAnnual ? (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                    Save $1,200/yr
                  </span>
                </div>
              ) : (
                <p className="text-sm text-white/40 mb-4">For teams & agencies</p>
              )}

              <div className="space-y-2.5 mb-6">
                {PLAN_CONFIGS.agency.features.map((f, idx) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <Check className="w-4 h-4 text-white/40 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscription("agency")}
                disabled={isCheckingOut === "agency"}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-white/[0.05] text-white/70 hover:bg-white/[0.08] border border-white/[0.08]"
              >
                {isCheckingOut === "agency" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Subscribe"
                )}
              </button>
            </div>
          </motion.div>

          {/* ENTERPRISE Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="h-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white/60" />
                </div>
                <span className="text-sm font-medium text-white/60">Enterprise</span>
              </div>

              <div className="mb-1">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <p className="text-sm text-white/40 mb-5">For large organizations</p>

              <div className="space-y-2.5 mb-6">
                {PLAN_CONFIGS.enterprise.features.slice(0, 4).map((f, idx) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <Check className="w-4 h-4 text-white/40 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <Link
                href="/contact"
                className="block w-full text-center py-3 rounded-xl text-sm font-medium transition-all bg-white/[0.05] text-white/70 hover:bg-white/[0.08] border border-white/[0.08]"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>

        {/* One-time Top-ups */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-white/80 mb-2">Need extra credits?</h3>
            <p className="text-sm text-white/40">Buy one-time credit packs anytime</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {TOPUPS.map((pkg) => (
              <button
                key={pkg.amount}
                onClick={() => handleBuyCredits(pkg.amount)}
                disabled={isCheckingOut === pkg.amount.toString()}
                className="relative px-8 py-5 rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-50 min-w-[140px]"
              >
                {isCheckingOut === pkg.amount.toString() ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white mb-1">{pkg.price}</div>
                    <div className="text-xs text-white/50">{pkg.credits} credits</div>
                    <div className="text-[10px] text-white/30">{pkg.gens} gens</div>
                  </>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Sign in to continue"
          description="You need to be signed in to subscribe or buy credits."
        />

        {/* Terms */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-xs text-white/30 text-center mt-10"
        >
          By subscribing, you agree to our{" "}
          <Link href="/terms" className="text-white/50 hover:text-white/70 underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-white/50 hover:text-white/70 underline">Privacy Policy</Link>.
        </motion.p>
      </div>
    </section>
  );
}
