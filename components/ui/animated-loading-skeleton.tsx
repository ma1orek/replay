"use client";

import React, { useEffect, useState } from 'react'

// Smooth, professional loading skeleton with walking search icon
const AnimatedLoadingSkeleton = () => {
    const [cardIndex, setCardIndex] = useState(0);
    
    // Sequential movement through cards (no random jumps)
    useEffect(() => {
        const interval = setInterval(() => {
            setCardIndex(prev => (prev + 1) % 6);
        }, 1500); // 1.5s per card - calm, professional pace
        
        return () => clearInterval(interval);
    }, []);

    // Card grid positions (relative to grid)
    const getIconPosition = (index: number) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        // Position at center of each card cell
        return {
            left: `calc(${(col * 33.333) + 16.666}% - 20px)`,
            top: `calc(${(row * 50) + 25}% - 20px)`
        };
    };

    const iconPos = getIconPosition(cardIndex);

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
                
                {/* Walking search icon - CSS transition for smooth movement */}
                <div
                    className="absolute z-10 pointer-events-none"
                    style={{
                        left: iconPos.left,
                        top: iconPos.top,
                        transition: 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1), top 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <div className="search-icon-glow bg-zinc-800/90 p-3 rounded-full backdrop-blur-sm">
                        <svg
                            className="w-5 h-5 text-orange-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Grid of skeleton cards */}
                <div className="grid grid-cols-3 gap-3" style={{ minHeight: '320px' }}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={`
                                bg-zinc-800/50 rounded-lg border p-3
                                transition-all duration-500 ease-out
                                ${i === cardIndex 
                                    ? 'border-orange-500/60 ring-1 ring-orange-500/30' 
                                    : 'border-zinc-800'
                                }
                            `}
                        >
                            <div className="skeleton-bar h-24 rounded-md mb-3" />
                            <div className="skeleton-bar h-3 w-3/4 rounded mb-2" />
                            <div className="skeleton-bar h-2 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Pure CSS animations - no JS re-renders */}
            <style jsx>{`
                .skeleton-bar {
                    background: linear-gradient(
                        90deg,
                        #27272a 0%,
                        #3f3f46 50%,
                        #27272a 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 2s ease-in-out infinite;
                }

                @keyframes shimmer {
                    0%, 100% { background-position: 200% 0; }
                    50% { background-position: -200% 0; }
                }

                .search-icon-glow {
                    box-shadow: 0 0 15px rgba(249, 115, 22, 0.3);
                    animation: pulse-glow 2s ease-in-out infinite;
                }

                @keyframes pulse-glow {
                    0%, 100% { 
                        box-shadow: 0 0 10px rgba(249, 115, 22, 0.2);
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 0 20px rgba(249, 115, 22, 0.4);
                        transform: scale(1.05);
                    }
                }
            `}</style>
        </div>
    )
}

export default AnimatedLoadingSkeleton
