"use client";

import React, { useEffect, useCallback, memo } from "react";
import { useOthers, useUpdateMyPresence } from "@/liveblocks.config";

// Kursor SVG (styl Figma)
const CursorIcon = memo(({ color }: { color: string }) => (
  <svg
    width="24"
    height="36"
    viewBox="0 0 24 36"
    fill="none"
    className="drop-shadow-lg"
    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
  >
    <path
      d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19709L15.2116 1.19709L5.65376 12.3673Z"
      fill={color}
      stroke="white"
      strokeWidth="1"
    />
  </svg>
));
CursorIcon.displayName = "CursorIcon";

// Pojedynczy kursor innego usera
const Cursor = memo(({ 
  x, 
  y, 
  color, 
  name, 
  avatar 
}: { 
  x: number; 
  y: number; 
  color: string; 
  name: string;
  avatar?: string;
}) => (
  <div
    className="pointer-events-none fixed left-0 top-0 z-[9999]"
    style={{
      transform: `translate(${x}px, ${y}px)`,
      transition: "transform 0.1s ease-out",
    }}
  >
    <CursorIcon color={color} />
    
    {/* Etykieta z imieniem (jak w Figmie) */}
    <div
      className="absolute left-5 top-4 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-white whitespace-nowrap shadow-lg"
      style={{ backgroundColor: color }}
    >
      {avatar && (
        <img 
          src={avatar} 
          alt={name} 
          className="w-4 h-4 rounded-full border border-white/30"
        />
      )}
      <span>{name}</span>
    </div>
  </div>
));
Cursor.displayName = "Cursor";

// Główny komponent - renderuje kursory innych userów
export function LiveCursors() {
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  // Śledzenie ruchu myszki
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      updateMyPresence({
        cursor: { x: Math.round(e.clientX), y: Math.round(e.clientY) },
      });
    },
    [updateMyPresence]
  );

  // Myszka opuściła okno
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

  // Renderowanie kursorów innych userów
  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        if (!presence?.cursor) return null;

        return (
          <Cursor
            key={connectionId}
            x={presence.cursor.x}
            y={presence.cursor.y}
            color={info?.color || "#FF6E3C"}
            name={info?.name || `User ${connectionId}`}
            avatar={info?.avatar}
          />
        );
      })}
    </>
  );
}

// Hook do pokazywania liczby userów online
export function useOnlineUsers() {
  const others = useOthers();
  return others.length;
}

// Komponent pokazujący avatary userów online (do header)
export function OnlineUsers() {
  const others = useOthers();

  if (others.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      {others.slice(0, 5).map(({ connectionId, info }) => (
        <div
          key={connectionId}
          className="relative group"
        >
          <div
            className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center text-xs font-bold text-white overflow-hidden"
            style={{ backgroundColor: info?.color || "#FF6E3C" }}
            title={info?.name || `User ${connectionId}`}
          >
            {info?.avatar ? (
              <img src={info.avatar} alt={info.name} className="w-full h-full object-cover" />
            ) : (
              info?.name?.charAt(0).toUpperCase() || "?"
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {info?.name || `User ${connectionId}`}
          </div>
        </div>
      ))}
      
      {others.length > 5 && (
        <div className="w-7 h-7 rounded-full border-2 border-[#1a1a1a] bg-white/10 flex items-center justify-center text-xs font-medium text-white/70">
          +{others.length - 5}
        </div>
      )}
    </div>
  );
}
