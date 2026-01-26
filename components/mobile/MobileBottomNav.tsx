"use client";

import { LayoutGrid, GitBranch, Plus, Maximize2, Video } from "lucide-react";

export type MobileTab = "feed" | "flow" | "capture" | "mirror";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
  disabled?: boolean;
  showMirror?: boolean;
}

export default function MobileBottomNav({
  activeTab,
  onChange,
  disabled = false,
  showMirror = false,
}: MobileBottomNavProps) {
  const tabs = [
    { id: "feed" as MobileTab, label: "Projects", icon: LayoutGrid },
    { id: "flow" as MobileTab, label: "Flow", icon: GitBranch },
    { id: "capture" as MobileTab, label: "New", icon: Video },
    ...(showMirror ? [{ id: "mirror" as MobileTab, label: "Preview", icon: Maximize2 }] : []),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-zinc-800">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !disabled && onChange(tab.id)}
              disabled={disabled}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${
                disabled ? "opacity-30" : ""
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#FF6E3C]" : "text-zinc-500"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#FF6E3C]" : "text-zinc-500"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
