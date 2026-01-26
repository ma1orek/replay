"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, MessageCircle, Check, AlertCircle } from "lucide-react";
import CommentBubble from "./CommentBubble";

interface CommentPin {
  id: string;
  x: number;
  y: number;
  text: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: number;
}

interface MobileMirrorModeProps {
  previewUrl: string | null;
  previewCode: string | null;
  projectName: string;
  projectId?: string | null;
  onClose: () => void;
  onAddComment?: (comment: { x: number; y: number; text: string }) => void;
  comments?: CommentPin[];
  userName?: string;
  userAvatar?: string;
}

export default function MobileMirrorMode({
  previewUrl,
  previewCode,
  projectName,
  projectId,
  onClose,
  onAddComment,
  comments = [],
  userName = "You",
  userAvatar,
}: MobileMirrorModeProps) {
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "changes_requested">("pending");
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch current approval status
  useEffect(() => {
    if (!projectId) return;
    
    fetch(`/api/projects/approve?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setApprovalStatus(data.status);
        }
      })
      .catch(() => {});
  }, [projectId]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

    // Start long-press timer for comments
    pressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setCommentPosition({ x: touch.clientX, y: touch.clientY });
      touchStartRef.current = null;
    }, 600);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    if (dx > 10 || dy > 10) {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      touchStartRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    touchStartRef.current = null;
  }, []);

  const handleCommentSubmit = useCallback((text: string) => {
    if (commentPosition && onAddComment) {
      onAddComment({
        x: commentPosition.x,
        y: commentPosition.y,
        text,
      });
    }
    setCommentPosition(null);
  }, [commentPosition, onAddComment]);

  const handleApprove = async () => {
    if (!projectId) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/projects/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          action: "approve",
          comment: approvalNote || undefined,
        }),
      });
      
      if (response.ok) {
        setApprovalStatus("approved");
        setShowApprovalModal(false);
        setApprovalNote("");
      }
    } catch {}
    
    setIsSubmitting(false);
  };

  const handleRequestChanges = async () => {
    if (!projectId || !approvalNote.trim()) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/projects/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          action: "request_changes",
          comment: approvalNote,
        }),
      });
      
      if (response.ok) {
        setApprovalStatus("changes_requested");
        setShowApprovalModal(false);
        setApprovalNote("");
      }
    } catch {}
    
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Always visible close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Project name badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/10">
        <span className="text-white/80 text-xs font-medium truncate max-w-[150px] block">
          {projectName}
        </span>
      </div>

      {/* Fullscreen iframe */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {previewUrl ? (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: "white" }}
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : previewCode ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewCode}
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: "white" }}
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : null}

        {/* Comment pins */}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="absolute w-6 h-6 -ml-3 -mt-3 z-10"
            style={{ left: comment.x, top: comment.y }}
          >
            <div className="w-6 h-6 rounded-full bg-white border-2 border-zinc-300 shadow-lg flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-zinc-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar with approval */}
      <div className="bg-[#0a0a0a] border-t border-zinc-800/50 px-4 py-3 flex items-center gap-3">
        {/* Long press hint */}
        <div className="flex-1 flex items-center gap-2 text-zinc-500 text-xs">
          <MessageCircle className="w-4 h-4" />
          <span>Long press to comment</span>
        </div>

        {/* Approval button */}
        {projectId && (
          <button
            onClick={() => setShowApprovalModal(true)}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
              approvalStatus === "approved"
                ? "bg-emerald-500/20 text-emerald-400"
                : approvalStatus === "changes_requested"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {approvalStatus === "approved" ? (
              <>
                <Check className="w-4 h-4" />
                Approved
              </>
            ) : approvalStatus === "changes_requested" ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Changes
              </>
            ) : (
              "Review"
            )}
          </button>
        )}
      </div>

      {/* Safe area */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[#0a0a0a]" />

      {/* Comment bubble overlay */}
      {commentPosition && (
        <CommentBubble
          position={commentPosition}
          onSubmit={handleCommentSubmit}
          onClose={() => setCommentPosition(null)}
          authorName={userName}
          authorAvatar={userAvatar}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80"
          onClick={() => setShowApprovalModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-[#111] rounded-t-2xl border-t border-zinc-800 p-5 pb-8"
          >
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
            
            <h3 className="text-lg font-semibold text-white mb-4">
              Review Project
            </h3>
            
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Add a note (optional for approve, required for changes)"
              className="w-full h-24 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRequestChanges}
                disabled={isSubmitting || !approvalNote.trim()}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-white font-medium text-sm disabled:opacity-30 transition-colors hover:bg-zinc-700"
              >
                Request Changes
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-white text-black font-medium text-sm disabled:opacity-50 transition-colors hover:bg-zinc-200"
              >
                {isSubmitting ? "..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
