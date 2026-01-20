"use client";

import React from 'react'

// Simple, smooth skeleton loader - NO flickering, NO random restarts
const AnimatedLoadingSkeleton = () => {
    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
                
                {/* Replay Logo in center with smooth pulse */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="relative">
                        {/* Smooth glow - CSS only, no JS */}
                        <div 
                            className="absolute inset-0 blur-2xl bg-orange-500/20 scale-150"
                            style={{ animation: 'skeleton-glow 2s ease-in-out infinite' }}
                        />
                        {/* Logo */}
                        <svg 
                            className="w-16 h-16 text-orange-500 relative z-10" 
                            viewBox="0 0 82 109" 
                            fill="currentColor"
                        >
                            <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" />
                            <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" />
                        </svg>
                    </div>
                </div>

                {/* Header skeleton */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                    <div className="skeleton-bar w-6 h-6 rounded" />
                    <div className="skeleton-bar w-24 h-3 rounded" />
                    <div className="flex-1" />
                    <div className="flex gap-2">
                        <div className="skeleton-bar w-16 h-6 rounded" />
                        <div className="skeleton-bar w-16 h-6 rounded" />
                    </div>
                </div>

                {/* Body skeleton */}
                <div className="flex min-h-[220px]">
                    {/* Sidebar */}
                    <div className="w-40 border-r border-zinc-800 p-3 space-y-2 hidden sm:block">
                        <div className="skeleton-bar w-full h-7 rounded" />
                        <div className="skeleton-bar w-3/4 h-7 rounded" />
                        <div className="skeleton-bar w-5/6 h-7 rounded" />
                        <div className="skeleton-bar w-2/3 h-7 rounded" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4">
                        <div className="skeleton-bar w-2/3 h-5 rounded mb-3" />
                        <div className="skeleton-bar w-1/2 h-3 rounded mb-6" />

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div 
                                    key={i} 
                                    className="rounded-lg border border-zinc-800 p-3 bg-zinc-800/30"
                                >
                                    <div className="skeleton-bar w-8 h-8 rounded mb-2" />
                                    <div className="skeleton-bar w-full h-3 rounded mb-1.5" />
                                    <div className="skeleton-bar w-2/3 h-2 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for smooth animations - defined once, no JS restarts */}
            <style jsx>{`
                .skeleton-bar {
                    background: linear-gradient(
                        90deg,
                        #27272a 0%,
                        #3f3f46 50%,
                        #27272a 100%
                    );
                    background-size: 200% 100%;
                    animation: skeleton-shimmer 1.5s ease-in-out infinite;
                }

                @keyframes skeleton-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                @keyframes skeleton-glow {
                    0%, 100% { 
                        opacity: 0.3;
                        transform: scale(1.5);
                    }
                    50% { 
                        opacity: 0.6;
                        transform: scale(2);
                    }
                }
            `}</style>
        </div>
    )
}

export default AnimatedLoadingSkeleton
