"use client";

import { Sliders, Eye } from "lucide-react";

interface FloatingIslandProps {
  activeTab: "configure" | "preview";
  onChange: (tab: "configure" | "preview") => void;
  disabled?: boolean;
}

export default function FloatingIsland({ activeTab, onChange, disabled }: FloatingIslandProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Configure tab */}
      <button
        onClick={() => !disabled && onChange("configure")}
        disabled={disabled}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors ${
          activeTab === "configure" 
            ? "bg-[#FF6E3C] text-white" 
            : "text-white/50"
        }`}
      >
        <Sliders className="w-4 h-4" />
        <span className="text-sm font-medium">Configure</span>
      </button>
      
      {/* Preview tab */}
      <button
        onClick={() => !disabled && onChange("preview")}
        disabled={disabled}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors ${
          activeTab === "preview" 
            ? "bg-[#FF6E3C] text-white" 
            : "text-white/50"
        }`}
      >
        <Eye className="w-4 h-4" />
        <span className="text-sm font-medium">Preview</span>
      </button>
    </div>
  );
}
