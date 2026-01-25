"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, X, Send, Check, MoreHorizontal, Trash2 } from "lucide-react";
import { useRoom, useSelf } from "@/liveblocks.config";

// Typ komentarza
interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    color: string;
  };
  timestamp: number;
  resolved: boolean;
  replies: {
    id: string;
    text: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
      color: string;
    };
    timestamp: number;
  }[];
}

interface LiveCommentsProps {
  isCommentMode: boolean;
  onToggleCommentMode: () => void;
  containerRef: React.RefObject<HTMLElement>;
}

export function LiveComments({ isCommentMode, onToggleCommentMode, containerRef }: LiveCommentsProps) {
  const room = useRoom();
  const self = useSelf();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [newCommentPosition, setNewCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Kliknięcie na canvas w trybie komentarzy
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isCommentMode) return;
    
    // Ignoruj kliknięcia na istniejące komentarze
    if ((e.target as HTMLElement).closest('[data-comment]')) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNewCommentPosition({ x, y });
    setActiveComment(null);
    
    // Focus na input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isCommentMode, containerRef]);

  // Dodaj nowy komentarz
  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim() || !newCommentPosition || !self) return;
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      x: newCommentPosition.x,
      y: newCommentPosition.y,
      text: newCommentText.trim(),
      author: {
        id: self.id,
        name: self.info?.name || "User",
        avatar: self.info?.avatar,
        color: self.info?.color || "#FF6E3C",
      },
      timestamp: Date.now(),
      resolved: false,
      replies: [],
    };
    
    setComments(prev => [...prev, newComment]);
    setNewCommentText("");
    setNewCommentPosition(null);
    setActiveComment(newComment.id);
    
    // Broadcast do innych (w przyszłości - storage)
    // room.broadcastEvent({ type: "COMMENT_ADDED", comment: newComment });
  }, [newCommentText, newCommentPosition, self]);

  // Dodaj odpowiedź
  const handleAddReply = useCallback((commentId: string) => {
    if (!replyText.trim() || !self) return;
    
    setComments(prev => prev.map(comment => {
      if (comment.id !== commentId) return comment;
      
      return {
        ...comment,
        replies: [...comment.replies, {
          id: `reply-${Date.now()}`,
          text: replyText.trim(),
          author: {
            id: self.id,
            name: self.info?.name || "User",
            avatar: self.info?.avatar,
            color: self.info?.color || "#FF6E3C",
          },
          timestamp: Date.now(),
        }],
      };
    }));
    
    setReplyText("");
  }, [replyText, self]);

  // Rozwiąż komentarz
  const handleResolve = useCallback((commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment
    ));
  }, []);

  // Usuń komentarz
  const handleDelete = useCallback((commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    setActiveComment(null);
  }, []);

  // ESC zamyka aktywny komentarz
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

  // Formatowanie czasu
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      {/* Overlay klikania w trybie komentarzy */}
      {isCommentMode && (
        <div 
          className="absolute inset-0 z-40 cursor-crosshair"
          onClick={handleCanvasClick}
          style={{ background: "rgba(255, 110, 60, 0.02)" }}
        >
          {/* Hint */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#FF6E3C] text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-2">
            <MessageCircle size={16} />
            Click anywhere to add a comment
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleCommentMode(); }}
              className="ml-2 p-1 hover:bg-white/20 rounded"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Istniejące komentarze - pinezki */}
      {comments.map((comment) => (
        <div
          key={comment.id}
          data-comment
          className="absolute z-50"
          style={{ left: comment.x, top: comment.y }}
        >
          {/* Pinezka */}
          <button
            onClick={() => setActiveComment(activeComment === comment.id ? null : comment.id)}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
              transition-all shadow-lg hover:scale-110
              ${comment.resolved ? "opacity-50" : ""}
              ${activeComment === comment.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]" : ""}
            `}
            style={{ backgroundColor: comment.author.color }}
          >
            {comment.resolved ? <Check size={14} /> : comment.replies.length + 1}
          </button>

          {/* Rozwinięty komentarz */}
          {activeComment === comment.id && (
            <div 
              className="absolute left-10 top-0 w-72 bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: comment.author.color }}
                  >
                    {comment.author.avatar ? (
                      <img src={comment.author.avatar} className="w-full h-full rounded-full" />
                    ) : (
                      comment.author.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{comment.author.name}</div>
                    <div className="text-xs text-white/40">{formatTime(comment.timestamp)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleResolve(comment.id)}
                    className={`p-1.5 rounded hover:bg-white/10 ${comment.resolved ? "text-green-400" : "text-white/40"}`}
                    title={comment.resolved ? "Unresolve" : "Resolve"}
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Treść komentarza */}
              <div className={`p-3 text-sm text-white/80 ${comment.resolved ? "line-through opacity-50" : ""}`}>
                {comment.text}
              </div>

              {/* Odpowiedzi */}
              {comment.replies.length > 0 && (
                <div className="border-t border-white/10">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="p-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: reply.author.color }}
                        >
                          {reply.author.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-white/70">{reply.author.name}</span>
                        <span className="text-xs text-white/30">{formatTime(reply.timestamp)}</span>
                      </div>
                      <div className="text-sm text-white/70 pl-7">{reply.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input odpowiedzi */}
              <div className="p-2 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                  placeholder="Reply..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
                />
                <button
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="p-2 bg-[#FF6E3C] text-white rounded-lg hover:bg-[#FF8F5C] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Nowy komentarz - popup */}
      {newCommentPosition && (
        <div 
          className="absolute z-50"
          style={{ left: newCommentPosition.x, top: newCommentPosition.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pinezka nowego komentarza */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white animate-pulse"
            style={{ backgroundColor: self?.info?.color || "#FF6E3C" }}
          >
            <MessageCircle size={16} />
          </div>

          {/* Input */}
          <div className="absolute left-10 top-0 w-72 bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="p-3">
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
                className="w-full bg-transparent text-white text-sm placeholder:text-white/30 resize-none focus:outline-none"
                rows={3}
                autoFocus
              />
            </div>
            <div className="px-3 pb-3 flex justify-between items-center">
              <button
                onClick={() => setNewCommentPosition(null)}
                className="text-xs text-white/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newCommentText.trim()}
                className="px-3 py-1.5 bg-[#FF6E3C] text-white text-sm font-medium rounded-lg hover:bg-[#FF8F5C] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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

// Przycisk do włączania trybu komentarzy
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
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
        ${isActive 
          ? "bg-[#FF6E3C] text-white" 
          : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
        }
      `}
      title="Toggle Comment Mode (C)"
    >
      <MessageCircle size={16} />
      <span className="hidden sm:inline">Comment</span>
      {commentCount > 0 && (
        <span className={`
          min-w-[18px] h-[18px] rounded-full text-xs flex items-center justify-center
          ${isActive ? "bg-white/20" : "bg-[#FF6E3C]/20 text-[#FF6E3C]"}
        `}>
          {commentCount}
        </span>
      )}
    </button>
  );
}
