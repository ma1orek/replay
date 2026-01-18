"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Check, Sparkles, Crown, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import FocusLock from "react-focus-lock";

interface OutOfCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits?: number;
  availableCredits?: number;
}

export default function OutOfCreditsModal({
  isOpen,
  onClose,
  requiredCredits = 75,
  availableCredits = 0,
}: OutOfCreditsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-focus close button when modal opens
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
          priceId: "price_1SotL1Axch1s4iBGWMvO0JBZ",
          tierId: "pro25",
          credits: 1500,
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <FocusLock returnFocus>
              <div 
                className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="credits-modal-title"
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6E3C] via-[#FF8F5C] to-[#FF6E3C]" />
                
                {/* Close button */}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/5 transition-colors focus-ring-strong z-10"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>

                <div className="p-6 md:p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#FF6E3C]/10 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-[#FF6E3C]" />
                      </div>
                    </div>
                    <h2 id="credits-modal-title" className="text-2xl font-bold text-white mb-2">
                      Unlock Source Code
                    </h2>
                    <p className="text-sm text-white/50">
                      Get instant access to React + Tailwind code for this project.
                    </p>
                  </div>

                  {/* Pro Subscription - Only Option */}
                  <div className="mb-6">
                    <div className="w-full p-4 rounded-xl border-2 border-[#FF6E3C] bg-[#FF6E3C]/5">
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border-2 border-[#FF6E3C] bg-[#FF6E3C] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-bold text-white">$25</span>
                            <span className="text-sm text-white/50">/month</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            Pro Subscription
                          </div>
                          <ul className="space-y-1">
                            <li className="flex items-center gap-2 text-xs text-white/60">
                              <Sparkles className="w-3 h-3 text-[#FF6E3C]" />
                              1,500 credits/month (~20 generations)
                            </li>
                            <li className="flex items-center gap-2 text-xs text-white/60">
                              <Check className="w-3 h-3 text-green-500" />
                              Full Access • Priority support
                            </li>
                            <li className="flex items-center gap-2 text-xs text-white/60">
                              <Check className="w-3 h-3 text-green-500" />
                              Credits roll over
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={handlePurchase}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Subscribe for $25/mo
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {/* Footer */}
                  <p className="text-center text-xs text-white/30 mt-4">
                    Secure payment via Stripe. Cancel anytime.
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
