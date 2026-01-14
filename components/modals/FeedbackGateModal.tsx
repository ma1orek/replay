"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ThumbsUp, Meh, ThumbsDown, Send, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import FocusLock from "react-focus-lock";

interface FeedbackGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  generationId?: string;
  userId?: string;
}

type FeedbackRating = "yes" | "kinda" | "no" | null;

export default function FeedbackGateModal({
  isOpen,
  onClose,
  generationId,
  userId,
}: FeedbackGateModalProps) {
  const [rating, setRating] = useState<FeedbackRating>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!rating) return;
    
    setIsSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || null,
          generationId,
          userId,
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset state after close
        setTimeout(() => {
          setRating(null);
          setFeedback("");
          setSubmitted(false);
        }, 300);
      }, 1500);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Save feedback even if user closes without explicit submit
    if (rating) {
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || null,
          generationId,
          userId,
          dismissed: true,
        }),
      }).catch(console.error);
    }
    onClose();
  };

  const ratingButtons = [
    { value: "yes" as const, icon: ThumbsUp, label: "Yes", color: "text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30" },
    { value: "kinda" as const, icon: Meh, label: "Kinda", color: "text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/30" },
    { value: "no" as const, icon: ThumbsDown, label: "No", color: "text-red-400 hover:bg-red-500/20 border-red-500/30" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <FocusLock returnFocus>
              <div 
                className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-modal-title"
              >
                {/* Close button */}
                <button
                  ref={closeButtonRef}
                  onClick={handleClose}
                  className="absolute right-3 top-3 p-2 rounded-lg hover:bg-white/5 transition-colors focus-ring-strong"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>

              {/* Logo */}
              <div className="flex justify-center mb-6">
                <Logo />
              </div>

              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Thanks for your feedback!</h3>
                  <p className="text-sm text-white/50">It helps us improve Replay.</p>
                </motion.div>
              ) : (
                <>
                  {/* Content */}
                  <div className="text-center mb-6">
                    <h2 id="feedback-modal-title" className="text-xl font-semibold text-white mb-2">
                      Did this match what you expected?
                    </h2>
                    <p className="text-sm text-white/40">
                      Your feedback helps us improve
                    </p>
                  </div>

                  {/* Rating buttons */}
                  <div className="flex justify-center gap-3 mb-6">
                    {ratingButtons.map((btn) => {
                      const Icon = btn.icon;
                      const isSelected = rating === btn.value;
                      return (
                        <button
                          key={btn.value}
                          onClick={() => setRating(btn.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            isSelected
                              ? `${btn.color} bg-white/5`
                              : "border-white/10 text-white/40 hover:border-white/20"
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${isSelected ? "" : ""}`} />
                          <span className="text-xs font-medium">{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback textarea - show if Kinda or No */}
                  <AnimatePresence>
                    {(rating === "kinda" || rating === "no") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-6"
                      >
                        <label className="block text-sm text-white/50 mb-2">
                          What was off?
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Tell us what could be improved..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 transition-colors resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!rating || isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </>
              )}
              </div>
            </FocusLock>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


