"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Briefcase, 
  Heart, 
  Landmark, 
  Sparkles,
  ChevronDown,
  Info,
  Scan
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ENTERPRISE_PRESETS, 
  EnterprisePreset 
} from "@/lib/enterprise-presets";

interface PresetSelectorProps {
  selectedPresetId: string | null;
  onSelect: (preset: EnterprisePreset) => void;
  compact?: boolean;
  disabled?: boolean;
}

// Special handling for auto-detect preset
const getPresetIcon = (preset: EnterprisePreset) => {
  if (preset.id === "auto-detect") return Scan;
  return INDUSTRY_ICONS[preset.industry];
};

const getPresetColor = (preset: EnterprisePreset) => {
  if (preset.id === "auto-detect") return "from-emerald-500 to-cyan-600";
  return INDUSTRY_COLORS[preset.industry];
};

const INDUSTRY_ICONS: Record<string, typeof Building2> = {
  financial: Building2,
  saas: Briefcase,
  healthcare: Heart,
  government: Landmark,
  technology: Briefcase,
};

const INDUSTRY_COLORS: Record<string, string> = {
  financial: "from-blue-500 to-blue-700",
  saas: "from-violet-500 to-purple-700",
  healthcare: "from-teal-500 to-emerald-700",
  government: "from-slate-500 to-slate-700",
  technology: "from-zinc-500 to-zinc-700",
};

export function EnterprisePresetSelector({ 
  selectedPresetId, 
  onSelect, 
  compact = false,
  disabled = false
}: PresetSelectorProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  
  const selectedPreset = ENTERPRISE_PRESETS.find(p => p.id === selectedPresetId);
  
  if (compact && selectedPreset) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setExpanded(!expanded)}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all",
            "bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
              getPresetColor(selectedPreset)
            )}>
              {(() => {
                const Icon = getPresetIcon(selectedPreset);
                return <Icon className="w-4 h-4 text-white" />;
              })()}
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-white">{selectedPreset.name}</p>
              <p className="text-[10px] text-zinc-500">{selectedPreset.industry}</p>
            </div>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-zinc-500 transition-transform",
            expanded && "rotate-180"
          )} />
        </button>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pt-2 max-h-[280px] overflow-y-auto">
                {ENTERPRISE_PRESETS.map((preset) => {
                  const Icon = getPresetIcon(preset);
                  const isSelected = preset.id === selectedPresetId;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onSelect(preset);
                        setExpanded(false);
                      }}
                      disabled={disabled}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors text-left",
                        isSelected 
                          ? "bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)]/30" 
                          : "hover:bg-white/[0.03]",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                        getPresetColor(preset)
                      )}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-xs font-medium",
                            isSelected ? "text-[var(--accent-orange)]" : "text-white/80"
                          )}>
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-[var(--accent-orange)]/20 text-[var(--accent-orange)]">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/40 line-clamp-1">{preset.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" />
        <h3 className="text-sm font-medium text-white">Design System Preset</h3>
      </div>
      
      {/* Preset List - matching Creative style */}
      <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
        {ENTERPRISE_PRESETS.map((preset) => {
          const Icon = getPresetIcon(preset);
          const isSelected = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-colors text-left",
                isSelected 
                  ? "bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)]/30" 
                  : "hover:bg-white/[0.03] border border-transparent",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                getPresetColor(preset)
              )}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-[var(--accent-orange)]" : "text-white/90"
                  )}>
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--accent-orange)]/20 text-[var(--accent-orange)]">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-white/40 line-clamp-1">{preset.description}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-300/80 leading-relaxed">
          Design presets apply modern styling to your legacy application. 
          The original content, structure, and functionality are preserved exactly.
        </p>
      </div>
    </div>
  );
}

// Removed unused PresetCard component - now using inline list items

// Export standalone compact version for sidebar
export function PresetBadge({ presetId }: { presetId: string | null }) {
  const preset = ENTERPRISE_PRESETS.find(p => p.id === presetId);
  
  if (!preset) {
    return (
      <span className="px-2 py-1 rounded-md bg-white/[0.03] text-[10px] text-zinc-500">
        No preset selected
      </span>
    );
  }
  
  const Icon = getPresetIcon(preset);
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium",
      "bg-gradient-to-r",
      preset.id === "auto-detect" && "from-emerald-500/10 to-cyan-600/10 text-emerald-400",
      preset.industry === "financial" && preset.id !== "auto-detect" && "from-blue-500/10 to-blue-600/10 text-blue-400",
      preset.industry === "saas" && preset.id !== "auto-detect" && "from-violet-500/10 to-purple-600/10 text-violet-400",
      preset.industry === "healthcare" && preset.id !== "auto-detect" && "from-teal-500/10 to-emerald-600/10 text-teal-400",
      preset.industry === "government" && preset.id !== "auto-detect" && "from-slate-500/10 to-slate-600/10 text-slate-400",
      preset.industry === "technology" && preset.id !== "auto-detect" && "from-zinc-500/10 to-zinc-600/10 text-zinc-400"
    )}>
      <Icon className="w-3 h-3" />
      {preset.name}
    </span>
  );
}
