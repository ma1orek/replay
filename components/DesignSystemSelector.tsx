"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { 
  Check, 
  ChevronDown, 
  Plus, 
  Loader2,
  Star,
  Library,
  Import,
  ExternalLink,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DesignSystemListItem } from "@/types/design-system";

interface DesignSystemSelectorProps {
  /** Currently selected design system ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (designSystemId: string | null) => void;
  /** Callback to create a new design system */
  onCreateNew?: () => void;
  /** Callback to import from Storybook */
  onImportClick?: () => void;
  /** Whether to show "Create New" option */
  showCreateNew?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** External loading state (e.g., when importing) */
  isExternalLoading?: boolean;
  /** External loading text */
  externalLoadingText?: string;
  /** When this value changes, re-fetch design systems */
  refreshTrigger?: number;
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
  onImportClick,
  showCreateNew = true,
  placeholder = "Auto-create new library",
  label = "LIBRARY",
  disabled = false,
  className,
  compact = false,
  isExternalLoading = false,
  externalLoadingText = "Loading...",
  refreshTrigger,
}: DesignSystemSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [designSystems, setDesignSystems] = useState<DesignSystemListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Re-fetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchDesignSystems();
    }
  }, [refreshTrigger, fetchDesignSystems]);

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

  // Filter design systems by search
  const filteredDesignSystems = designSystems.filter(ds => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      ref={dropdownRef} 
      className={cn("w-full max-w-full overflow-hidden", className)}
    >
      {/* Label - matches STYLE label exactly with mb-3 */}
      <div className="flex items-center justify-between mb-3">
        <span className="sidebar-label text-[11px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
          <Library className="w-3.5 h-3.5" /> {label}
        </span>
      </div>
      
      {/* Trigger Button - matches StyleInjector exactly */}
      <button
        type="button"
        onClick={() => !disabled && !isExternalLoading && setIsOpen(!isOpen)}
        disabled={disabled || isExternalLoading}
        className={cn(
          "w-full max-w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors bg-zinc-800/80 border border-zinc-700/50 hover:border-zinc-600/60 box-border",
          isOpen && "border-white/[0.12] bg-white/[0.05]",
          (disabled || isExternalLoading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex-1 min-w-0">
          {isExternalLoading ? (
            <span className="text-sm text-orange-400/80 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {externalLoadingText}
            </span>
          ) : isLoading ? (
            <span className="text-sm text-white/25 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </span>
          ) : selected ? (
            <>
              <span className="text-sm block text-white">{selected.name}</span>
              <span className="text-xs text-white/30 truncate block">
                {selected.component_count} component{selected.component_count !== 1 ? 's' : ''}
                {selected.source_type && ` • from ${selected.source_type}`}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm block text-white">{placeholder}</span>
              <span className="text-xs text-white/30 truncate block">AI extracts from video</span>
            </>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-white/40 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Collapsible Panel - matches StyleInjector behavior */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden w-full max-w-full"
          >
            <div className="border border-zinc-700/50 rounded-xl bg-zinc-800/95 backdrop-blur-xl w-full max-w-full overflow-hidden">
              {/* Search input - always visible */}
              <div className="p-2 border-b border-white/[0.06]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search libraries..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-900/50 border border-zinc-700/30 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
              
              {/* Auto-create option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors",
                  !value && "bg-white/[0.05]"
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {!value && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white block">Auto-create new library</span>
                  <span className="text-xs text-white/30 block">AI extracts from video</span>
                </div>
              </button>

              {/* Import from Storybook Option */}
              {onImportClick && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onImportClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors border-t border-white/[0.06]"
                >
                  <Import className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white block">Import from Storybook</span>
                    <span className="text-xs text-white/30 block">Import existing design system</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/30 flex-shrink-0" />
                </button>
              )}

              {/* Divider */}
              {filteredDesignSystems.length > 0 && (
                <div className="border-t border-white/[0.06]" />
              )}

              {/* Design Systems List */}
              {isLoading ? (
                <div className="px-4 py-6 text-center">
                  <Loader2 className="w-5 h-5 text-zinc-400 animate-spin mx-auto" />
                  <p className="text-zinc-500 text-xs mt-2">Loading libraries...</p>
                </div>
              ) : error ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-red-400 text-xs">{error}</p>
                  <button
                    type="button"
                    onClick={fetchDesignSystems}
                    className="text-white/50 text-xs mt-2 hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredDesignSystems.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {filteredDesignSystems.map((ds) => (
                    <button
                      key={ds.id}
                      type="button"
                      onClick={() => handleSelect(ds)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors",
                        value === ds.id && "bg-white/[0.05]"
                      )}
                    >
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {value === ds.id && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white truncate">{ds.name}</span>
                          {ds.is_default && (
                            <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-white/30">
                          {ds.component_count} component{ds.component_count !== 1 ? 's' : ''}
                          {ds.source_type && ` • from ${ds.source_type}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery && designSystems.length > 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-zinc-500 text-xs">No libraries matching "{searchQuery}"</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

/**
 * Import Library Modal - For importing from Storybook
 */
interface ImportLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string, name: string) => Promise<void>;
}

export function ImportLibraryModal({ 
  isOpen, 
  onClose,
  onImport 
}: ImportLibraryModalProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill name from URL
  useEffect(() => {
    if (url && !name) {
      try {
        const hostname = new URL(url).hostname;
        const extracted = hostname
          .replace(/^(www\.|storybook\.|design\.|designsystem\.)/, "")
          .replace(/\.(com|io|dev|org|net)$/, "")
          .replace(/[.-]/g, " ")
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        if (extracted) setName(extracted + " Design System");
      } catch {}
    }
  }, [url]);

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter a Storybook URL");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      await onImport(url.trim(), name.trim() || "Imported Library");
      onClose();
      setUrl("");
      setName("");
    } catch (err: any) {
      setError(err.message || "Failed to import from Storybook");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Import className="w-5 h-5 text-orange-400" />
                Import from Storybook
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Import components from any Storybook URL
              </p>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* URL input */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Storybook URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://designsystem.example.com/"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  e.g., https://designsystem.solenis.com/
                </p>
              </div>

              {/* Name input */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Library Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Design System"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || !url.trim()}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  "bg-orange-500 text-white hover:bg-orange-600",
                  (isImporting || !url.trim()) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Import className="w-4 h-4" />
                    Import Library
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
