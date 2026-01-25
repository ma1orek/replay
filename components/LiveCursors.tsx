"use client";

import React, { useEffect, useCallback, memo } from "react";
import { useOthers, useUpdateMyPresence } from "@/liveblocks.config";

// Cursor colors matching the design
const CURSOR_COLORS = [
  "#FF6E3C", // Orange
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#6366F1", // Indigo
];

function getCursorColor(id: string): string {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

// Custom cursor shape from kursor.svg - rounded triangle pointer
const CursorIcon = memo(({ color }: { color: string }) => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 23 23" 
    fill="none"
    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
  >
    <path 
      d="M5.88279 9.07156C5.36416 7.13575 7.13585 5.36399 9.07168 5.88268L16.4908 7.87142C19.1531 8.58498 19.0262 12.4049 16.3223 12.9399L13.893 13.4205C13.6542 13.4678 13.468 13.6541 13.4207 13.8929L12.94 16.3222C12.4051 19.0262 8.58505 19.1531 7.87153 16.4907L5.88279 9.07156Z" 
      fill={color} 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
  </svg>
));
CursorIcon.displayName = "CursorIcon";

// Single cursor with pill-shaped name badge
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
    {/* Cursor icon */}
    <CursorIcon color={color} />
    
    {/* Name badge - pill shape, positioned at bottom-right of cursor */}
    <div
      className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold text-white whitespace-nowrap"
      style={{ 
        backgroundColor: color,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
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

// Online users indicator - just colored dots, no count text
export function OnlineUsers() {
  const others = useOthers();

  if (others.length === 0) return null;

  return (
    <div className="flex items-center -space-x-1">
      {others.slice(0, 5).map(({ connectionId, info }) => {
        const color = info?.color || getCursorColor(String(connectionId));
        return (
          <div
            key={connectionId}
            className="w-3 h-3 rounded-full border-2 border-[#141414]"
            style={{ backgroundColor: color }}
            title={info?.name || `User ${connectionId}`}
          />
        );
      })}
      {others.length > 5 && (
        <div className="w-3 h-3 rounded-full border-2 border-[#141414] bg-zinc-600 flex items-center justify-center">
          <span className="text-[6px] text-white font-bold">+</span>
        </div>
      )}
    </div>
  );
}
