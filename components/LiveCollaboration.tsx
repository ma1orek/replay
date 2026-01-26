"use client";

import React, { useRef, useEffect, createContext, useContext, useCallback } from "react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider, useStorage, useMutation, useBroadcastEvent, useEventListener, useRoom } from "@/liveblocks.config";
import { LiveCursors } from "./LiveCursors";
import { LiveComments } from "./LiveComments";
import type { BlueprintNodeData, LibraryComponentData } from "@/liveblocks.config";

// Context for live sync API
interface LiveSyncContextType {
  broadcastPositionChange: (nodeId: string, x: number, y: number) => void;
  broadcastSizeChange: (nodeId: string, width: number, height: number) => void;
  broadcastCodeChange: (componentId: string, newCode: string) => void;
  broadcastLibraryChange: (componentId: string, changes: any) => void;
  broadcastLibraryDelete: (componentId: string) => void;
  broadcastLibraryAdd: (component: any) => void;
  isConnected: boolean;
}

const LiveSyncContext = createContext<LiveSyncContextType | null>(null);

export function useLiveSync() {
  return useContext(LiveSyncContext);
}

interface LiveCollaborationProps {
  projectId: string | null;
  isCommentMode: boolean;
  onToggleCommentMode: () => void;
  currentTab: string; // preview, code, flow, etc.
  children: React.ReactNode;
  // Sync handlers for receiving changes from other users
  onBlueprintPositionChange?: (id: string, x: number, y: number) => void;
  onBlueprintSizeChange?: (id: string, width: number, height: number) => void;
  onBlueprintCodeChange?: (id: string, code: string) => void;
  onLibraryComponentChange?: (id: string, data: any) => void;
  onLibraryComponentDelete?: (id: string) => void;
  onLibraryComponentAdd?: (component: any) => void;
}

// Wrapper for Liveblocks collaboration features
export function LiveCollaboration({ 
  projectId, 
  isCommentMode, 
  onToggleCommentMode,
  currentTab,
  children,
  onBlueprintPositionChange,
  onBlueprintSizeChange,
  onBlueprintCodeChange,
  onLibraryComponentChange,
  onLibraryComponentDelete,
  onLibraryComponentAdd,
}: LiveCollaborationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // If no project, just render children without collab features
  if (!projectId) {
    // Provide a no-op context when not connected
    const noopSync: LiveSyncContextType = {
      broadcastPositionChange: () => {},
      broadcastSizeChange: () => {},
      broadcastCodeChange: () => {},
      broadcastLibraryChange: () => {},
      broadcastLibraryDelete: () => {},
      broadcastLibraryAdd: () => {},
      isConnected: false,
    };
    return (
      <LiveSyncContext.Provider value={noopSync}>
        {children}
      </LiveSyncContext.Provider>
    );
  }

  // Room ID based on project
  const roomId = `project-${projectId}`;

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{ 
        cursor: null, 
        selectedElement: null,
        isCommenting: false,
        currentTab: currentTab,
        editingComponentId: null,
      }}
      initialStorage={{
        comments: new LiveList([]),
        blueprintNodes: new LiveMap<string, BlueprintNodeData>(),
        blueprintZoom: new LiveObject({ value: 100 }),
        blueprintOffset: new LiveObject({ x: 0, y: 0 }),
        libraryComponents: new LiveMap<string, LibraryComponentData>(),
      }}
    >
      <LiveCollaborationInner
        containerRef={containerRef}
        isCommentMode={isCommentMode}
        onToggleCommentMode={onToggleCommentMode}
        currentTab={currentTab}
        onBlueprintPositionChange={onBlueprintPositionChange}
        onBlueprintSizeChange={onBlueprintSizeChange}
        onBlueprintCodeChange={onBlueprintCodeChange}
        onLibraryComponentChange={onLibraryComponentChange}
        onLibraryComponentDelete={onLibraryComponentDelete}
        onLibraryComponentAdd={onLibraryComponentAdd}
      >
        {children}
      </LiveCollaborationInner>
    </RoomProvider>
  );
}

// Inner component that has access to Liveblocks hooks
function LiveCollaborationInner({
  containerRef,
  isCommentMode,
  onToggleCommentMode,
  currentTab,
  children,
  onBlueprintPositionChange,
  onBlueprintSizeChange,
  onBlueprintCodeChange,
  onLibraryComponentChange,
  onLibraryComponentDelete,
  onLibraryComponentAdd,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  isCommentMode: boolean;
  onToggleCommentMode: () => void;
  currentTab: string;
  children: React.ReactNode;
  onBlueprintPositionChange?: (id: string, x: number, y: number) => void;
  onBlueprintSizeChange?: (id: string, width: number, height: number) => void;
  onBlueprintCodeChange?: (id: string, code: string) => void;
  onLibraryComponentChange?: (id: string, data: any) => void;
  onLibraryComponentDelete?: (id: string) => void;
  onLibraryComponentAdd?: (component: any) => void;
}) {
  const broadcast = useBroadcastEvent();
  const lastBroadcastRef = useRef<Record<string, number>>({});
  const THROTTLE_MS = 50;

  // Broadcast position change to other users
  const broadcastPositionChange = useCallback((nodeId: string, x: number, y: number) => {
    const now = Date.now();
    const lastBroadcast = lastBroadcastRef.current[`pos-${nodeId}`] || 0;
    
    if (now - lastBroadcast < THROTTLE_MS) return;
    lastBroadcastRef.current[`pos-${nodeId}`] = now;
    
    broadcast({
      type: "BLUEPRINT_POSITION_UPDATED",
      id: nodeId,
      data: { x, y },
    } as any);
  }, [broadcast]);

  // Broadcast size change to other users
  const broadcastSizeChange = useCallback((nodeId: string, width: number, height: number) => {
    const now = Date.now();
    const lastBroadcast = lastBroadcastRef.current[`size-${nodeId}`] || 0;
    
    if (now - lastBroadcast < THROTTLE_MS) return;
    lastBroadcastRef.current[`size-${nodeId}`] = now;
    
    broadcast({
      type: "BLUEPRINT_SIZE_UPDATED",
      id: nodeId,
      data: { width, height },
    } as any);
  }, [broadcast]);

  // Broadcast code change
  const broadcastCodeChange = useCallback((componentId: string, newCode: string) => {
    broadcast({
      type: "BLUEPRINT_CODE_UPDATED",
      id: componentId,
      code: newCode,
    } as any);
  }, [broadcast]);

  // Broadcast library component change
  const broadcastLibraryChange = useCallback((componentId: string, changes: any) => {
    broadcast({
      type: "LIBRARY_COMPONENT_UPDATED",
      id: componentId,
      data: changes,
    } as any);
  }, [broadcast]);

  // Broadcast library delete
  const broadcastLibraryDelete = useCallback((componentId: string) => {
    broadcast({
      type: "LIBRARY_COMPONENT_DELETED",
      id: componentId,
    } as any);
  }, [broadcast]);

  // Broadcast library add
  const broadcastLibraryAdd = useCallback((component: any) => {
    broadcast({
      type: "LIBRARY_COMPONENT_ADDED",
      data: component,
    } as any);
  }, [broadcast]);

  // Listen for broadcast events from other users
  useEventListener(({ event, connectionId }) => {
    const e = event as any;
    
    if (e.type === "BLUEPRINT_POSITION_UPDATED" && onBlueprintPositionChange) {
      onBlueprintPositionChange(e.id, e.data.x, e.data.y);
    }
    
    if (e.type === "BLUEPRINT_SIZE_UPDATED" && onBlueprintSizeChange) {
      onBlueprintSizeChange(e.id, e.data.width, e.data.height);
    }
    
    if (e.type === "BLUEPRINT_CODE_UPDATED" && onBlueprintCodeChange) {
      onBlueprintCodeChange(e.id, e.code);
    }
    
    if (e.type === "LIBRARY_COMPONENT_UPDATED" && onLibraryComponentChange) {
      onLibraryComponentChange(e.id, e.data);
    }
    
    if (e.type === "LIBRARY_COMPONENT_DELETED" && onLibraryComponentDelete) {
      onLibraryComponentDelete(e.id);
    }
    
    if (e.type === "LIBRARY_COMPONENT_ADDED" && onLibraryComponentAdd) {
      onLibraryComponentAdd(e.data);
    }
  });

  // Listen for local events from page.tsx to broadcast to others
  useEffect(() => {
    const handleLocalEvent = (e: CustomEvent) => {
      const { type, ...data } = e.detail;
      
      switch (type) {
        case "BLUEPRINT_POSITION":
          broadcastPositionChange(data.id, data.x, data.y);
          break;
        case "BLUEPRINT_SIZE":
          broadcastSizeChange(data.id, data.width, data.height);
          break;
        case "BLUEPRINT_CODE":
          broadcastCodeChange(data.id, data.code);
          break;
        case "LIBRARY_CHANGE":
          broadcastLibraryChange(data.id, data.changes);
          break;
        case "LIBRARY_DELETE":
          broadcastLibraryDelete(data.id);
          break;
        case "LIBRARY_ADD":
          broadcastLibraryAdd(data.component);
          break;
      }
    };
    
    window.addEventListener("live-sync" as any, handleLocalEvent as any);
    return () => window.removeEventListener("live-sync" as any, handleLocalEvent as any);
  }, [broadcastPositionChange, broadcastSizeChange, broadcastCodeChange, broadcastLibraryChange, broadcastLibraryDelete, broadcastLibraryAdd]);

  // Sync context value
  const syncValue: LiveSyncContextType = {
    broadcastPositionChange,
    broadcastSizeChange,
    broadcastCodeChange,
    broadcastLibraryChange,
    broadcastLibraryDelete,
    broadcastLibraryAdd,
    isConnected: true,
  };

  return (
    <LiveSyncContext.Provider value={syncValue}>
      <div ref={containerRef} className="relative w-full h-full">
        {/* Multiplayer Cursors - filtered by current tab */}
        <LiveCursors currentTab={currentTab} />
        
        {/* Comments Layer */}
        <LiveComments 
          isCommentMode={isCommentMode}
          onToggleCommentMode={onToggleCommentMode}
          containerRef={containerRef as React.RefObject<HTMLElement>}
          currentTab={currentTab}
        />
        
        {/* Main Content */}
        {children}
      </div>
    </LiveSyncContext.Provider>
  );
}

// Simple wrapper when you just want cursors without comments
export function LiveCursorsOnly({ 
  projectId, 
  children,
  currentTab 
}: { 
  projectId: string | null; 
  children: React.ReactNode;
  currentTab?: string;
}) {
  // Provide a no-op context when not connected
  const noopSync: LiveSyncContextType = {
    broadcastPositionChange: () => {},
    broadcastSizeChange: () => {},
    broadcastCodeChange: () => {},
    broadcastLibraryChange: () => {},
    broadcastLibraryDelete: () => {},
    broadcastLibraryAdd: () => {},
    isConnected: false,
  };

  if (!projectId) {
    return (
      <LiveSyncContext.Provider value={noopSync}>
        {children}
      </LiveSyncContext.Provider>
    );
  }

  const roomId = `project-${projectId}`;

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{ 
        cursor: null, 
        selectedElement: null,
        isCommenting: false,
        currentTab: undefined,
        editingComponentId: null,
      }}
      initialStorage={{
        comments: new LiveList([]),
        blueprintNodes: new LiveMap<string, BlueprintNodeData>(),
        blueprintZoom: new LiveObject({ value: 100 }),
        blueprintOffset: new LiveObject({ x: 0, y: 0 }),
        libraryComponents: new LiveMap<string, LibraryComponentData>(),
      }}
    >
      <LiveSyncContext.Provider value={noopSync}>
        <LiveCursors currentTab={currentTab} />
        {children}
      </LiveSyncContext.Provider>
    </RoomProvider>
  );
}

// ============================================
// Helper functions to broadcast changes from anywhere
// These dispatch custom events that LiveCollaboration listens to
// ============================================

export function broadcastBlueprintPosition(id: string, x: number, y: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("live-sync", {
    detail: { type: "BLUEPRINT_POSITION", id, x, y }
  }));
}

export function broadcastBlueprintSize(id: string, width: number, height: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("live-sync", {
    detail: { type: "BLUEPRINT_SIZE", id, width, height }
  }));
}

export function broadcastBlueprintCode(id: string, code: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("live-sync", {
    detail: { type: "BLUEPRINT_CODE", id, code }
  }));
}

export function broadcastLibraryComponentChange(id: string, changes: any) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("live-sync", {
    detail: { type: "LIBRARY_CHANGE", id, changes }
  }));
}

export function broadcastLibraryComponentDelete(id: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("live-sync", {
    detail: { type: "LIBRARY_DELETE", id }
  }));
}

export function broadcastLibraryComponentAdd(component: any) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("live-sync", {
    detail: { type: "LIBRARY_ADD", component }
  }));
}
