"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, X, Send, Check, Trash2 } from "lucide-react";
import { useSelf, useStorage, useMutation } from "@/liveblocks.config";
import type { StoredComment } from "@/liveblocks.config";

interface LiveCommentsProps {
  isCommentMode: boolean;
  onToggleCommentMode: () => void;
  containerRef: React.RefObject<HTMLElement>;
}

export function LiveComments({ isCommentMode, onToggleCommentMode, containerRef }: LiveCommentsProps) {
  const self = useSelf();
  
  // Get comments from Liveblocks Storage
  const comments = useStorage((root) => root.comments) || [];
  
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [newCommentPosition, setNewCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mutation to add a comment
  const addComment = useMutation(({ storage }, comment: StoredComment) => {
    const comments = storage.get("comments");
    comments.push(comment);
  }, []);

  // Mutation to add a reply
  const addReply = useMutation(({ storage }, { commentId, reply }: { commentId: string; reply: StoredComment["replies"][0] }) => {
    const comments = storage.get("comments");
    const arr = comments.toArray();
    const index = arr.findIndex((c) => c.id === commentId);
    if (index !== -1) {
      const comment = arr[index];
      const newReplies = [...comment.replies, reply];
      comments.set(index, { ...comment, replies: newReplies });
    }
  }, []);

  // Mutation to toggle resolve
  const toggleResolve = useMutation(({ storage }, commentId: string) => {
    const comments = storage.get("comments");
    const arr = comments.toArray();
    const index = arr.findIndex((c) => c.id === commentId);
    if (index !== -1) {
      const comment = arr[index];
      comments.set(index, { ...comment, resolved: !comment.resolved });
    }
  }, []);

  // Mutation to delete comment
  const deleteComment = useMutation(({ storage }, commentId: string) => {
    const comments = storage.get("comments");
    const arr = comments.toArray();
    const index = arr.findIndex((c) => c.id === commentId);
    if (index !== -1) {
      comments.delete(index);
    }
  }, []);

  // Handle canvas click in comment mode
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isCommentMode) return;
    if ((e.target as HTMLElement).closest('[data-comment]')) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNewCommentPosition({ x, y });
    setActiveComment(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isCommentMode, containerRef]);

  // Add new comment
  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim() || !newCommentPosition) return;
    
    const authorId = self?.id || `guest-${Date.now()}`;
    const authorName = self?.info?.name || "Guest";
    const authorColor = self?.info?.color || "#8B5CF6";
    const authorAvatar = self?.info?.avatar;
    
    const newComment: StoredComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      x: newCommentPosition.x,
      y: newCommentPosition.y,
      text: newCommentText.trim(),
      authorId,
      authorName,
      authorAvatar,
      authorColor,
      timestamp: Date.now(),
      resolved: false,
      replies: [],
    };
    
    addComment(newComment);
    setNewCommentText("");
    setNewCommentPosition(null);
    setActiveComment(newComment.id);
  }, [newCommentText, newCommentPosition, self, addComment]);

  // Add reply
  const handleAddReply = useCallback((commentId: string) => {
    if (!replyText.trim()) return;
    
    const authorId = self?.id || `guest-${Date.now()}`;
    const authorName = self?.info?.name || "Guest";
    const authorColor = self?.info?.color || "#8B5CF6";
    const authorAvatar = self?.info?.avatar;
    
    const reply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text: replyText.trim(),
      authorId,
      authorName,
      authorAvatar,
      authorColor,
      timestamp: Date.now(),
    };
    
    addReply({ commentId, reply });
    setReplyText("");
  }, [replyText, self, addReply]);

  // Handle resolve
  const handleResolve = useCallback((commentId: string) => {
    toggleResolve(commentId);
  }, [toggleResolve]);

  // Handle delete
  const handleDelete = useCallback((commentId: string) => {
    deleteComment(commentId);
    setActiveComment(null);
  }, [deleteComment]);

  // ESC closes active comment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveComment(null);
        setNewCommentPosition(null);
        if (isCommentMode) onToggleCommentMode();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommentMode, onToggleCommentMode]);

  // Format time
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* Comment mode overlay */}
      {isCommentMode && (
        <div 
          className="absolute inset-0 z-40 cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ background: "rgba(0, 0, 0, 0.15)" }}
        >
          {/* Hint - dark theme matching tool */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800 text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-2 border border-zinc-700">
            <MessageCircle size={16} className="text-zinc-400" />
            Click anywhere to add a comment
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleCommentMode(); }}
              className="ml-2 p-1 hover:bg-zinc-700 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Existing comments - pins */}
      {comments.map((comment) => (
        <div
          key={comment.id}
          data-comment
          className="absolute z-50"
          style={{ left: comment.x, top: comment.y }}
        >
          {/* Pin */}
          <button
            onClick={() => setActiveComment(activeComment === comment.id ? null : comment.id)}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
              transition-all shadow-lg hover:scale-110
              ${comment.resolved ? "opacity-50" : ""}
              ${activeComment === comment.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]" : ""}
            `}
            style={{ backgroundColor: comment.authorColor }}
          >
            {comment.resolved ? <Check size={14} /> : comment.replies.length + 1}
          </button>

          {/* Expanded comment - dark theme */}
          {activeComment === comment.id && (
            <div 
              className="absolute left-10 top-0 w-80 bg-[#1a1a1a] rounded-xl shadow-2xl border border-zinc-700/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-zinc-700/50">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: comment.authorColor }}
                  >
                    {comment.authorAvatar ? (
                      <img src={comment.authorAvatar} className="w-full h-full rounded-full" />
                    ) : (
                      comment.authorName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{comment.authorName}</div>
                    <div className="text-xs text-zinc-500">{formatTime(comment.timestamp)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleResolve(comment.id)}
                    className={`p-1.5 rounded hover:bg-zinc-700 transition-colors ${comment.resolved ? "text-emerald-400" : "text-zinc-500"}`}
                    title={comment.resolved ? "Unresolve" : "Resolve"}
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Comment text */}
              <div className={`p-3 text-sm text-zinc-300 ${comment.resolved ? "line-through opacity-50" : ""}`}>
                {comment.text}
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="border-t border-zinc-700/50">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="p-3 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: reply.authorColor }}
                        >
                          {reply.authorName.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-zinc-400">{reply.authorName}</span>
                        <span className="text-xs text-zinc-600">{formatTime(reply.timestamp)}</span>
                      </div>
                      <div className="text-sm text-zinc-400 pl-7">{reply.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              <div className="p-3 border-t border-zinc-700/50 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                  placeholder="Reply..."
                  className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
                />
                <button
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* New comment popup */}
      {newCommentPosition && (
        <div 
          className="absolute z-50"
          style={{ left: newCommentPosition.x, top: newCommentPosition.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* New comment pin */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white animate-pulse"
            style={{ backgroundColor: self?.info?.color || "#8B5CF6" }}
          >
            <MessageCircle size={16} />
          </div>

          {/* Input - dark theme */}
          <div className="absolute left-10 top-0 w-80 bg-[#1a1a1a] rounded-xl shadow-2xl border border-zinc-700/50 overflow-hidden">
            <div className="p-4">
              <textarea
                ref={inputRef}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Add a comment..."
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-500 resize-none focus:outline-none focus:border-zinc-600"
                rows={3}
                autoFocus
              />
            </div>
            <div className="px-4 pb-4 flex justify-between items-center">
              <button
                onClick={() => setNewCommentPosition(null)}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newCommentText.trim()}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <Send size={12} />
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Comment mode toggle button - round icon only
export function CommentModeToggle({ 
  isActive, 
  onClick,
  commentCount = 0 
}: { 
  isActive: boolean; 
  onClick: () => void;
  commentCount?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-9 h-9 flex items-center justify-center rounded-full transition-all
        ${isActive 
          ? "bg-zinc-700 text-white" 
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
        }
      `}
      title="Toggle Comment Mode (C)"
    >
      <MessageCircle size={18} />
      {commentCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center bg-zinc-600 text-white">
          {commentCount}
        </span>
      )}
    </button>
  );
}
