"use client";
import { useEffect } from "react";
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
  const wordsArray = words.split(" ");
  
  useEffect(() => {
    if (scope.current) {
      animate(
        "span",
        {
          opacity: 1,
          filter: filter ? "blur(0px)" : "none",
        },
        {
          duration: duration,
          delay: stagger(staggerDelay),
        }
      );
    }
  }, [scope, animate, filter, duration, staggerDelay]);

  const renderWords = () => {
    return (
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className={cn("inline-block", textClassName)}
              style={{
                opacity: 0,
                filter: filter ? "blur(8px)" : "none",
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
    <div className={cn("font-bold", className)}>
      {renderWords()}
    </div>
  );
};

