"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import FocusLock from "react-focus-lock";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: "code" | "download" | "publish" | "supabase" | "general" | "reconstruct" | "library" | "editor";
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
  library: {
    title: "Unlock Component Library",
    description: "Extract, organize, and reuse UI components across all your projects.",
  },
  editor: {
    title: "Unlock AI Editor",
    description: "Edit any element with AI. Point, describe, watch AI modify your design in real-time.",
  },
};

const plans = [
  {
    id: "pro",
    name: "Pro",
    price: 149,
    credits: 15000,
    label: "For freelancers",
    features: ["15,000 credits/month (~100 gens)", "Unlimited projects", "React + Tailwind export", "Flow Map & Design System"],
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 499,
    credits: 60000,
    label: "For teams",
    features: ["60,000 credits/month (~400 gens)", "5 team members", "Shared Design System", "Priority GPU + API"],
    popular: false,
  },
];

export default function UpgradeModal({ isOpen, onClose, feature = "general" }: UpgradeModalProps) {
  const featureInfo = featureMessages[feature];
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const activePlan = plans.find(p => p.id === selectedPlan) || plans[0];

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
                  <div className="text-center mb-5">
                    <h2 id="upgrade-modal-title" className="text-lg font-semibold text-white mb-1">
                      {featureInfo.title}
                    </h2>
                    <p className="text-sm text-zinc-500">{featureInfo.description}</p>
                  </div>

                  {/* Plan Options */}
                  <div className="space-y-2.5 mb-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          selectedPlan === plan.id
                            ? "border-[var(--accent-orange)] bg-zinc-900/80"
                            : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selectedPlan === plan.id ? "border-[var(--accent-orange)]" : "border-zinc-600"
                            }`}>
                              {selectedPlan === plan.id && <div className="w-2 h-2 rounded-full bg-[var(--accent-orange)]" />}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-white">{plan.name}</span>
                              <span className="text-[10px] text-zinc-500 ml-2">{plan.label}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-white">${plan.price}</span>
                            <span className="text-xs text-zinc-500">/mo</span>
                          </div>
                        </div>
                        <div className="ml-6.5 pl-0.5 grid grid-cols-2 gap-x-2 gap-y-1">
                          {plan.features.map((f, i) => (
                            <p key={i} className="text-[11px] text-zinc-400 flex items-start gap-1">
                              <Check className="w-3 h-3 text-zinc-500 flex-shrink-0 mt-0.5" />
                              {f}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <a
                    href={`/pricing`}
                    className="w-full py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                  >
                    Get {activePlan.name} — ${activePlan.price}/mo
                  </a>

                  <a
                    href="/pricing"
                    className="block text-center text-[11px] text-zinc-500 hover:text-zinc-400 mt-3 transition-colors"
                  >
                    View all pricing options
                  </a>
                </div>
              </div>
            </FocusLock>
          </motion.div>

        </>
      )}
    </AnimatePresence>
  );
}
