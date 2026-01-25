"use client";

import React, { useRef } from "react";
import { RoomProvider } from "@/liveblocks.config";
import { LiveCursors } from "./LiveCursors";
import { LiveComments } from "./LiveComments";

interface LiveCollaborationProps {
  projectId: string | null;
  isCommentMode: boolean;
  onToggleCommentMode: () => void;
  children: React.ReactNode;
}

// Wrapper for Liveblocks collaboration features
export function LiveCollaboration({ 
  projectId, 
  isCommentMode, 
  onToggleCommentMode,
  children 
}: LiveCollaborationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // If no project, just render children without collab features
  if (!projectId) {
    return <>{children}</>;
  }

  // Room ID based on project
  const roomId = `project-${projectId}`;

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{ 
        cursor: null, 
        selectedElement: null,
        isCommenting: false 
      }}
    >
      <div ref={containerRef} className="relative w-full h-full">
        {/* Multiplayer Cursors */}
        <LiveCursors />
        
        {/* Comments Layer */}
        <LiveComments 
          isCommentMode={isCommentMode}
          onToggleCommentMode={onToggleCommentMode}
          containerRef={containerRef as React.RefObject<HTMLElement>}
        />
        
        {/* Main Content */}
        {children}
      </div>
    </RoomProvider>
  );
}

// Simple wrapper when you just want cursors without comments
export function LiveCursorsOnly({ 
  projectId, 
  children 
}: { 
  projectId: string | null; 
  children: React.ReactNode;
}) {
  if (!projectId) {
    return <>{children}</>;
  }

  const roomId = `project-${projectId}`;

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{ 
        cursor: null, 
        selectedElement: null,
        isCommenting: false 
      }}
    >
      <LiveCursors />
      {children}
    </RoomProvider>
  );
}
