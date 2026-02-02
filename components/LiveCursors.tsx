"use client";

import React, { useEffect, useCallback, memo, useState } from "react";
import { useOthers, useUpdateMyPresence, useSelf, useBroadcastEvent, useEventListener } from "@/liveblocks.config";
import { Eye, Edit3, Shield, ShieldCheck, ShieldX } from "lucide-react";

// Cursor colors - MUST match liveblocks-auth/route.ts
const CURSOR_COLORS = [
  "#E57373", "#9575CD", "#4FC3F7", "#81C784", 
  "#FFB74D", "#F06292", "#4DB6AC", "#7986CB",
];

function getCursorColor(id: string): string {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

// Tab label mapping for display
const TAB_LABELS: Record<string, string> = {
  preview: "Preview",
  code: "Code",
  flow: "Flow",
  blueprints: "Editor",
  library: "Library",
};

// Hook to check if current user can edit
export function useCanEdit() {
  const self = useSelf();
  return self?.presence?.canEdit === true || self?.presence?.isOwner === true;
}

// Hook to check if current user is owner
export function useIsOwner() {
  const self = useSelf();
  return self?.presence?.isOwner === true;
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

// Main component - renders other users' cursors (filtered by current tab)
export function LiveCursors({ currentTab }: { currentTab?: string }) {
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  const self = useSelf();

  // Update my current tab in presence
  useEffect(() => {
    if (currentTab) {
      updateMyPresence({ currentTab });
    }
  }, [currentTab, updateMyPresence]);

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

  // Filter others to only show users on the SAME tab
  const othersOnSameTab = others.filter(({ presence }) => {
    // If no currentTab specified, show all
    if (!currentTab) return true;
    // Show only users on the same tab
    return presence?.currentTab === currentTab;
  });

  // Render other users' cursors (only those on same tab)
  return (
    <>
      {othersOnSameTab.map(({ connectionId, presence, info }) => {
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
// Shows which tab each user is on, and allows owner to grant/revoke edit access
export function OnlineUsers() {
  const others = useOthers();
  const self = useSelf();
  const broadcast = useBroadcastEvent();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null);
  
  const isOwner = self?.presence?.isOwner === true;
  
  // Listen for access change events
  useEventListener(({ event }) => {
    const e = event as any;
    if (e.type === "GRANT_EDIT_ACCESS" || e.type === "REVOKE_EDIT_ACCESS") {
      // Access changes are handled via presence updates
    }
  });
  
  const handleToggleAccess = (userId: string, currentCanEdit: boolean) => {
    if (!isOwner) return;
    
    const eventType = currentCanEdit ? "REVOKE_EDIT_ACCESS" : "GRANT_EDIT_ACCESS";
    broadcast({ type: eventType, targetUserId: userId } as any);
    setMenuOpenIdx(null);
  };
  
  if (others.length === 0) return null;
  
  const maxVisible = 4;
  const size = 28;
  const overlap = 10;
  const visibleUsers = others.slice(0, maxVisible);
  const extraCount = others.length - maxVisible;

  return (
    <div className="flex items-center">
      <div className="flex">
        {visibleUsers.map(({ connectionId, info, presence, id }, idx) => {
          const color = info?.color || getCursorColor(String(connectionId));
          const name = info?.name || `User ${connectionId}`;
          const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const avatar = info?.avatar;
          const isHovered = hoveredIdx === idx;
          const isMenuOpen = menuOpenIdx === idx;
          const userTab = presence?.currentTab;
          const tabLabel = userTab ? TAB_LABELS[userTab] || userTab : null;
          const canEdit = presence?.canEdit === true;
          const userIsOwner = presence?.isOwner === true;
          
          return (
            <div
              key={connectionId}
              className="relative rounded-full bg-[#141414] border-2 border-[#141414]"
              style={{
                width: size,
                height: size,
                zIndex: isHovered || isMenuOpen ? 100 : visibleUsers.length - idx,
                marginLeft: idx === 0 ? 0 : -overlap,
                transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), z-index 0s",
                transform: isHovered || isMenuOpen ? "translateY(-6px)" : "translateY(0)",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => { setHoveredIdx(null); if (!isMenuOpen) setMenuOpenIdx(null); }}
              onClick={() => isOwner && !userIsOwner && setMenuOpenIdx(isMenuOpen ? null : idx)}
            >
              <div
                className={`w-full h-full rounded-full flex items-center justify-center text-[7px] font-medium text-white overflow-hidden ${isOwner && !userIsOwner ? 'cursor-pointer' : ''}`}
                style={{ backgroundColor: color }}
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  initials
                )}
              </div>
              
              {/* Access indicator badge */}
              <div 
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] border border-[#141414] ${
                  userIsOwner ? 'bg-amber-500' : canEdit ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
                title={userIsOwner ? 'Owner' : canEdit ? 'Can edit' : 'View only'}
              >
                {userIsOwner ? (
                  <Shield size={8} className="text-white" />
                ) : canEdit ? (
                  <Edit3 size={8} className="text-white" />
                ) : (
                  <Eye size={8} className="text-white" />
                )}
              </div>
              
              {/* Tooltip on hover */}
              <div
                className="absolute left-1/2 px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] font-medium rounded-md whitespace-nowrap pointer-events-none border border-zinc-700/50 flex flex-col items-center"
                style={{
                  top: 36,
                  transform: `translateX(-50%) scale(${isHovered && !isMenuOpen ? 1 : 0.8})`,
                  opacity: isHovered && !isMenuOpen ? 1 : 0,
                  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <span>{name}</span>
                <span className="text-[9px] text-zinc-500">
                  {userIsOwner ? 'Owner' : canEdit ? 'Can edit' : 'View only'}
                  {tabLabel && ` • in ${tabLabel}`}
                </span>
              </div>
              
              {/* Access menu for owner - click to toggle */}
              {isOwner && !userIsOwner && isMenuOpen && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 bg-zinc-900 rounded-lg shadow-xl border border-zinc-700/50 overflow-hidden"
                  style={{ top: 36, minWidth: 140 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-zinc-700/50">
                    <div className="text-[11px] font-medium text-white truncate">{name}</div>
                    <div className="text-[9px] text-zinc-500">
                      {canEdit ? 'Can edit' : 'View only'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAccess(id, canEdit)}
                    className={`w-full px-3 py-2 text-[11px] font-medium flex items-center gap-2 transition-colors ${
                      canEdit 
                        ? 'text-red-400 hover:bg-red-500/10' 
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {canEdit ? (
                      <>
                        <ShieldX size={12} />
                        Revoke edit access
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={12} />
                        Grant edit access
                      </>
                    )}
                  </button>
                </div>
              )}
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
