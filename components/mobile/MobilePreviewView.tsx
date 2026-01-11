"use client";

import { useState } from "react";
import { Share2, Check, ExternalLink, Smartphone, Monitor, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobilePreviewViewProps {
  previewUrl: string | null;
  isProcessing: boolean;
  processingProgress: number;
  processingMessage: string;
  onShare?: () => void;
  projectName: string;
}

export default function MobilePreviewView({
  previewUrl,
  isProcessing,
  processingProgress,
  processingMessage,
  onShare,
  projectName
}: MobilePreviewViewProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      setShowShareModal(true);
    }
  };
  
  const handleCopyLink = async () => {
    const link = `https://replay.build/p/${projectName.toLowerCase().replace(/\s+/g, "-")}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  
  // Processing state
  if (isProcessing || !previewUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black">
        {/* Scanning animation */}
        <div className="relative w-48 h-48 mb-8">
          {/* Grid background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,110,60,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,110,60,0.5) 1px, transparent 1px)
              `,
              backgroundSize: "24px 24px"
            }}
          />
          
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FF6E3C]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF6E3C]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FF6E3C]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FF6E3C]" />
          
          {/* Laser line */}
          <motion.div
            className="absolute left-0 right-0 h-0.5"
            style={{ 
              background: "linear-gradient(90deg, transparent, #FF6E3C, transparent)",
              boxShadow: "0 0 20px #FF6E3C"
            }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Center pulse */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-16 h-16 rounded-xl bg-[#FF6E3C]/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-[#FF6E3C]/40" />
            </div>
          </motion.div>
        </div>
        
        {/* Progress info */}
        <div className="w-full max-w-xs">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C]"
              initial={{ width: 0 }}
              animate={{ width: `${processingProgress}%` }}
            />
          </div>
          
          <motion.p
            key={processingMessage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/50 text-sm text-center font-mono"
          >
            {processingMessage || "Analyzing..."}
          </motion.p>
        </div>
      </div>
    );
  }
  
  // Preview state - fullscreen
  return (
    <div className="flex-1 relative bg-white">
      {/* Fullscreen iframe */}
      <iframe
        src={previewUrl}
        className="absolute inset-0 w-full h-full border-0"
        title="Preview"
      />
      
      {/* Floating share button */}
      <button
        onClick={handleShare}
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl z-10"
      >
        <Share2 className="w-5 h-5 text-white" />
      </button>
      
      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 p-6 pb-10"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
              
              {/* Icon */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-[#FF6E3C]" />
                </div>
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="w-6 h-6 text-white/30" />
                </motion.div>
                <div className="w-14 h-14 rounded-2xl bg-[#FF6E3C]/20 flex items-center justify-center">
                  <Monitor className="w-7 h-7 text-[#FF6E3C]" />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Project Synced! 🚀</h3>
                <p className="text-white/50 text-sm">
                  Open <span className="text-[#FF6E3C]">replay.build</span> on desktop to edit code and export.
                </p>
              </div>
              
              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-4 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-xl text-white font-bold flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      Copy Share Link
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-3 text-white/50 text-sm"
                >
                  Continue on Mobile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
