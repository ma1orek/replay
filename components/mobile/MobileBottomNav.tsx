"use client";

import { LayoutGrid, GitBranch, Plus, Maximize2 } from "lucide-react";

export type MobileTab = "feed" | "flow" | "capture" | "mirror";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
  disabled?: boolean;
  showMirror?: boolean; // Only show mirror when there's a preview
}

export default function MobileBottomNav({
  activeTab,
  onChange,
  disabled = false,
  showMirror = false,
}: MobileBottomNavProps) {
  const tabs = [
    {
      id: "feed" as MobileTab,
      label: "Feed",
      icon: LayoutGrid,
      alwaysShow: true,
    },
    {
      id: "flow" as MobileTab,
      label: "Flow",
      icon: GitBranch,
      alwaysShow: true,
    },
    {
      id: "capture" as MobileTab,
      label: "Capture",
      icon: Plus,
      isPrimary: true,
      alwaysShow: true,
    },
    {
      id: "mirror" as MobileTab,
      label: "Mirror",
      icon: Maximize2,
      alwaysShow: false,
    },
  ];

  const visibleTabs = tabs.filter(tab => tab.alwaysShow || (tab.id === "mirror" && showMirror));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isPrimary = tab.isPrimary;

          if (isPrimary) {
            // Center capture button - larger and orange
            return (
              <button
                key={tab.id}
                onClick={() => !disabled && onChange(tab.id)}
                disabled={disabled}
                className="relative -mt-6"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  disabled 
                    ? "bg-white/10 shadow-none" 
                    : isActive
                      ? "bg-[#FF6E3C] shadow-[#FF6E3C]/30"
                      : "bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] shadow-[#FF6E3C]/25"
                }`}>
                  <Icon className={`w-7 h-7 ${disabled ? "text-white/30" : "text-white"}`} />
                </div>
                <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap ${
                  disabled ? "text-white/20" : isActive ? "text-[#FF6E3C]" : "text-white/50"
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => !disabled && onChange(tab.id)}
              disabled={disabled}
              className={`flex flex-col items-center justify-center px-4 py-2 min-w-[64px] transition-colors ${
                disabled ? "opacity-30" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive 
                  ? "bg-white/10" 
                  : "bg-transparent"
              }`}>
                <Icon className={`w-5 h-5 transition-colors ${
                  isActive ? "text-[#FF6E3C]" : "text-white/40"
                }`} />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 transition-colors ${
                isActive ? "text-[#FF6E3C]" : "text-white/40"
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
