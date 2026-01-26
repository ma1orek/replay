"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, MessageCircle, ChevronDown } from "lucide-react";
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
  onClose,
  onAddComment,
  comments = [],
  userName = "You",
  userAvatar,
}: MobileMirrorModeProps) {
  const [showUI, setShowUI] = useState(true);
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const [showCommentHint, setShowCommentHint] = useState(true);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Hide hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowCommentHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide UI after 3 seconds of inactivity
  useEffect(() => {
    if (!showUI) return;
    const timer = setTimeout(() => setShowUI(false), 3000);
    return () => clearTimeout(timer);
  }, [showUI]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't trigger on iframe content
    if (e.target === iframeRef.current) return;

    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    // Start long-press timer
    pressTimerRef.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Show comment bubble at touch position
      setCommentPosition({ x: touch.clientX, y: touch.clientY });
      touchStartRef.current = null;
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long-press if finger moved too much
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

  const handleTap = useCallback(() => {
    // Toggle UI visibility on tap
    setShowUI((prev) => !prev);
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

  const handleCommentClose = useCallback(() => {
    setCommentPosition(null);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Fullscreen iframe */}
      <div
        className="flex-1 relative bg-white"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        {previewUrl ? (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: "white" }}
            title="Mirror Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : previewCode ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewCode}
            className="absolute inset-0 w-full h-full border-0"
            style={{ backgroundColor: "white" }}
            title="Mirror Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/50">
            No preview available
          </div>
        )}

        {/* Comment pins */}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="absolute w-6 h-6 -ml-3 -mt-3 z-10"
            style={{ left: comment.x, top: comment.y }}
          >
            <div className="w-6 h-6 rounded-full bg-[#FF6E3C] border-2 border-white shadow-lg flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-white" />
            </div>
          </div>
        ))}

        {/* Comment hint - shows initially */}
        {showCommentHint && !commentPosition && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl rounded-full px-4 py-2 flex items-center gap-2 animate-bounce-subtle">
            <MessageCircle className="w-4 h-4 text-[#FF6E3C]" />
            <span className="text-white/80 text-sm">Long press to comment</span>
          </div>
        )}
      </div>

      {/* Top bar - shows on tap */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-all duration-300 ${
          showUI ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 backdrop-blur-xl"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex-1 text-center">
            <h2 className="text-white font-medium text-sm truncate px-4">
              {projectName}
            </h2>
            <p className="text-white/50 text-xs">Mirror Mode</p>
          </div>

          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Bottom hint - shows on tap */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 ${
          showUI ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
          <ChevronDown className="w-4 h-4" />
          <span>Tap anywhere to hide controls</span>
        </div>
      </div>

      {/* Comment bubble overlay */}
      {commentPosition && (
        <CommentBubble
          position={commentPosition}
          onSubmit={handleCommentSubmit}
          onClose={handleCommentClose}
          authorName={userName}
          authorAvatar={userAvatar}
        />
      )}
    </div>
  );
}
