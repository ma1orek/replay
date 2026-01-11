"use client";
import { useEffect, useState } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.08,
  textClassName,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
  textClassName?: string;
}) => {
  const [scope, animate] = useAnimate();
  const [isMobile, setIsMobile] = useState(false);
  const wordsArray = words.split(" ");
  
  useEffect(() => {
    // Check if mobile for performance
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    if (scope.current) {
      // On mobile, skip blur filter animation for performance
      const shouldFilter = filter && !isMobile;
      animate(
        "span",
        {
          opacity: 1,
          filter: shouldFilter ? "blur(0px)" : "none",
        },
        {
          duration: isMobile ? duration * 0.5 : duration, // Faster on mobile
          delay: stagger(isMobile ? staggerDelay * 0.5 : staggerDelay),
        }
      );
    }
  }, [scope, animate, filter, duration, staggerDelay, isMobile]);

  const renderWords = () => {
    // On mobile, use simpler animation (no blur filter)
    const useBlur = filter && !isMobile;
    
    return (
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className={cn("inline-block pb-1", textClassName)}
              style={{
                opacity: 0,
                filter: useBlur ? "blur(8px)" : "none",
              }}
            >
              {word}&nbsp;
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-bold overflow-visible", className)}>
      {renderWords()}
    </div>
  );
};

