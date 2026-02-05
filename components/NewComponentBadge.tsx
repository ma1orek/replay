"use client";

import * as React from "react";
import { useState } from "react";
import { 
  Sparkles, 
  Save, 
  FolderOpen,
  Loader2,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocalComponent, ComponentLayer } from "@/types/design-system";

interface NewComponentBadgeProps {
  /** The local component data */
  component: LocalComponent;
  /** Design system ID to save to */
  designSystemId: string | null;
  /** Generation ID (source of the component) */
  generationId: string;
  /** Callback when component is saved to library */
  onSaveToLibrary?: (component: LocalComponent) => void;
  /** Callback when user chooses to keep in project only */
  onKeepInProject?: (component: LocalComponent) => void;
  /** Additional class names */
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

/**
 * NewComponentBadge Component
 * 
 * Displays a badge for newly generated components that haven't been saved
 * to the Design System library yet. Provides options to save or keep local.
 */
export function NewComponentBadge({
  component,
  designSystemId,
  generationId,
  onSaveToLibrary,
  onKeepInProject,
  className,
  compact = false,
}: NewComponentBadgeProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Don't show if already saved
  if (component.savedToLibrary || !component.isNew) {
    return null;
  }

  // Handle save to library
  const handleSaveToLibrary = async () => {
    if (!designSystemId) {
      setErrorMessage("No Design System selected");
      setSaveStatus('error');
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus('idle');
      setErrorMessage(null);

      const response = await fetch(`/api/design-systems/${designSystemId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          componentId: component.id,
          name: component.name,
          code: component.code,
          layer: component.layer || 'components',
          category: component.category,
          variants: component.variants,
          props: component.props,
          docs: component.docs,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSaveStatus('success');
      onSaveToLibrary?.({ ...component, savedToLibrary: true });
    } catch (err: any) {
      console.error('[NewComponentBadge] Save error:', err);
      setErrorMessage(err.message);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keep in project
  const handleKeepInProject = () => {
    onKeepInProject?.(component);
  };

  // Compact mode - just the badge
  if (compact) {
    return (
      <span 
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
          "bg-orange-500/20 text-orange-400 border border-orange-500/30",
          className
        )}
        title="New component - not yet saved to Design System"
      >
        <Sparkles className="w-3 h-3" />
        NEW
      </span>
    );
  }

  // Success state
  if (saveStatus === 'success') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-emerald-500/10 border border-emerald-500/20",
        className
      )}>
        <Check className="w-4 h-4 text-emerald-400" />
        <span className="text-emerald-400 text-sm">Saved to Library</span>
      </div>
    );
  }

  // Full card mode
  return (
    <div className={cn(
      "rounded-xl border border-orange-500/30 bg-orange-500/5 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-orange-500/20">
        <Sparkles className="w-4 h-4 text-orange-400" />
        <span className="text-orange-400 font-medium text-sm">New Component</span>
        <span className="text-zinc-400 text-xs ml-auto">{component.name}</span>
      </div>

      {/* Error Message */}
      {saveStatus === 'error' && errorMessage && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <X className="w-3 h-3" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 p-3">
        {designSystemId ? (
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Saving...' : 'Save to Library'}
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 bg-zinc-800/50">
            <FolderOpen className="w-4 h-4" />
            Select a Design System first
          </div>
        )}

        <button
          onClick={handleKeepInProject}
          disabled={isSaving}
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          title="Keep in this project only"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Inline badge for component list items
 */
export function NewComponentInlineBadge({ className }: { className?: string }) {
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
        "bg-orange-500/20 text-orange-400",
        className
      )}
    >
      <Sparkles className="w-2.5 h-2.5" />
      NEW
    </span>
  );
}

export default NewComponentBadge;
