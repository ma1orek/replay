"use client";

import React, { useEffect, useCallback, memo } from "react";
import { useOthers, useUpdateMyPresence } from "@/liveblocks.config";

// Subtler cursor colors matching app theme
const CURSOR_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet  
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#ef4444", // Red
];

function getCursorColor(id: string): string {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

// Minimal cursor SVG - clean arrow style
const CursorIcon = memo(({ color }: { color: string }) => (
  <svg
    width="16"
    height="20"
    viewBox="0 0 16 20"
    fill="none"
    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
  >
    <path
      d="M0.5 0.5L15 7.5L8 9L5.5 19L0.5 0.5Z"
      fill={color}
      stroke="#1a1a1a"
      strokeWidth="1"
    />
  </svg>
));
CursorIcon.displayName = "CursorIcon";

// Single cursor - minimal style, just name label
const Cursor = memo(({ 
  x, 
  y, 
  color, 
  name 
}: { 
  x: number; 
  y: number; 
  color: string; 
  name: string;
}) => (
  <div
    className="pointer-events-none fixed left-0 top-0 z-[9999]"
    style={{
      transform: `translate(${x}px, ${y}px)`,
      transition: "transform 50ms linear",
    }}
  >
    <CursorIcon color={color} />
    
    {/* Name label - minimal dark style */}
    <div
      className="absolute left-4 top-4 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
      style={{ 
        backgroundColor: color,
        color: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
      }}
    >
      {name}
    </div>
  </div>
));
Cursor.displayName = "Cursor";

// Main component - renders other users' cursors
export function LiveCursors() {
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  // Track mouse movement
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      updateMyPresence({
        cursor: { x: Math.round(e.clientX), y: Math.round(e.clientY) },
      });
    },
    [updateMyPresence]
  );

  // Mouse left window
  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [handlePointerMove, handlePointerLeave]);

  // Render other users' cursors
  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        if (!presence?.cursor) return null;

        const color = info?.color || getCursorColor(String(connectionId));
        const name = info?.name || `User ${connectionId}`;

        return (
          <Cursor
            key={connectionId}
            x={presence.cursor.x}
            y={presence.cursor.y}
            color={color}
            name={name}
          />
        );
      })}
    </>
  );
}

// Hook to get online users count
export function useOnlineUsers() {
  const others = useOthers();
  return others.length;
}

// Online users avatars for header - minimal style
export function OnlineUsers() {
  const others = useOthers();

  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {/* User count badge */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-zinc-300 font-medium">
          {others.length} online
        </span>
      </div>
      
      {/* User initials */}
      <div className="flex -space-x-1.5">
        {others.slice(0, 3).map(({ connectionId, info }) => {
          const color = info?.color || getCursorColor(String(connectionId));
          return (
            <div
              key={connectionId}
              className="w-6 h-6 rounded-full border-2 border-[#141414] flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: color }}
              title={info?.name || `User ${connectionId}`}
            >
              {info?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          );
        })}
        
        {others.length > 3 && (
          <div className="w-6 h-6 rounded-full border-2 border-[#141414] bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-300">
            +{others.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
