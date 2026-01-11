"use client";

import { useState, useEffect } from "react";
import { Share2, Check, ExternalLink, Smartphone, Monitor, ArrowRight, X } from "lucide-react";

// Loading messages - same as desktop
const STREAMING_MESSAGES = [
  "Reconstructing user interface...",
  "Building visual components...",
  "Rendering pixel-perfect layout...",
  "Assembling responsive design...",
  "Crafting interactive elements...",
  "Applying style treatments...",
  "Polishing animations...",
  "Optimizing visual hierarchy...",
  "Finalizing preview render...",
  "Adding finishing touches...",
];

const GENERATION_TIPS = [
  "Click, don't just watch. Interacting helps the engine differentiate functional elements from static containers.",
  "Hover states matter. Move your cursor over buttons and links to capture their hover effects.",
  "Scroll to the bottom. Hidden sections and lazy-loaded content need to be visible in the recording.",
  "Show all states. Toggle dropdowns, modals, and accordions during recording.",
  "Record at 1x speed. Faster playback can miss subtle transitions and animations.",
];

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
  const [currentMessage, setCurrentMessage] = useState(STREAMING_MESSAGES[0]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isMessageTransitioning, setIsMessageTransitioning] = useState(false);
  const [isTipTransitioning, setIsTipTransitioning] = useState(false);
  
  // Rotate messages - same as desktop
  useEffect(() => {
    if (!isProcessing) return;
    
    const interval = setInterval(() => {
      setIsMessageTransitioning(true);
      setTimeout(() => {
        setCurrentMessage(prev => {
          const currentIndex = STREAMING_MESSAGES.indexOf(prev);
          return STREAMING_MESSAGES[(currentIndex + 1) % STREAMING_MESSAGES.length];
        });
        setIsMessageTransitioning(false);
      }, 300);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isProcessing]);
  
  // Rotate tips - same as desktop
  useEffect(() => {
    if (!isProcessing) return;
    
    const interval = setInterval(() => {
      setIsTipTransitioning(true);
      setTimeout(() => {
        setCurrentTipIndex(prev => (prev + 1) % GENERATION_TIPS.length);
        setIsTipTransitioning(false);
      }, 300);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isProcessing]);
  
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
  
  // Processing state - SAME skeleton as desktop
  if (isProcessing || !previewUrl) {
    return (
      <div className="w-full h-full flex flex-col bg-[#050505] overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          
          {/* Skeleton UI with Logo in Center - SAME AS DESKTOP */}
          <div className="w-full max-w-md relative">
            {/* Centered Logo with Gradient Sweep */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="relative">
                {/* Animated Glow */}
                <div 
                  className="absolute inset-0 blur-2xl bg-[#FF6E3C]/30 scale-[2]" 
                  style={{ animation: "glow-pulse 2s ease-in-out infinite" }} 
                />
                {/* Logo with gradient sweep */}
                <div className="logo-loader-container relative">
                  <svg className="logo-loader-svg" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" />
                    <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" />
                  </svg>
                  <div className="logo-loader-gradient" />
                </div>
              </div>
            </div>
            
            {/* Skeleton Frame */}
            <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-black/40 opacity-50">
              {/* Skeleton Header */}
              <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.06]">
                <div className="w-5 h-5 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite" }} />
                <div className="w-20 h-2.5 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.1s" }} />
                <div className="flex-1" />
                <div className="flex gap-2">
                  <div className="w-12 h-5 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.2s" }} />
                  <div className="w-12 h-5 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.3s" }} />
                </div>
              </div>
              
              {/* Skeleton Body */}
              <div className="flex min-h-[180px]">
                {/* Sidebar - hidden on very small screens */}
                <div className="w-28 border-r border-white/[0.06] p-2 space-y-1.5 hidden xs:block">
                  <div className="w-full h-6 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.1s" }} />
                  <div className="w-3/4 h-6 rounded bg-white/[0.03]" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.2s" }} />
                  <div className="w-5/6 h-6 rounded bg-white/[0.03]" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.3s" }} />
                </div>
                
                {/* Main Content */}
                <div className="flex-1 p-3">
                  <div className="w-2/3 h-4 rounded bg-white/5 mb-2" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.1s" }} />
                  <div className="w-1/2 h-2.5 rounded bg-white/[0.03] mb-4" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.2s" }} />
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-lg border border-white/[0.04] p-2 bg-white/[0.02]">
                        <div className="w-6 h-6 rounded bg-white/5 mb-1.5" style={{ animation: `skeleton-pulse 2s ease-in-out infinite ${0.1 * i}s` }} />
                        <div className="w-full h-2 rounded bg-white/5 mb-1" style={{ animation: `skeleton-pulse 2s ease-in-out infinite ${0.1 * i + 0.1}s` }} />
                        <div className="w-2/3 h-1.5 rounded bg-white/[0.03]" style={{ animation: `skeleton-pulse 2s ease-in-out infinite ${0.1 * i + 0.2}s` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Message */}
          <p className={`text-sm text-white/50 mt-5 text-center transition-all duration-300 ease-out ${isMessageTransitioning ? 'opacity-0 translate-y-2 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}>
            {processingMessage || currentMessage}
          </p>
          
          {/* Tip Banner */}
          <div className="w-full max-w-sm mt-3 px-2">
            <p className={`font-mono text-[10px] text-white/35 leading-relaxed text-center transition-all duration-300 ease-out ${isTipTransitioning ? 'opacity-0 -translate-y-1 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}>
              {GENERATION_TIPS[currentTipIndex]}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Preview state - fullscreen iframe
  return (
    <div className="flex-1 relative bg-white">
      {/* Fullscreen iframe - key forces re-render when URL changes */}
      <iframe
        key={previewUrl}
        src={previewUrl}
        className="absolute inset-0 w-full h-full border-0"
        title="Preview"
        sandbox="allow-scripts allow-same-origin"
      />
      
      {/* Floating share button */}
      <button
        onClick={handleShare}
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl z-10"
      >
        <Share2 className="w-5 h-5 text-white" />
      </button>
      
      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div
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
              <ArrowRight className="w-6 h-6 text-white/30" />
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
          </div>
        </div>
      )}
    </div>
  );
}
