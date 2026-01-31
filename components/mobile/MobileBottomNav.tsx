"use client";

import { LayoutGrid, Plus, Eye } from "lucide-react";

export type MobileTab = "feed" | "capture" | "preview";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
  disabled?: boolean;
  hasPreview?: boolean;
}

export default function MobileBottomNav({
  activeTab,
  onChange,
  disabled = false,
  hasPreview = false,
}: MobileBottomNavProps) {
  // Only 2 tabs: Projects + (New or Preview)
  const tabs = hasPreview
    ? [
        { id: "feed" as MobileTab, label: "Projects", icon: LayoutGrid },
        { id: "preview" as MobileTab, label: "Preview", icon: Eye },
      ]
    : [
        { id: "feed" as MobileTab, label: "Projects", icon: LayoutGrid },
        { id: "capture" as MobileTab, label: "New", icon: Plus },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-zinc-800/50">
      <div className="flex items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onPointerUp={(e) => {
                e.preventDefault();
                if (!disabled) onChange(tab.id);
              }}
              disabled={disabled}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors touch-manipulation active:scale-95 ${
                disabled ? "opacity-30" : ""
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-zinc-600"}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-white" : "text-zinc-600"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[#0a0a0a]" />
    </div>
  );
}
