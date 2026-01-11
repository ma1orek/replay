"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import { Copy, Check, Download, Code2, Eye, Maximize2, ExternalLink, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodePreviewProps {
  code: string;
  isStreaming?: boolean;
}

export default function CodePreview({ code, isStreaming = false }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"code" | "preview" | "split">("split");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  const lineCount = useMemo(() => code.split("\n").length, [code]);
  
  // Create blob URL for iframe preview
  const previewUrl = useMemo(() => {
    if (!code || !code.includes("<html")) return null;
    const blob = new Blob([code], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [code]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-ui.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  const handleFeedback = (type: "like" | "dislike") => {
    setFeedback(type);
    if (type === "dislike") {
      setShowFeedbackInput(true);
    } else {
      setShowFeedbackInput(false);
      // Here you would typically send the feedback to your backend
      console.log("Feedback recorded:", type);
    }
  };

  return (
    <motion.div 
      layout
      className={cn(
        "flex flex-col h-full bg-surface-1 rounded-xl border border-border-subtle overflow-hidden",
        isFullscreen && "fixed inset-4 z-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-2 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-surface-3 rounded-lg p-0.5">
            <button
              onClick={() => setView("code")}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-colors",
                view === "code" ? "bg-surface-4 text-text-primary" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("split")}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-colors",
                view === "split" ? "bg-surface-4 text-text-primary" : "text-text-secondary hover:text-text-primary"
              )}
            >
              Split
            </button>
            <button
              onClick={() => setView("preview")}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-colors",
                view === "preview" ? "bg-surface-4 text-text-primary" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <span className="text-xs text-text-muted">
            {lineCount} lines {isStreaming && <span className="text-neural-cyan animate-pulse">• streaming...</span>}
          </span>
        </div>

        <div className="flex items-center gap-1">
           {/* Feedback Buttons */}
           <div className="flex items-center gap-1 mr-2 border-r border-border-subtle pr-2">
            <button 
              onClick={() => handleFeedback("like")} 
              className={cn(
                "p-1.5 hover:bg-surface-3 rounded transition-colors",
                feedback === "like" ? "text-green-500" : "text-text-secondary"
              )}
              title="Good generation"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleFeedback("dislike")} 
              className={cn(
                "p-1.5 hover:bg-surface-3 rounded transition-colors",
                feedback === "dislike" ? "text-red-500" : "text-text-secondary"
              )}
              title="Bad generation"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button onClick={handleCopy} className="p-1.5 hover:bg-surface-3 rounded transition-colors" title="Copy">
            {copied ? <Check className="w-4 h-4 text-neural-green" /> : <Copy className="w-4 h-4 text-text-secondary" />}
          </button>
          <button onClick={handleDownload} className="p-1.5 hover:bg-surface-3 rounded transition-colors" title="Download HTML">
            <Download className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={openInNewTab} className="p-1.5 hover:bg-surface-3 rounded transition-colors" title="Open in new tab">
            <ExternalLink className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-surface-3 rounded transition-colors" title="Fullscreen">
            <Maximize2 className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Code Panel */}
        {(view === "code" || view === "split") && (
          <div className={cn("overflow-auto", view === "split" ? "w-1/2 border-r border-border-subtle" : "w-full")}>
            <Highlight theme={themes.nightOwl} code={code} language="html">
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre 
                  className={cn(className, "p-3 text-xs leading-relaxed")} 
                  style={{ ...style, background: "transparent", margin: 0 }}
                >
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })} className="table-row">
                      <span className="table-cell pr-3 text-right text-text-muted select-none w-8 text-[10px]">
                        {i + 1}
                      </span>
                      <span className="table-cell">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
        )}

        {/* Preview Panel */}
        {(view === "preview" || view === "split") && (
          <div className={cn("bg-white", view === "split" ? "w-1/2" : "w-full")}>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <p className="text-sm">Waiting for valid HTML...</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback Input Popup */}
        {showFeedbackInput && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 right-2 z-20 bg-surface-2 border border-border-subtle rounded-xl p-3 shadow-xl w-64"
          >
            <div className="flex items-center gap-2 mb-2 text-text-primary text-xs font-medium">
              <MessageSquare className="w-3 h-3 text-red-500" />
              What went wrong?
            </div>
            <textarea 
              className="w-full bg-surface-3 border border-border-subtle rounded-lg p-2 text-xs text-text-primary focus:outline-none focus:border-red-500/50 mb-2"
              rows={3}
              placeholder="Layout broken, wrong colors..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowFeedbackInput(false)}
                className="px-2 py-1 text-[10px] text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowFeedbackInput(false);
                  console.log("Feedback details sent");
                  // Add logic to send details
                }}
                className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 bg-black/80 -z-10" onClick={() => setIsFullscreen(false)} />
      )}
    </motion.div>
  );
}
