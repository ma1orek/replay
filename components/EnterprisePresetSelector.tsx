"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Briefcase, 
  Heart, 
  Landmark, 
  Check, 
  Sparkles,
  ChevronDown,
  Info,
  Palette,
  BarChart3,
  Table2,
  FileText
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

const INDUSTRY_ICONS = {
  financial: Building2,
  saas: Briefcase,
  healthcare: Heart,
  government: Landmark,
};

const INDUSTRY_COLORS = {
  financial: "from-blue-500 to-blue-700",
  saas: "from-violet-500 to-purple-700",
  healthcare: "from-teal-500 to-emerald-700",
  government: "from-slate-500 to-slate-700",
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
              INDUSTRY_COLORS[selectedPreset.industry]
            )}>
              {(() => {
                const Icon = INDUSTRY_ICONS[selectedPreset.industry];
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
              <div className="grid grid-cols-2 gap-2 pt-2">
                {ENTERPRISE_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={preset.id === selectedPresetId}
                    hovered={hoveredPreset === preset.id}
                    onHover={() => setHoveredPreset(preset.id)}
                    onLeave={() => setHoveredPreset(null)}
                    onSelect={() => {
                      onSelect(preset);
                      setExpanded(false);
                    }}
                    compact={true}
                    disabled={disabled}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[var(--accent-orange)]" />
        <h3 className="text-sm font-medium text-white">Design System Preset</h3>
      </div>
      
      {/* Preset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ENTERPRISE_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            selected={preset.id === selectedPresetId}
            hovered={hoveredPreset === preset.id}
            onHover={() => setHoveredPreset(preset.id)}
            onLeave={() => setHoveredPreset(null)}
            onSelect={() => onSelect(preset)}
            compact={false}
            disabled={disabled}
          />
        ))}
      </div>
      
      {/* Selected Preset Details */}
      <AnimatePresence mode="wait">
        {selectedPreset && (
          <motion.div
            key={selectedPreset.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
          >
            <PresetDetails preset={selectedPreset} />
          </motion.div>
        )}
      </AnimatePresence>
      
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

interface PresetCardProps {
  preset: EnterprisePreset;
  selected: boolean;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
  compact: boolean;
  disabled: boolean;
}

function PresetCard({ 
  preset, 
  selected, 
  hovered,
  onHover, 
  onLeave,
  onSelect, 
  compact,
  disabled 
}: PresetCardProps) {
  const Icon = INDUSTRY_ICONS[preset.industry];
  
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={disabled}
      className={cn(
        "relative group text-left transition-all duration-200",
        compact ? "p-2.5 rounded-lg" : "p-4 rounded-xl",
        "border",
        selected 
          ? "bg-white/[0.06] border-[var(--accent-orange)]/50 ring-1 ring-[var(--accent-orange)]/20"
          : hovered
            ? "bg-white/[0.04] border-white/[0.1]"
            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-[var(--accent-orange)] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
          compact ? "w-8 h-8" : "w-10 h-10",
          INDUSTRY_COLORS[preset.industry]
        )}>
          <Icon className={cn(
            "text-white",
            compact ? "w-4 h-4" : "w-5 h-5"
          )} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium text-white truncate",
            compact ? "text-[11px]" : "text-sm"
          )}>
            {preset.name}
          </h4>
          
          {!compact && (
            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
              {preset.description}
            </p>
          )}
          
          {/* Tags */}
          {!compact && (
            <div className="flex flex-wrap gap-1 mt-2">
              {preset.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.05] text-zinc-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

interface PresetDetailsProps {
  preset: EnterprisePreset;
}

function PresetDetails({ preset }: PresetDetailsProps) {
  const colors = preset.colors.light;
  
  return (
    <div className="space-y-4">
      {/* Color Palette Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-400">Color Palette</span>
        </div>
        <div className="flex gap-1">
          {[
            { color: colors.primary, label: "Primary" },
            { color: colors.secondary, label: "Secondary" },
            { color: colors.accent, label: "Accent" },
            { color: colors.success, label: "Success" },
            { color: colors.warning, label: "Warning" },
            { color: colors.error, label: "Error" },
          ].map((item) => (
            <div
              key={item.label}
              className="group relative flex-1 h-8 rounded-md transition-transform hover:scale-105"
              style={{ backgroundColor: item.color }}
            >
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] text-zinc-500 whitespace-nowrap">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chart Colors */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-400">Chart Colors</span>
        </div>
        <div className="flex gap-1">
          {preset.charts.colors.slice(0, 6).map((color, idx) => (
            <div
              key={idx}
              className="flex-1 h-4 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      
      {/* Component Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Table2 className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-400">Component Style</span>
        </div>
        <div className="flex gap-2">
          {/* Button preview */}
          <div
            className="px-3 py-1.5 text-[10px] font-medium text-white"
            style={{
              backgroundColor: colors.primary,
              borderRadius: preset.components.button.borderRadius,
            }}
          >
            Button
          </div>
          {/* Input preview */}
          <div
            className="px-2 py-1 text-[10px] text-zinc-400 border flex-1"
            style={{
              borderRadius: preset.components.input.borderRadius,
              borderColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            Input field
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] text-zinc-500">
            WCAG {preset.wcagLevel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500">
            {preset.shadcnTheme === "new-york" ? "New York" : "Default"} theme
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500">
            {preset.charts.library}
          </span>
        </div>
      </div>
    </div>
  );
}

// Export standalone compact version for sidebar
export function PresetBadge({ presetId }: { presetId: string | null }) {
  const preset = ENTERPRISE_PRESETS.find(p => p.id === presetId);
  
  if (!preset) {
    return (
      <span className="px-2 py-1 rounded-md bg-white/[0.03] text-[10px] text-zinc-500">
        Auto-Detect
      </span>
    );
  }
  
  const Icon = INDUSTRY_ICONS[preset.industry];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium",
      "bg-gradient-to-r",
      preset.industry === "financial" && "from-blue-500/10 to-blue-600/10 text-blue-400",
      preset.industry === "saas" && "from-violet-500/10 to-purple-600/10 text-violet-400",
      preset.industry === "healthcare" && "from-teal-500/10 to-emerald-600/10 text-teal-400",
      preset.industry === "government" && "from-slate-500/10 to-slate-600/10 text-slate-400"
    )}>
      <Icon className="w-3 h-3" />
      {preset.name}
    </span>
  );
}
