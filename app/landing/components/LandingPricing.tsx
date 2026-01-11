"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/modals/AuthModal";
import { useAuth } from "@/lib/auth/context";
import { GlowCard } from "@/components/ui/spotlight-card";

export default function LandingPricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isYearly, setIsYearly] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "subscription" | "topup"; amount?: number } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Handle pending action after successful auth
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction.type === "subscription") {
        handleProSubscription();
      } else if (pendingAction.type === "topup" && pendingAction.amount) {
        handleBuyCredits(pendingAction.amount);
      }
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  const handleProSubscription = async () => {
    // If not logged in, show auth modal and set pending action
    if (!user) {
      setPendingAction({ type: "subscription" });
      setShowAuthModal(true);
      return;
    }

    setIsCheckingOut("pro");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "subscription", 
          interval: isYearly ? "yearly" : "monthly" 
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
    // If not logged in, show auth modal and set pending action
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

  const TOPUPS = [
    { amount: 20, price: "$20", credits: "2,000" },
    { amount: 50, price: "$50", credits: "5,500" },
    { amount: 100, price: "$100", credits: "12,000" },
  ];

  const plans = [
    { 
      name: "Free", 
      price: "$0",
      priceYearly: "$0",
      tagline: "For getting started", 
      features: [
        "150 credits (one-time)",
        "~2 rebuilds",
        "Interactive preview",
        "Preview-only",
        "Public projects only",
      ],
      cta: "Try Replay Free",
    },
    { 
      name: "Pro", 
      price: "$35",
      priceYearly: "$378",
      tagline: "For builders", 
      features: [
        "3,000 credits / month",
        "~40 rebuilds / month",
        "Full code access",
        "Download & Copy",
        "Publish to web",
        "Rollover up to 600 credits",
      ], 
      popular: true,
      cta: "Upgrade",
    },
    { 
      name: "Enterprise", 
      price: "Custom",
      priceYearly: "Custom",
      tagline: "For teams & orgs", 
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

  return (
    <section id="pricing" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FF6E3C] animate-pulse" />
            <span className="text-xs font-medium text-[#FF6E3C]">Early Access Pricing</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Start for free. Upgrade for power.
          </h2>
          <p className="text-white/50 mb-2">Pay only for what you generate.</p>
          <p className="text-xs text-white/30">Credits are consumed per reconstruction — not per prompt. One run = flow + structure + code + design system.</p>
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
              className="relative"
            >
              <GlowCard glowColor="orange" customSize className="h-full !p-8">
                {plan.popular && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-[#FF6E3C] text-xs font-medium text-white z-10">
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
                
                {plan.name === "Enterprise" ? (
                  <Link
                    href="/contact"
                    className="block w-full text-center py-3.5 rounded-xl text-sm font-medium transition-all bg-white/[0.05] text-white/70 hover:bg-white/[0.08] border border-white/[0.08]"
                  >
                    {plan.cta}
                  </Link>
                ) : plan.name === "Pro" ? (
                  <button
                    onClick={handleProSubscription}
                    disabled={isCheckingOut === "pro"}
                    className={cn(
                      "w-full text-center py-3.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50",
                      "bg-[#FF6E3C] text-white hover:bg-[#FF8F5C]"
                    )}
                  >
                    {isCheckingOut === "pro" ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    className="w-full text-center py-3.5 rounded-xl text-sm font-medium transition-all bg-white/[0.05] text-white/70 hover:bg-white/[0.08] border border-white/[0.08]"
                  >
                    {plan.cta}
                  </button>
                )}
              </GlowCard>
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
            {TOPUPS.map((pkg) => (
              <button
                key={pkg.amount}
                onClick={() => handleBuyCredits(pkg.amount)}
                disabled={isCheckingOut === pkg.amount.toString()}
                className="relative px-6 py-4 rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-50"
              >
                {isCheckingOut === pkg.amount.toString() ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-bold text-white">{pkg.price}</div>
                    <div className="text-xs text-white/50">{pkg.credits} credits</div>
                  </>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Auth Modal for credits purchase */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Sign in to buy credits"
          description="You need to be signed in to purchase credits."
        />
        
        {/* Terms disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-xs text-white/30 text-center mt-8"
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
