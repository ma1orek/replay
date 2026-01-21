"use client";

import React from 'react'

// 100% CSS animation - NO React state, NO re-renders, PURE smooth loop
const AnimatedLoadingSkeleton = () => {
    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
                
                {/* Search icon - pure CSS animation path */}
                <div className="search-icon-container">
                    <div className="search-icon">
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
                            className="skeleton-card bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-3"
                            style={{ animationDelay: `${i * 1.5}s` }}
                        >
                            <div className="skeleton-bar h-24 rounded-md mb-3" />
                            <div className="skeleton-bar h-3 w-3/4 rounded mb-2" style={{ animationDelay: '0.1s' }} />
                            <div className="skeleton-bar h-2 w-1/2 rounded" style={{ animationDelay: '0.2s' }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* ALL animations in pure CSS - zero JS interference */}
            <style jsx>{`
                /* Search icon walking animation - 9s full loop through all 6 cards */
                .search-icon-container {
                    position: absolute;
                    z-index: 10;
                    pointer-events: none;
                    animation: walk-path 9s linear infinite;
                }

                .search-icon {
                    background: rgba(39, 39, 42, 0.95);
                    padding: 12px;
                    border-radius: 50%;
                    backdrop-filter: blur(4px);
                    box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
                    animation: pulse-glow 2s ease-in-out infinite;
                }

                /* Walk through 6 cards in a smooth path */
                @keyframes walk-path {
                    0%, 100% {
                        left: 16.666%;
                        top: 25%;
                        transform: translate(-50%, -50%);
                    }
                    16.666% {
                        left: 50%;
                        top: 25%;
                        transform: translate(-50%, -50%);
                    }
                    33.333% {
                        left: 83.333%;
                        top: 25%;
                        transform: translate(-50%, -50%);
                    }
                    50% {
                        left: 16.666%;
                        top: 75%;
                        transform: translate(-50%, -50%);
                    }
                    66.666% {
                        left: 50%;
                        top: 75%;
                        transform: translate(-50%, -50%);
                    }
                    83.333% {
                        left: 83.333%;
                        top: 75%;
                        transform: translate(-50%, -50%);
                    }
                }

                @keyframes pulse-glow {
                    0%, 100% { 
                        box-shadow: 0 0 15px rgba(249, 115, 22, 0.25);
                        transform: scale(1);
                    }
                    50% { 
                        box-shadow: 0 0 25px rgba(249, 115, 22, 0.5);
                        transform: scale(1.08);
                    }
                }

                /* Card highlight when icon is over it */
                .skeleton-card {
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }

                /* Shimmer effect */
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
            `}</style>
        </div>
    )
}

export default AnimatedLoadingSkeleton
