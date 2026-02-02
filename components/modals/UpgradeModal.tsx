"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import FocusLock from "react-focus-lock";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: "code" | "download" | "publish" | "supabase" | "general" | "reconstruct";
}

const featureMessages = {
  code: {
    title: "Unlock Full Source Code",
    description: "Export React + Tailwind code for your project.",
  },
  download: {
    title: "Download Your Project",
    description: "Export your generated code and use it anywhere.",
  },
  publish: {
    title: "Publish to Web",
    description: "Share your project with a live URL.",
  },
  supabase: {
    title: "Supabase Integration",
    description: "Connect your database and see schema details.",
  },
  general: {
    title: "Upgrade to Pro",
    description: "Get full access to all Replay features.",
  },
  reconstruct: {
    title: "Credits Required",
    description: "You need credits to reconstruct UI from video.",
  },
};

export default function UpgradeModal({ isOpen, onClose, feature = "general" }: UpgradeModalProps) {
  const featureInfo = featureMessages[feature];
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
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
                className="relative w-full max-w-sm bg-[#111] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upgrade-modal-title"
              >
                {/* Close button */}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors z-10"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>

                {/* Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h2 id="upgrade-modal-title" className="text-lg font-semibold text-white mb-1">
                      {featureInfo.title}
                    </h2>
                    <p className="text-sm text-zinc-500">{featureInfo.description}</p>
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

                  {/* CTA */}
                  <a
                    href="/pricing"
                    className="w-full py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Check Pricing
                  </a>

                  <p className="text-center text-[11px] text-zinc-600 mt-3">
                    View all plans and choose the best for you.
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
