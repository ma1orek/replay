"use client";

import { useCallback, useMemo } from "react";
import { useSelf, useStorage, useMutation, useBroadcastEvent } from "@/liveblocks.config";
import type { StoredComment } from "@/liveblocks.config";

const MOBILE_TAB = "mobile-mirror";

export interface MobileComment {
  id: string;
  x: number;
  y: number;
  text: string;
  authorName: string;
  authorAvatar?: string;
  authorColor: string;
  timestamp: number;
  resolved: boolean;
}

export function useMobileComments() {
  const self = useSelf();
  const broadcast = useBroadcastEvent();

  // Get all comments from storage
  const allCommentsRaw = useStorage((root) => root.comments);
  
  // Filter and transform comments for mobile
  const comments: MobileComment[] = useMemo(() => {
    if (!allCommentsRaw) return [];
    
    const arr = Array.isArray(allCommentsRaw) 
      ? allCommentsRaw 
      : (allCommentsRaw as any).toImmutable?.() || [];
    
    // Get all comments (not filtered by tab) for mobile viewing
    // Comments from mobile-mirror tab are specifically for mobile
    return arr.map((c: StoredComment) => ({
      id: c.id,
      x: c.x,
      y: c.y,
      text: c.text,
      authorName: c.authorName,
      authorAvatar: c.authorAvatar,
      authorColor: c.authorColor,
      timestamp: c.timestamp,
      resolved: c.resolved,
    }));
  }, [allCommentsRaw]);

  // Mutation to add a comment
  const addCommentMutation = useMutation(({ storage }, comment: StoredComment) => {
    const comments = storage.get("comments");
    comments.push(comment);
  }, []);

  // Add a new comment from mobile
  const addComment = useCallback((data: { x: number; y: number; text: string }) => {
    const authorId = self?.id || `mobile-guest-${Date.now()}`;
    const authorName = self?.info?.name || "Mobile User";
    const authorColor = self?.info?.color || "#FF6E3C";
    const authorAvatar = self?.info?.avatar;

    const newComment: StoredComment = {
      id: `mobile-comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      x: data.x,
      y: data.y,
      text: data.text,
      authorId,
      authorName,
      authorAvatar,
      authorColor,
      timestamp: Date.now(),
      resolved: false,
      tab: MOBILE_TAB,
      replies: [],
    };

    addCommentMutation(newComment);
    broadcast({ type: "COMMENT_ADDED", comment: newComment } as any);

    return newComment;
  }, [self, addCommentMutation, broadcast]);

  // Get user info for comment attribution
  const userInfo = useMemo(() => ({
    name: self?.info?.name || "Mobile User",
    avatar: self?.info?.avatar,
    color: self?.info?.color || "#FF6E3C",
  }), [self]);

  return {
    comments,
    addComment,
    userInfo,
    isConnected: !!self,
  };
}
