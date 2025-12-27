"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Film,
  Plus
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { Flow } from "@/types";

interface FlowLibraryProps {
  flows: Flow[];
  selectedId: string | null;
  onSelect: (flow: Flow) => void;
  onDelete: (id: string) => void;
  onNewFlow: () => void;
}

const statusConfig = {
  recording: { icon: Loader2, color: "text-red-400", animate: true },
  processing: { icon: Loader2, color: "text-accent-primary", animate: true },
  ready: { icon: CheckCircle2, color: "text-neural-green", animate: false },
  error: { icon: AlertCircle, color: "text-red-400", animate: false },
};

export default function FlowLibrary({
  flows,
  selectedId,
  onSelect,
  onDelete,
  onNewFlow,
}: FlowLibraryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-accent-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Recorded Flows</h2>
          <span className="px-2 py-0.5 bg-surface-3 rounded-full text-xs text-text-muted">
            {flows.length}
          </span>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewFlow}
          className="p-1.5 hover:bg-surface-3 rounded-lg transition-colors"
          title="New recording"
        >
          <Plus className="w-4 h-4 text-text-secondary" />
        </motion.button>
      </div>

      {/* Flow List */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {flows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mb-4">
                <Film className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-sm text-text-secondary mb-1">No recordings yet</p>
              <p className="text-xs text-text-muted">
                Start recording to capture a flow
              </p>
            </motion.div>
          ) : (
            flows.map((flow, index) => {
              const StatusIcon = statusConfig[flow.status].icon;
              const isSelected = selectedId === flow.id;
              const isHovered = hoveredId === flow.id;

              return (
                <motion.div
                  key={flow.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredId(flow.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelect(flow)}
                  className={cn(
                    "relative group p-3 rounded-xl cursor-pointer transition-all",
                    "border border-transparent",
                    isSelected 
                      ? "bg-accent-glow border-accent-primary" 
                      : "hover:bg-surface-3"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className={cn(
                      "w-14 h-10 rounded-lg overflow-hidden flex-shrink-0",
                      "bg-surface-4 flex items-center justify-center"
                    )}>
                      {flow.thumbnail ? (
                        <img 
                          src={flow.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Play className="w-4 h-4 text-text-muted" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {flow.name}
                        </p>
                        <StatusIcon className={cn(
                          "w-3.5 h-3.5 flex-shrink-0",
                          statusConfig[flow.status].color,
                          statusConfig[flow.status].animate && "animate-spin"
                        )} />
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-text-muted" />
                        <span className="text-xs text-text-muted">
                          {formatDuration(flow.duration)}
                        </span>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs text-text-muted">
                          {new Date(flow.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(flow.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-surface-4 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-red-400" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}



