"use client";

import { useState, useEffect } from "react";
import MobileMirrorMode from "./MobileMirrorMode";

// Loading messages
const STREAMING_MESSAGES = [
  "Analyzing content...",
  "Reconstructing UI...",
  "Generating code...",
  "Applying styles...",
  "Finalizing...",
];

interface MobilePreviewViewProps {
  previewUrl: string | null;
  previewCode?: string | null;
  isProcessing: boolean;
  processingProgress: number;
  processingMessage: string;
  projectName: string;
  projectId?: string | null;
  onAddComment?: (comment: { x: number; y: number; text: string }) => void;
  comments?: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    authorName: string;
    authorAvatar?: string;
    timestamp: number;
  }>;
  userName?: string;
  userAvatar?: string;
}

export default function MobilePreviewView({
  previewUrl,
  previewCode,
  isProcessing,
  processingProgress,
  processingMessage,
  projectName,
  projectId,
  onAddComment,
  comments = [],
  userName = "You",
  userAvatar,
}: MobilePreviewViewProps) {
  const [currentMessage, setCurrentMessage] = useState(STREAMING_MESSAGES[0]);
  const [isMessageTransitioning, setIsMessageTransitioning] = useState(false);
  
  // Rotate messages during processing
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
  
  // Processing state - loading skeleton
  if (isProcessing || (!previewUrl && !previewCode)) {
    return (
      <div className="flex-1 flex flex-col bg-[#050505] items-center justify-center p-6">
        {/* Loading indicator */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-pulse" viewBox="0 0 82 109" fill="currentColor">
              <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" />
              <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" />
            </svg>
          </div>
          {/* Progress ring */}
          <svg className="absolute inset-0 w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="#27272a"
              strokeWidth="2"
            />
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeDasharray={`${(processingProgress / 100) * 188} 188`}
              strokeLinecap="round"
            />
          </svg>
        </div>
        
        {/* Status message */}
        <p className={`text-sm text-zinc-400 text-center transition-all duration-300 ${
          isMessageTransitioning ? 'opacity-0' : 'opacity-100'
        }`}>
          {processingMessage || currentMessage}
        </p>
        
        <p className="text-xs text-zinc-600 mt-2">
          Keep app open
        </p>
      </div>
    );
  }
  
  // Preview ready - show fullscreen mirror mode directly
  return (
    <MobileMirrorMode
      previewUrl={previewUrl}
      previewCode={previewCode || null}
      projectName={projectName}
      projectId={projectId}
      onClose={() => {}} // No-op, handled by bottom nav
      onAddComment={onAddComment}
      comments={comments}
      userName={userName}
      userAvatar={userAvatar}
    />
  );
}
