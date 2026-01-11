'use client'
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export const GradientCard = ({ 
  children,
  className,
}: { 
  children?: React.ReactNode;
  className?: string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Handle mouse movement for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();

      // Calculate mouse position relative to card center
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      setMousePosition({ x, y });

      // Calculate rotation (limited range for subtle effect)
      const rotateX = -(y / rect.height) * 5; // Max 5 degrees rotation
      const rotateY = (x / rect.width) * 5; // Max 5 degrees rotation

      setRotation({ x: rotateX, y: rotateY });
    }
  };

  // Reset rotation when not hovering
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
      <motion.div
        ref={cardRef}
        className={`relative rounded-[32px] overflow-hidden bg-[#0e131f] ${className}`}
        style={{
          transformStyle: "preserve-3d",
          boxShadow: "0 -10px 100px 10px rgba(0, 0, 0, 0.5)", // Removed blue shadow
        }}
        initial={{ y: 0 }}
        animate={{
          y: isHovered ? -5 : 0,
          rotateX: rotation.x,
          rotateY: rotation.y,
          perspective: 1000,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* Subtle glass reflection overlay - Z-Index lowered to 10 to be BEHIND content */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(2px)",
          }}
          animate={{
            opacity: isHovered ? 0.7 : 0.5,
            rotateX: -rotation.x * 0.2,
            rotateY: -rotation.y * 0.2,
            z: 1,
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        />

        {/* Dark background with black gradient like in the image */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            background: "linear-gradient(180deg, #000000 0%, #000000 70%)",
          }}
          animate={{
            z: -1
          }}
        />

        {/* Noise texture overlay */}
        <motion.div
          className="absolute inset-0 opacity-30 mix-blend-overlay z-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
          animate={{
            z: -0.5
          }}
        />

        {/* Subtle finger smudge texture for realism */}
        <motion.div
          className="absolute inset-0 opacity-10 mix-blend-soft-light z-11 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='smudge'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='3' seed='5' stitchTiles='stitch'/%3E%3CfeGaussianBlur stdDeviation='10'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23smudge)'/%3E%3C/svg%3E")`,
            backdropFilter: "blur(1px)",
          }}
          animate={{
            z: -0.25
          }}
        />

        {/* Removed Blue Glows completely - keeping only subtle orange/neutral or nothing as requested "no blue glow" */}
        {/* We can keep a very subtle warm glow if desired, or just remove. User said "no blue". I'll keep the orange one I added but ensure it's subtle. */}

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2/3 z-20 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at bottom right, rgba(255, 110, 60, 0.15) -10%, transparent 70%),
              radial-gradient(ellipse at bottom left, rgba(255, 140, 90, 0.15) -10%, transparent 70%)
            `,
            filter: "blur(40px)",
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0.3, // Reduced opacity
            y: isHovered ? rotation.x * 0.5 : 0,
            z: 0
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        />

        {/* Central glow - Reduced opacity */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2/3 z-21 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at bottom center, rgba(255, 110, 60, 0.15) -20%, transparent 60%)
            `,
            filter: "blur(45px)",
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0.4,
            y: isHovered ? `calc(10% + ${rotation.x * 0.3}px)` : "10%",
            z: 0
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        />

        {/* Enhanced bottom border glow - Keeping orange as user generally likes orange, but removed blue traces */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] z-25 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.05) 100%)",
          }}
          animate={{
            boxShadow: isHovered
              ? "0 0 20px 4px rgba(255, 110, 60, 0.3), 0 0 30px 6px rgba(255, 110, 60, 0.1)"
              : "0 0 15px 3px rgba(255, 110, 60, 0.2), 0 0 25px 5px rgba(255, 110, 60, 0.1)",
            opacity: isHovered ? 1 : 0.8,
            z: 0.5
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        />
        
        {/* Left edge glow */}
        <motion.div
          className="absolute bottom-0 left-0 h-1/4 w-[1px] z-25 rounded-full pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0) 80%)",
          }}
          animate={{
             boxShadow: isHovered
              ? "0 0 20px 4px rgba(255, 110, 60, 0.3)"
              : "0 0 15px 3px rgba(255, 110, 60, 0.2)",
            opacity: isHovered ? 1 : 0.8,
            z: 0.5
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        />
        
        {/* Right edge glow */}
        <motion.div
          className="absolute bottom-0 right-0 h-1/4 w-[1px] z-25 rounded-full pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0) 80%)",
          }}
          animate={{
             boxShadow: isHovered
              ? "0 0 20px 4px rgba(255, 110, 60, 0.3)"
              : "0 0 15px 3px rgba(255, 110, 60, 0.2)",
            opacity: isHovered ? 1 : 0.8,
            z: 0.5
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        />

        {/* Content - High Z-Index to stay sharp */}
        <div className="relative z-30 h-full">
          {children}
        </div>
      </motion.div>
  );
};
