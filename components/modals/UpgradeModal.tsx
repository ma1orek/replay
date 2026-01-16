"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Code, Download, ExternalLink, Database, Sparkles, X, Zap, Check, Loader2, CreditCard, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import AuthModal from "./AuthModal";
import FocusLock from "react-focus-lock";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: "code" | "download" | "publish" | "supabase" | "general";
}

const featureMessages = {
  code: {
    title: "Unlock Full Source Code",
    description: "Your code is ready. We've successfully reconstructed the UI logic, animations, and data structure.",
    icon: Code,
  },
  download: {
    title: "Download Your Project",
    description: "Export your generated code and use it anywhere",
    icon: Download,
  },
  publish: {
    title: "Publish to Web",
    description: "Share your project with a live URL",
    icon: ExternalLink,
  },
  supabase: {
    title: "Supabase Integration",
    description: "Connect your database and see schema details",
    icon: Database,
  },
  general: {
    title: "Unlock Full Source Code",
    description: "Your code is ready. Choose how you want to access it.",
    icon: Sparkles,
  },
};

// Stripe Price IDs
const STARTER_PACK_PRICE_ID = "price_1Spo05Axch1s4iBGydOPAd2i"; // $9 one-time
const PRO_SUBSCRIPTION_PRICE_ID = "price_1SotL1Axch1s4iBGWMvO0JBZ"; // $25/mo

const starterFeatures = [
  "Clean React + Tailwind Components",
  "Framer Motion Interactions",
  "Supabase Schema & Data Fetching",
  "200 credits • Export access",
  "Perfect for testing",
];

const proFeatures = [
  "Everything in Starter Pack",
  "3,000 credits per month",
  "Full code access & export",
  "Priority AI processing",
  "Credits roll over",
  "Priority support",
];

export default function UpgradeModal({ isOpen, onClose, feature = "general" }: UpgradeModalProps) {
  const featureInfo = featureMessages[feature];
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro">("starter");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    // If not logged in, show auth modal first
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      const isStarter = selectedPlan === "starter";
      
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isStarter ? "starter" : "subscription",
          priceId: isStarter ? STARTER_PACK_PRICE_ID : PRO_SUBSCRIPTION_PRICE_ID,
          tierId: isStarter ? "starter" : "pro25",
          credits: isStarter ? 200 : 1500,
          interval: isStarter ? undefined : "monthly"
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
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Handle auth success - proceed with checkout
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setTimeout(() => handleCheckout(), 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <FocusLock returnFocus>
              <div 
                className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upgrade-modal-title"
              >
                {/* Close button */}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors z-10 focus-ring-strong"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>

                {/* Header */}
                <div className="relative p-6 pb-4 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 border border-[#FF6E3C]/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-[#FF6E3C]" />
                  </div>
                  <h2 id="upgrade-modal-title" className="text-xl font-bold text-white mb-2">{featureInfo.title}</h2>
                  <p className="text-sm text-white/60 max-w-sm mx-auto">{featureInfo.description}</p>
                </div>

                {/* Plan Selection */}
                <div className="px-6 pb-4 space-y-3">
                  {/* Starter Pack Option */}
                  <button
                    onClick={() => setSelectedPlan("starter")}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPlan === "starter"
                        ? "border-[#FF6E3C] bg-[#FF6E3C]/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan === "starter" ? "border-[#FF6E3C] bg-[#FF6E3C]" : "border-white/30"
                        }`}>
                          {selectedPlan === "starter" && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#FF6E3C]" />
                            <span className="font-semibold text-white">Starter Pack</span>
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded-full">POPULAR</span>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">One-time payment • Perfect for testing</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-white">$9</span>
                        <p className="text-[10px] text-white/40">one-time</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 ml-8">
                      {starterFeatures.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </button>

                  {/* Pro Subscription Option */}
                  <button
                    onClick={() => setSelectedPlan("pro")}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPlan === "pro"
                        ? "border-[#FF6E3C] bg-[#FF6E3C]/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan === "pro" ? "border-[#FF6E3C] bg-[#FF6E3C]" : "border-white/30"
                        }`}>
                          {selectedPlan === "pro" && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="font-semibold text-white">Pro Subscription</span>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">Monthly • Unlimited potential</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-white">$25</span>
                        <p className="text-[10px] text-white/40">/month</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 ml-8">
                      {proFeatures.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                          <Check className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </button>
                </div>

                {/* CTA */}
                <div className="p-6 pt-2 space-y-3 border-t border-white/5">
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isCheckingOut ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : selectedPlan === "starter" ? (
                      "Get Starter Pack for $9"
                    ) : (
                      "Subscribe to Pro for $25/mo"
                    )}
                  </button>
                  <p className="text-center text-[11px] text-white/40">
                    {selectedPlan === "starter" 
                      ? "One-time payment. No subscription. Credits never expire."
                      : "Cancel anytime. Credits roll over."
                    }
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-white/40 text-xs hover:text-white/60 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </FocusLock>
          </motion.div>

          {/* Auth Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
            title="Sign in to continue"
            description="You need to be signed in to make a purchase."
          />
        </>
      )}
    </AnimatePresence>
  );
}
