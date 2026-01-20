"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronDown, Info, Calendar, RotateCcw, Plus } from "lucide-react";
import { useCredits, PLAN_LIMITS } from "@/lib/credits/context";
import Link from "next/link";

export default function CreditsBar() {
  const { wallet, membership, totalCredits, isLoading } = useCredits();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
        <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse" />
        <div className="w-16 h-4 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (!wallet || !membership) {
    return null;
  }

  const plan = membership.plan;
  const limits = PLAN_LIMITS[plan];
  const maxCredits = limits.monthlyCredits;
  const percentage = Math.min((totalCredits / maxCredits) * 100, 100);

  // Format next reset date
  const nextReset = membership.current_period_end
    ? new Date(membership.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Zap className="w-4 h-4 text-[#FF6E3C]" />
        <span className="text-sm font-medium text-white">{totalCredits.toLocaleString()}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 p-4 rounded-xl bg-[#0a0a0a] border border-white/10 shadow-xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">Credits</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60 capitalize">
                {plan} plan
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/50">Available</span>
                <span className="text-white font-medium">
                  {totalCredits.toLocaleString()} / {maxCredits.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className={`h-full rounded-full ${percentage >= 95 ? 'bg-[#FF6E3C]' : 'bg-gradient-to-r from-zinc-500 to-zinc-400'}`}
                />
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Monthly
                </span>
                <span className="text-white/70">{wallet.monthly_credits.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 flex items-center gap-1.5">
                  <RotateCcw className="w-3 h-3" />
                  Rollover
                </span>
                <span className="text-white/70">{wallet.rollover_credits.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 flex items-center gap-1.5">
                  <Plus className="w-3 h-3" />
                  Top-up
                </span>
                <span className="text-white/70">{wallet.topup_credits.toLocaleString()}</span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5 py-3 border-t border-white/10">
              <div className="flex items-start gap-2 text-xs text-white/40">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Monthly credits reset on {nextReset}</span>
              </div>
              {limits.rolloverCap > 0 && (
                <div className="flex items-start gap-2 text-xs text-white/40">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>Up to {limits.rolloverCap.toLocaleString()} credits roll over</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-white/10">
              <Link
                href="/settings?tab=credits"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF6E3C] text-white text-xs font-medium hover:bg-[#FF8F5C] transition-colors"
              >
                <Plus className="w-3 h-3" />
                Buy credits
              </Link>
              <Link
                href="/settings?tab=plans"
                className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-white/5 text-white/70 text-xs hover:bg-white/10 transition-colors"
              >
                Manage plan
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


