"use client";

import React from 'react'

// Ultra-subtle, professional loading skeleton
// 100% CSS - NO React state, completely independent loop
const AnimatedLoadingSkeleton = () => {
    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div className="relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
                
                {/* Subtle scanning line - very minimal */}
                <div className="scan-line" />

                {/* Grid of skeleton cards */}
                <div className="grid grid-cols-3 gap-4" style={{ minHeight: '280px' }}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="card-skeleton rounded-lg p-4"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        >
                            <div className="shimmer-bar h-20 rounded mb-3" />
                            <div className="shimmer-bar h-2.5 w-3/4 rounded mb-2" />
                            <div className="shimmer-bar h-2 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* All CSS - independent of React lifecycle */}
            <style jsx>{`
                /* Subtle scanning effect */
                .scan-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.3), transparent);
                    animation: scan 4s ease-in-out infinite;
                    opacity: 0.6;
                }

                @keyframes scan {
                    0%, 100% { 
                        top: 0;
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.6;
                    }
                    90% {
                        opacity: 0.6;
                    }
                    50% { 
                        top: calc(100% - 1px);
                    }
                }

                /* Card with subtle border pulse */
                .card-skeleton {
                    background: rgba(39, 39, 42, 0.3);
                    border: 1px solid rgba(63, 63, 70, 0.3);
                    animation: card-fade 3s ease-in-out infinite;
                }

                @keyframes card-fade {
                    0%, 100% { 
                        border-color: rgba(63, 63, 70, 0.2);
                    }
                    50% { 
                        border-color: rgba(63, 63, 70, 0.4);
                    }
                }

                /* Shimmer bars - very subtle */
                .shimmer-bar {
                    background: linear-gradient(
                        90deg,
                        rgba(39, 39, 42, 0.5) 0%,
                        rgba(63, 63, 70, 0.5) 50%,
                        rgba(39, 39, 42, 0.5) 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 2.5s ease-in-out infinite;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    )
}

export default AnimatedLoadingSkeleton
