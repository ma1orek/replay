"use client";

import { motion } from "framer-motion";
import { 
  MousePointer2, 
  Layers, 
  Sparkles, 
  FileText,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisPanelProps {
  analysis: {
    interactions: string[];
    components: string[];
    animations: string[];
    dataExtracted: string[];
  } | null;
  isProcessing: boolean;
}

const sections = [
  { key: "interactions", icon: MousePointer2, label: "Interactions", color: "text-neural-cyan" },
  { key: "components", icon: Layers, label: "Components", color: "text-neural-purple" },
  { key: "animations", icon: Sparkles, label: "Animations", color: "text-neural-pink" },
  { key: "dataExtracted", icon: FileText, label: "Extracted Data", color: "text-neural-green" },
];

export default function AnalysisPanel({ analysis, isProcessing }: AnalysisPanelProps) {
  if (!analysis && !isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-sm text-text-secondary">Analysis will appear here</p>
        <p className="text-xs text-text-muted mt-1">after processing your recording</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map(({ key, icon: Icon, label, color }, index) => {
        const items = analysis?.[key as keyof typeof analysis] || [];
        
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("w-4 h-4", color)} />
              <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                {label}
              </span>
              {items.length > 0 && (
                <span className="px-1.5 py-0.5 bg-surface-3 rounded text-[10px] text-text-muted">
                  {items.length}
                </span>
              )}
            </div>
            
            <div className="space-y-1 pl-6">
              {isProcessing && items.length === 0 ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-3 h-3 border-2 border-text-muted border-t-accent-primary rounded-full animate-spin" />
                  <span className="text-xs text-text-muted">Analyzing...</span>
                </div>
              ) : items.length > 0 ? (
                items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + i * 0.05 }}
                    className="flex items-center gap-2 text-xs text-text-secondary py-1"
                  >
                    <CheckCircle className="w-3 h-3 text-neural-green" />
                    <span>{item}</span>
                  </motion.div>
                ))
              ) : (
                <span className="text-xs text-text-muted">None detected</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


