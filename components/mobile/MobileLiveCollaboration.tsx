"use client";

import React from "react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "@/liveblocks.config";
import type { BlueprintNodeData, LibraryComponentData } from "@/liveblocks.config";

interface MobileLiveCollaborationProps {
  projectId: string | null;
  children: React.ReactNode;
}

/**
 * Mobile-specific Liveblocks wrapper.
 * Provides real-time collaboration context for mobile components.
 * 
 * Mobile users have limited capabilities:
 * - Can view content
 * - Can add comments (via long-press)
 * - Cannot edit components or blueprints
 */
export function MobileLiveCollaboration({ 
  projectId, 
  children,
}: MobileLiveCollaborationProps) {
  // If no project, just render children without collab features
  if (!projectId) {
    return <>{children}</>;
  }

  // Room ID based on project - same as desktop
  const roomId = `project-${projectId}`;

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{ 
        cursor: null, 
        selectedElement: null,
        isCommenting: false,
        currentTab: "mobile-mirror",
        editingComponentId: null,
        // Mobile users cannot edit, only comment
        canEdit: false,
        isOwner: false,
      }}
      initialStorage={{
        comments: new LiveList([]),
        blueprintNodes: new LiveMap<string, BlueprintNodeData>(),
        blueprintZoom: new LiveObject({ value: 100 }),
        blueprintOffset: new LiveObject({ x: 0, y: 0 }),
        libraryComponents: new LiveMap<string, LibraryComponentData>(),
      }}
    >
      {children}
    </RoomProvider>
  );
}
