"use client";

import { motion } from "framer-motion";
import { Sliders, Eye } from "lucide-react";

interface FloatingIslandProps {
  activeTab: "configure" | "preview";
  onChange: (tab: "configure" | "preview") => void;
  disabled?: boolean;
}

export default function FloatingIsland({ activeTab, onChange, disabled }: FloatingIslandProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl"
    >
      {/* Active pill indicator */}
      <motion.div
        className="absolute top-1.5 bottom-1.5 rounded-full bg-[#FF6E3C]"
        layoutId="activeTab"
        initial={false}
        animate={{
          left: activeTab === "configure" ? "6px" : "calc(50% + 2px)",
          width: "calc(50% - 8px)"
        }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
      
      {/* Configure tab */}
      <button
        onClick={() => !disabled && onChange("configure")}
        disabled={disabled}
        className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors ${
          activeTab === "configure" ? "text-white" : "text-white/50"
        }`}
      >
        <Sliders className="w-4 h-4" />
        <span className="text-sm font-medium">Configure</span>
      </button>
      
      {/* Preview tab */}
      <button
        onClick={() => !disabled && onChange("preview")}
        disabled={disabled}
        className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors ${
          activeTab === "preview" ? "text-white" : "text-white/50"
        }`}
      >
        <Eye className="w-4 h-4" />
        <span className="text-sm font-medium">Preview</span>
      </button>
    </motion.div>
  );
}
