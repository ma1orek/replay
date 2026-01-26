"use client";

import { useState } from "react";
import { Check, X, MessageSquare, Loader2, Sparkles } from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "changes_requested";

interface ApprovalButtonProps {
  projectId: string;
  currentStatus?: ApprovalStatus;
  onApprove: (comment?: string) => Promise<void>;
  onRequestChanges: (comment: string) => Promise<void>;
  disabled?: boolean;
}

export default function ApprovalButton({
  projectId,
  currentStatus = "pending",
  onApprove,
  onRequestChanges,
  disabled = false,
}: ApprovalButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [comment, setComment] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await onApprove(comment || undefined);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setShowModal(false);
      setComment("");
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!comment.trim()) return;
    
    try {
      setIsRequestingChanges(true);
      await onRequestChanges(comment);
      setShowModal(false);
      setComment("");
    } catch (error) {
      console.error("Request changes failed:", error);
    } finally {
      setIsRequestingChanges(false);
    }
  };

  // Already approved state
  if (currentStatus === "approved") {
    return (
      <div className="flex items-center justify-center gap-2 py-4 px-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
        <Check className="w-5 h-5 text-emerald-400" />
        <span className="text-emerald-400 font-medium">Approved</span>
      </div>
    );
  }

  return (
    <>
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce">
              <Sparkles className="w-16 h-16 text-[#FF6E3C]" />
            </div>
          </div>
          {/* Simple confetti particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-ping"
              style={{
                backgroundColor: ["#FF6E3C", "#10B981", "#3B82F6", "#F59E0B"][i % 4],
                left: `${10 + Math.random() * 80}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main approval button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className="w-full py-5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
      >
        <Check className="w-6 h-6" />
        APPROVE
      </button>

      {/* Approval modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 p-6 pb-10 animate-in slide-in-from-bottom duration-300"
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Approve Project</h3>
              <p className="text-white/50 text-sm mt-1">
                This will mark the project as approved
              </p>
            </div>

            {/* Optional comment */}
            <div className="mb-6">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
                Add a note (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Great work! Ship it..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm resize-none focus:outline-none focus:border-emerald-500/50"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Approve button */}
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isApproving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Approve
                  </>
                )}
              </button>

              {/* Request changes button */}
              <button
                onClick={handleRequestChanges}
                disabled={isRequestingChanges || !comment.trim()}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 font-medium flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isRequestingChanges ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Request Changes
                  </>
                )}
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 text-white/40 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
