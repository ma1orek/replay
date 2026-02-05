"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { 
  Check, 
  ChevronDown, 
  Plus, 
  Palette, 
  Loader2,
  Star,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DesignSystemListItem } from "@/types/design-system";

interface DesignSystemSelectorProps {
  /** Currently selected design system ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (designSystemId: string | null) => void;
  /** Callback to create a new design system */
  onCreateNew?: () => void;
  /** Whether to show "Create New" option */
  showCreateNew?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

/**
 * Design System Selector Component
 * 
 * A dropdown selector for choosing which Design System to use for a project.
 * Displays available design systems with component counts and default indicators.
 */
export function DesignSystemSelector({
  value,
  onChange,
  onCreateNew,
  showCreateNew = true,
  placeholder = "Select Design System",
  disabled = false,
  className,
  compact = false,
}: DesignSystemSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [designSystems, setDesignSystems] = useState<DesignSystemListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Fetch design systems
  const fetchDesignSystems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/design-systems");
      if (!response.ok) {
        throw new Error("Failed to fetch design systems");
      }
      const data = await response.json();
      setDesignSystems(data.designSystems || []);
    } catch (err: any) {
      console.error("[DesignSystemSelector] Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignSystems();
  }, [fetchDesignSystems]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get selected design system
  const selected = value ? designSystems.find(ds => ds.id === value) : null;

  // Handle selection
  const handleSelect = (ds: DesignSystemListItem | null) => {
    onChange(ds?.id || null);
    setIsOpen(false);
  };

  // Handle create new
  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew?.();
  };

  return (
    <div 
      ref={dropdownRef} 
      className={cn("relative", className)}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-xl border transition-all",
          compact 
            ? "px-3 py-2 text-sm" 
            : "px-4 py-3",
          disabled
            ? "bg-zinc-900/50 border-zinc-800 cursor-not-allowed opacity-50"
            : isOpen
              ? "bg-zinc-800/80 border-zinc-600 ring-2 ring-zinc-600/50"
              : "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800/80 hover:border-zinc-600"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />
          ) : selected ? (
            <>
              <Palette className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span className="text-white truncate">{selected.name}</span>
              {selected.is_default && (
                <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
              )}
              <span className="text-zinc-500 text-xs flex-shrink-0">
                ({selected.component_count})
              </span>
            </>
          ) : (
            <>
              <FolderOpen className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-400 truncate">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-zinc-400 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={cn(
            "absolute z-50 w-full mt-2 rounded-xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden",
            "animate-in fade-in-0 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Create New Option */}
          {showCreateNew && onCreateNew && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors border-b border-zinc-800"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-medium">Create New Design System</span>
            </button>
          )}

          {/* No Design System Option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors",
              !value && "bg-zinc-800/30"
            )}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {!value && <Check className="w-4 h-4 text-orange-400" />}
            </div>
            <span className="text-zinc-300">No Design System</span>
            <span className="text-zinc-500 text-xs ml-auto">Start fresh</span>
          </button>

          {/* Divider */}
          {designSystems.length > 0 && (
            <div className="border-t border-zinc-800" />
          )}

          {/* Design Systems List */}
          {isLoading ? (
            <div className="px-4 py-6 text-center">
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin mx-auto" />
              <p className="text-zinc-500 text-sm mt-2">Loading design systems...</p>
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                type="button"
                onClick={fetchDesignSystems}
                className="text-orange-400 text-sm mt-2 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : designSystems.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-zinc-500 text-sm">No design systems yet</p>
              {showCreateNew && onCreateNew && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="text-orange-400 text-sm mt-2 hover:underline"
                >
                  Create your first one
                </button>
              )}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {designSystems.map((ds) => (
                <button
                  key={ds.id}
                  type="button"
                  onClick={() => handleSelect(ds)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors",
                    value === ds.id && "bg-zinc-800/30"
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {value === ds.id && <Check className="w-4 h-4 text-orange-400" />}
                  </div>
                  <Palette className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white truncate">{ds.name}</span>
                      {ds.is_default && (
                        <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs">
                      {ds.component_count} component{ds.component_count !== 1 ? 's' : ''}
                      {ds.source_type && ` • from ${ds.source_type}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to fetch and manage design systems
 */
export function useDesignSystems() {
  const [designSystems, setDesignSystems] = useState<DesignSystemListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await globalThis.fetch("/api/design-systems");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setDesignSystems(data.designSystems || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const getDefault = useCallback(() => {
    return designSystems.find(ds => ds.is_default) || null;
  }, [designSystems]);

  return {
    designSystems,
    isLoading,
    error,
    refetch: fetch,
    getDefault,
  };
}

export default DesignSystemSelector;
