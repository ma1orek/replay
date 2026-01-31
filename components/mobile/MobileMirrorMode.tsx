"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, MessageCircle, Send, Monitor, Share2, Check, Loader2, Copy } from "lucide-react";

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
  onCodeUpdate?: (newCode: string) => void;
  onPublish?: () => Promise<string | null>;
  publishedUrl?: string | null;
  isPublishing?: boolean;
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
  onCodeUpdate,
  onPublish,
  publishedUrl,
  isPublishing = false,
}: MobileMirrorModeProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showPCBanner, setShowPCBanner] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [localPublishedUrl, setLocalPublishedUrl] = useState<string | null>(publishedUrl || null);
  const [isLocalPublishing, setIsLocalPublishing] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle comment submit
  const handleCommentSubmit = useCallback(() => {
    if (!commentText.trim() || !onAddComment) return;
    
    onAddComment({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      text: commentText.trim(),
    });
    
    setCommentText("");
    setShowCommentInput(false);
  }, [commentText, onAddComment]);

  // Handle share/publish
  const handleShare = useCallback(async () => {
    if (localPublishedUrl) {
      // Already published - copy link with share API or clipboard
      try {
        if (navigator.share) {
          await navigator.share({
            title: projectName || "My Replay Project",
            text: "Check out my UI I created with Replay!",
            url: localPublishedUrl,
          });
        } else {
          await navigator.clipboard.writeText(localPublishedUrl);
          setShowShareSuccess(true);
          setTimeout(() => setShowShareSuccess(false), 2500);
        }
      } catch (error) {
        // If share was cancelled, just copy to clipboard
        await navigator.clipboard.writeText(localPublishedUrl);
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2500);
      }
      return;
    }
    
    if (!onPublish) return;
    
    setIsLocalPublishing(true);
    try {
      const url = await onPublish();
      if (url) {
        setLocalPublishedUrl(url);
        // Try native share, fallback to clipboard
        try {
          if (navigator.share) {
            await navigator.share({
              title: projectName || "My Replay Project",
              text: "Check out my UI I created with Replay!",
              url: url,
            });
          } else {
            await navigator.clipboard.writeText(url);
            setShowShareSuccess(true);
            setTimeout(() => setShowShareSuccess(false), 2500);
          }
        } catch {
          await navigator.clipboard.writeText(url);
          setShowShareSuccess(true);
          setTimeout(() => setShowShareSuccess(false), 2500);
        }
      }
    } catch (error) {
      console.error("Publish error:", error);
    } finally {
      setIsLocalPublishing(false);
    }
  }, [localPublishedUrl, onPublish, projectName]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Fullscreen iframe - takes whole screen */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-white"
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

        {/* Comment pins overlay */}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="absolute w-6 h-6 -ml-3 -mt-3 z-10 pointer-events-none"
            style={{ left: comment.x, top: comment.y }}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom sticky bar - Back left, actions right */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/50"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        {/* Left - Back button */}
        <button
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 touch-manipulation active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
          <span className="text-sm font-medium text-zinc-200">Back</span>
        </button>
        
        {/* Right - Comment, Share, Monitor */}
        <div className="flex items-center gap-2">
          {/* Comment */}
          <button
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCommentInput(true);
            }}
            className="w-11 h-11 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
          >
            <MessageCircle className="w-5 h-5 text-zinc-300" />
          </button>
          
          {/* Share */}
          <button
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare();
            }}
            disabled={isLocalPublishing || isPublishing}
            className="w-11 h-11 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center touch-manipulation active:scale-95 transition-transform disabled:opacity-50"
          >
            {isLocalPublishing || isPublishing ? (
              <Loader2 className="w-5 h-5 text-zinc-300 animate-spin" />
            ) : showShareSuccess ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Share2 className="w-5 h-5 text-zinc-300" />
            )}
          </button>
          
          {/* Desktop features */}
          <button
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPCBanner(true);
            }}
            className="w-11 h-11 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
          >
            <Monitor className="w-5 h-5 text-zinc-300" />
          </button>
        </div>
      </div>
      
      {/* Share success toast */}
      {showShareSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-medium flex items-center gap-2 shadow-lg">
          <Copy className="w-4 h-4" />
          Link copied!
        </div>
      )}

      {/* Comment Input Modal */}
      {showCommentInput && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onPointerUp={(e) => {
            if (e.target === e.currentTarget) {
              setShowCommentInput(false);
              setCommentText("");
            }
          }}
        >
          <div className="w-full bg-zinc-900 rounded-t-2xl border-t border-zinc-800 p-4 pb-8">
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            
            <div className="flex items-center gap-2 mb-3">
              {userAvatar ? (
                <img src={userAvatar} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-sm text-zinc-400 font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-zinc-400">{userName}</span>
            </div>
            
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full h-24 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-600"
              autoFocus
            />
            
            <button
              onPointerUp={(e) => {
                e.preventDefault();
                handleCommentSubmit();
              }}
              disabled={!commentText.trim()}
              className="w-full mt-3 py-3 rounded-xl bg-white text-black font-medium text-sm disabled:opacity-30 touch-manipulation active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Post Comment
            </button>
          </div>
        </div>
      )}

      {/* PC Features Banner */}
      {showPCBanner && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onPointerUp={(e) => {
            if (e.target === e.currentTarget) {
              setShowPCBanner(false);
            }
          }}
        >
          <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Full Editor on Desktop</h3>
                  <p className="text-xs text-zinc-500">More features available on PC</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                Design System generation
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                Component Blueprints workshop
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                Product Flow visualization
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                Code editor with AI
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                Documentation export
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                Real-time collaboration
              </div>
            </div>
            
            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800">
              <button
                onPointerUp={(e) => {
                  e.preventDefault();
                  setShowPCBanner(false);
                }}
                className="w-full py-3 rounded-xl bg-zinc-800 text-white font-medium text-sm touch-manipulation active:scale-[0.98] transition-transform"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
