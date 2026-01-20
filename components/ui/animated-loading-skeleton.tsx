"use client";

import React, { useEffect, useState, useRef } from 'react'

// Walking search icon skeleton - FIXED flickering
const AnimatedLoadingSkeleton = () => {
    const [position, setPosition] = useState({ x: 40, y: 60 });
    const positionRef = useRef({ x: 40, y: 60 });
    const targetRef = useRef({ x: 40, y: 60 });
    const animationRef = useRef<number>();

    // Grid positions for cards
    const cardPositions = [
        { x: 40, y: 60 },
        { x: 250, y: 60 },
        { x: 460, y: 60 },
        { x: 40, y: 290 },
        { x: 250, y: 290 },
        { x: 460, y: 290 },
    ];

    useEffect(() => {
        let currentIndex = 0;
        
        // Pick next random target
        const pickNextTarget = () => {
            const nextIndex = Math.floor(Math.random() * cardPositions.length);
            if (nextIndex !== currentIndex) {
                currentIndex = nextIndex;
                targetRef.current = cardPositions[nextIndex];
            } else {
                // If same, pick next one
                currentIndex = (nextIndex + 1) % cardPositions.length;
                targetRef.current = cardPositions[currentIndex];
            }
        };

        // Smooth animation loop
        const animate = () => {
            const speed = 0.02; // Slow, smooth movement
            const dx = targetRef.current.x - positionRef.current.x;
            const dy = targetRef.current.y - positionRef.current.y;
            
            // If close to target, pick new target
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
                pickNextTarget();
            }
            
            // Lerp towards target
            positionRef.current.x += dx * speed;
            positionRef.current.y += dy * speed;
            
            // Update state only when needed (throttled)
            setPosition({ ...positionRef.current });
            
            animationRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        pickNextTarget();
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
                
                {/* Walking search icon */}
                <div
                    className="absolute z-10 pointer-events-none transition-none"
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <div className="bg-zinc-800/90 p-3 rounded-full backdrop-blur-sm shadow-lg shadow-zinc-900/50">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="bg-zinc-800/50 rounded-lg border border-zinc-800 p-3"
                        >
                            <div className="skeleton-bar h-24 rounded-md mb-3" />
                            <div className="skeleton-bar h-3 w-3/4 rounded mb-2" />
                            <div className="skeleton-bar h-2 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* CSS for shimmer effect */}
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
            `}</style>
        </div>
    )
}

export default AnimatedLoadingSkeleton
