"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Loader2, Play } from "lucide-react";
import FocusLock from "react-focus-lock";
import Link from "next/link";

interface OutOfCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits?: number;
  availableCredits?: number;
  isSandbox?: boolean;
}

const DEMO_PROJECT_URL = "https://www.replay.build/tool?project=flow_1769444036799_r8hrcxyx2";

// Stripe Price ID - Pro $149/mo
const PRO_SUBSCRIPTION_PRICE_ID = "price_1SotMYAxch1s4iBGLZZ7ATBs";

export default function OutOfCreditsModal({
  isOpen,
  onClose,
  requiredCredits = 75,
  availableCredits = 0,
  isSandbox = false,
}: OutOfCreditsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          priceId: PRO_SUBSCRIPTION_PRICE_ID,
          tierId: "pro",
          credits: 3000,
          interval: "monthly"
        }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setIsLoading(false);
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
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
                className="relative w-full max-w-sm bg-[#111] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="credits-modal-title"
              >
                {/* Close button */}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors z-10"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>

                <div className="p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h2 id="credits-modal-title" className="text-lg font-semibold text-white mb-1">
                      {isSandbox ? "Credits Required" : "Out of Credits"}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {isSandbox 
                        ? "Sandbox plan has 0 credits. Upgrade to Pro to generate."
                        : `You need ${requiredCredits} credits. You have ${availableCredits}.`
                      }
                    </p>
                  </div>

                  {/* Pro Plan Box */}
                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">Pro</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-white">$149</span>
                        <span className="text-xs text-zinc-500">/mo</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-zinc-400">
                      <p>3,000 credits/month (~20 generations)</p>
                      <p>Unlimited projects</p>
                      <p>React + Tailwind export</p>
                      <p>Flow Map & Design System</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={handlePurchase}
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Get Pro
                      </>
                    )}
                  </button>

                  {/* Alternative: Explore Demo (for Sandbox users) */}
                  {isSandbox && (
                    <Link 
                      href={DEMO_PROJECT_URL}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Explore Demo Instead
                    </Link>
                  )}

                  <p className="text-center text-[11px] text-zinc-600 mt-3">
                    Cancel anytime. Secure payment via Stripe.
                  </p>
                </div>
              </div>
            </FocusLock>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
