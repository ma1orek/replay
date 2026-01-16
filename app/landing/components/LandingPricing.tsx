"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Sparkles, Zap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/modals/AuthModal";
import { useAuth } from "@/lib/auth/context";

// Starter Pack - One-time $9
const STARTER_PACK = {
  id: 'starter',
  credits: 300,
  price: 9,
  stripePriceId: "price_1Spo05Axch1s4iBGydOPAd2i",
};

// Elastic "PRO" Subscription Tiers with Stripe Price IDs
const PRICING_TIERS = [
  {
    id: 'pro25',
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
  { amount: 20, price: "$20", credits: "900", gens: "~6" },
  { amount: 50, price: "$50", credits: "2,400", gens: "~16" },
  { amount: 100, price: "$100", credits: "5,250", gens: "~35" },
];

export default function LandingPricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isAnnual, setIsAnnual] = useState(false); // Default to monthly
  const [selectedTierIndex, setSelectedTierIndex] = useState(0); // Default to $25 tier (index 0)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "subscription" | "topup"; amount?: number; priceId?: string } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const selectedTier = PRICING_TIERS[selectedTierIndex];

  // Handle pending action after successful auth
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction.type === "subscription" && pendingAction.priceId) {
        handleProSubscription(pendingAction.priceId);
      } else if (pendingAction.type === "topup" && pendingAction.amount === 9) {
        handleStarterPack();
      } else if (pendingAction.type === "topup" && pendingAction.amount) {
        handleBuyCredits(pendingAction.amount);
      }
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  const handleProSubscription = async (priceId?: string) => {
    const stripePriceId = priceId || (isAnnual ? selectedTier.stripePriceId_Yearly : selectedTier.stripePriceId_Monthly);
    
    if (!user) {
      setPendingAction({ type: "subscription", priceId: stripePriceId });
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
          priceId: stripePriceId,
          tierId: selectedTier.id,
          credits: selectedTier.credits,
          interval: isAnnual ? "yearly" : "monthly"
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

  const handleStarterPack = async () => {
    if (!user) {
      setPendingAction({ type: "topup", amount: 9 });
      setShowAuthModal(true);
      return;
    }

    setIsCheckingOut("starter");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "starter",
          priceId: STARTER_PACK.stripePriceId,
          credits: STARTER_PACK.credits
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

  const handleGetStarted = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      router.push("/");
    }
  };

  // Display price based on billing period
  const displayPrice = isAnnual ? selectedTier.yearlyPriceMonthly : selectedTier.monthlyPrice;

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
                  <Zap className="w-4 h-4 text-white/60" />
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
              
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-white/[0.05] text-white/70 hover:bg-white/[0.08] border border-white/[0.08]"
              >
                Get Started
              </button>
            </div>
          </motion.div>

          {/* STARTER PACK Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.05 }}
            className="relative"
          >
            <div className="h-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-emerald-400">Starter Pack</span>
              </div>
              
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-sm text-white/40">one-time</span>
              </div>
              <p className="text-sm text-white/40 mb-5">Perfect for testing</p>
              
              <div className="space-y-2.5 mb-6">
                {[
                  "300 credits (no expiry)",
                  "Full code access & export",
                  "Publish to web",
                  "No subscription required",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleStarterPack}
                disabled={isCheckingOut === "starter"}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-50"
              >
                {isCheckingOut === "starter" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Buy Starter Pack"
                )}
              </button>
            </div>
          </motion.div>

          {/* PRO Card - Elastic */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative lg:-mt-4 lg:mb-4"
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-xs font-semibold text-white shadow-lg shadow-[#FF6E3C]/30">
                Best Value
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
                  <span className="text-4xl font-bold text-white">${displayPrice}</span>
                  <span className="text-white/40">/mo</span>
                </div>
                
                {/* Savings Badge - only show on yearly */}
                {isAnnual && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                      Save {selectedTier.yearlySavings}
                    </span>
                  </div>
                )}
                {!isAnnual && <div className="mb-4" />}

                {/* Capacity Dropdown */}
                <div className="relative mb-5">
                  <label className="block text-xs font-medium text-white/50 mb-2">Capacity</label>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white hover:border-white/20 transition-all"
                      >
                        <span>{selectedTier.credits.toLocaleString()} credits</span>
                        <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", dropdownOpen && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {dropdownOpen && (
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
                                  setDropdownOpen(false);
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
                    <div className="space-y-2.5 mb-6">
                      {[
                        "Everything in Starter, plus:",
                        `${selectedTier.credits.toLocaleString()} credits / month`,
                        "Private projects",
                        "Credits roll over",
                        "Priority support",
                      ].map((f, idx) => (
                        <div key={f} className={cn("flex items-center gap-3 text-sm", idx === 0 ? "text-[#FF6E3C] font-medium" : "text-white/70")}>
                          <Check className="w-4 h-4 text-[#FF6E3C] shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                
                <button
                  onClick={() => handleProSubscription()}
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

          {/* ENTERPRISE Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
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
              <p className="text-sm text-white/40 mb-5">For teams & orgs</p>
              
              <div className="space-y-2.5 mb-6">
                {[
                  "Everything in Pro, plus:",
                  "Custom credit allocation",
                  "Team seats & SSO",
                  "Dedicated support & SLA",
                ].map((f, idx) => (
                  <div key={f} className={cn("flex items-center gap-3 text-sm", idx === 0 ? "text-white/80 font-medium" : "text-white/60")}>
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
