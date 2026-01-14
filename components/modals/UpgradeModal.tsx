"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Code, Download, ExternalLink, Database, Sparkles, X, Zap, Check, Loader2 } from "lucide-react";
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
    title: "Unlock Source Code",
    description: "Get full access to production-ready React + Tailwind code",
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
    title: "Upgrade to Pro",
    description: "Unlock all premium features",
    icon: Sparkles,
  },
};

const proFeatures = [
  "Full source code access",
  "Download & export projects",
  "Publish with custom URLs",
  "Supabase integration details",
  "3,000 credits per month",
  "Commercial license",
  "Priority support",
];

// Default Pro tier ($25/mo)
const DEFAULT_PRO_PRICE_ID = "price_1SotL1Axch1s4iBGWMvO0JBZ";
const DEFAULT_PRO_TIER_ID = "pro25";
const DEFAULT_PRO_CREDITS = 1500;

export default function UpgradeModal({ isOpen, onClose, feature = "general" }: UpgradeModalProps) {
  const featureInfo = featureMessages[feature];
  const FeatureIcon = featureInfo.icon;
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleUpgrade = async () => {
    // If not logged in, show auth modal first
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          priceId: DEFAULT_PRO_PRICE_ID,
          tierId: DEFAULT_PRO_TIER_ID,
          credits: DEFAULT_PRO_CREDITS,
          interval: "monthly"
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
    // Small delay to let auth state update
    setTimeout(() => handleUpgrade(), 100);
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
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-50"
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
                className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upgrade-modal-title"
              >
                {/* Close button - properly positioned */}
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 border border-[#FF6E3C]/20 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-[#FF6E3C]" />
                </div>
                <h2 id="upgrade-modal-title" className="text-xl font-bold text-white mb-2">{featureInfo.title}</h2>
                <p className="text-sm text-white/60">{featureInfo.description}</p>
              </div>

              {/* Features list */}
              <div className="px-6 pb-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-[#FF6E3C]" />
                    <span className="text-sm font-semibold text-white">Pro Plan Includes:</span>
                  </div>
                  <ul className="space-y-2">
                    {proFeatures.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA - goes directly to Stripe checkout */}
              <div className="p-6 pt-2 space-y-3">
                <button
                  onClick={handleUpgrade}
                  disabled={isCheckingOut}
                  className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Upgrade to Pro"
                  )}
                </button>
                <p className="text-center text-[11px] text-white/40">
                  Includes commercial license. Cancel anytime.
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
            title="Sign in to upgrade"
            description="You need to be signed in to subscribe to Pro."
          />
        </>
      )}
    </AnimatePresence>
  );
}

