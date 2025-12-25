"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FF6E3C]/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-[#FF6E3C]" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">
                  You're out of credits
                </h2>
                <p className="text-sm text-white/50">
                  Buy credits or upgrade your plan to continue.
                </p>
                
                {/* Credits info */}
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Required:</span>
                    <span className="text-white font-medium">{requiredCredits} credits</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-white/50">Available:</span>
                    <span className="text-red-400 font-medium">{availableCredits} credits</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  href="/settings?tab=credits"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <CreditCard className="w-5 h-5" />
                  Buy credits
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                <Link
                  href="/settings?tab=plans"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Upgrade plan
                </Link>
              </div>

              {/* Quick buy options */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-white/30 text-center mb-3">Quick buy</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { price: "$20", credits: "2,000" },
                    { price: "$50", credits: "5,500", best: true },
                    { price: "$100", credits: "12,000" },
                  ].map((pkg) => (
                    <button
                      key={pkg.price}
                      className={`relative p-3 rounded-lg border transition-colors ${
                        pkg.best 
                          ? "border-[#FF6E3C]/50 bg-[#FF6E3C]/10 hover:bg-[#FF6E3C]/20" 
                          : "border-white/10 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      {pkg.best && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#FF6E3C] text-[10px] font-medium text-white">
                          Best
                        </span>
                      )}
                      <div className="text-sm font-semibold text-white">{pkg.price}</div>
                      <div className="text-xs text-white/50">{pkg.credits}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

