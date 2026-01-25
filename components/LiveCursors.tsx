"use client";

import React, { useEffect, useCallback, memo, useState } from "react";
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
  
  // Listen for mouse events from iframe (preview)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'IFRAME_MOUSE_MOVE') {
        // Find the preview iframe - it's the main one with srcDoc
        const iframes = document.querySelectorAll('iframe[title="Preview"]');
        const iframe = iframes[0] as HTMLIFrameElement | null;
        
        if (iframe) {
          const rect = iframe.getBoundingClientRect();
          // Add iframe offset to get position relative to window
          updateMyPresence({
            cursor: { 
              x: Math.round(rect.left + event.data.x), 
              y: Math.round(rect.top + event.data.y) 
            },
          });
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [updateMyPresence]);

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

// Online users indicator - AvatarGroup style with hover animation
export function OnlineUsers() {
  const others = useOthers();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  if (others.length === 0) return null;
  
  const maxVisible = 4;
  const size = 28;
  const overlap = 10;
  const visibleUsers = others.slice(0, maxVisible);
  const extraCount = others.length - maxVisible;

  return (
    <div className="flex items-center">
      <div className="flex">
        {visibleUsers.map(({ connectionId, info }, idx) => {
          const color = info?.color || getCursorColor(String(connectionId));
          const name = info?.name || `User ${connectionId}`;
          const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const avatar = info?.avatar;
          const isHovered = hoveredIdx === idx;
          
          return (
            <div
              key={connectionId}
              className="relative rounded-full bg-[#141414] border-2 border-[#141414]"
              style={{
                width: size,
                height: size,
                zIndex: isHovered ? 100 : visibleUsers.length - idx,
                marginLeft: idx === 0 ? 0 : -overlap,
                transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), z-index 0s",
                transform: isHovered ? "translateY(-6px)" : "translateY(0)",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-[8px] font-medium text-white overflow-hidden"
                style={{ backgroundColor: color }}
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  initials
                )}
              </div>
              {/* Animated tooltip on hover */}
              <div
                className="absolute left-1/2 px-2 py-0.5 bg-zinc-800 text-white text-[10px] font-medium rounded whitespace-nowrap pointer-events-none border border-zinc-700"
                style={{
                  top: -26,
                  transform: `translateX(-50%) scale(${isHovered ? 1 : 0.8})`,
                  opacity: isHovered ? 1 : 0,
                  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {name}
              </div>
            </div>
          );
        })}
        {extraCount > 0 && (
          <div
            className="flex items-center justify-center bg-zinc-700 text-zinc-300 font-semibold border-2 border-[#141414] rounded-full"
            style={{
              width: size,
              height: size,
              marginLeft: -overlap,
              zIndex: 0,
              fontSize: size * 0.32,
            }}
          >
            +{extraCount}
          </div>
        )}
      </div>
    </div>
  );
}
