"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface VideoCompareProps {
  firstVideo?: string;
  secondVideo?: string;
  className?: string;
  // Labels
  leftLabel?: string;
  rightLabel?: string;
  leftSubtitle?: string;
  rightSubtitle?: string;
  leftCaption?: string;
  rightCaption?: string;
}

export const VideoCompare = ({
  firstVideo = "",
  secondVideo = "",
  className,
  leftLabel = "Before",
  rightLabel = "After",
  leftSubtitle,
  rightSubtitle,
  leftCaption,
  rightCaption,
}: VideoCompareProps) => {
  return (
    <div className={cn("flex flex-col md:flex-row gap-4", className)}>
      {/* LEFT Panel - Old Way */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-3">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{leftLabel}</p>
          {leftSubtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{leftSubtitle}</p>}
        </div>
        
        {/* Video */}
        <div className="border border-zinc-800 bg-zinc-900 overflow-hidden aspect-video">
          {firstVideo && (
            <video
              src={firstVideo}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
        </div>
        
        {/* Caption */}
        {leftCaption && (
          <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">{leftCaption}</p>
        )}
      </div>

      {/* RIGHT Panel - Replay Way */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-3">
          <p className="text-xs font-mono text-emerald-500 uppercase tracking-wider">{rightLabel}</p>
          {rightSubtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{rightSubtitle}</p>}
        </div>
        
        {/* Video */}
        <div className="border border-zinc-800 bg-zinc-900 overflow-hidden aspect-video relative">
          {/* Subtle glow effect on right panel */}
          <div className="absolute inset-0 border border-emerald-500/20 pointer-events-none z-10" />
          {secondVideo && (
            <video
              src={secondVideo}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
        </div>
        
        {/* Caption */}
        {rightCaption && (
          <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">{rightCaption}</p>
        )}
      </div>
    </div>
  );
};

export default VideoCompare;
