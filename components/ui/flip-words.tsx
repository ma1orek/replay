"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const reduceMotion = useReducedMotion();
  const [currentWord, setCurrentWord] = useState(words[0] ?? "");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isMobileLike, setIsMobileLike] = useState(false);

  const longestWord = useMemo(() => {
    return words.reduce((acc, w) => (w.length > acc.length ? w : acc), words[0] || "");
  }, [words]);

  useEffect(() => {
    const compute = () => {
      const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
      const noHover = window.matchMedia?.("(hover: none)")?.matches ?? false;
      const small = window.innerWidth < 768;
      setIsMobileLike(coarse || noHover || small);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const startAnimation = useCallback(() => {
    if (!words.length) return;
    const idx = words.indexOf(currentWord);
    const next = words[idx + 1] || words[0];
    setCurrentWord(next);
    setIsAnimating(true);
  }, [currentWord, words]);

  // Mobile / reduced-motion: lightweight fade between words
  useEffect(() => {
    if (!words.length) return;
    if (!reduceMotion && !isMobileLike) return;

    const interval = window.setInterval(() => {
      setCurrentWord((prev) => {
        const idx = words.indexOf(prev);
        return words[idx + 1] || words[0];
      });
    }, duration);
    return () => window.clearInterval(interval);
  }, [duration, isMobileLike, reduceMotion, words]);

  // Desktop: nicer animated flip
  useEffect(() => {
    if (!words.length) return;
    if (reduceMotion || isMobileLike) return;
    if (!isAnimating) {
      const t = window.setTimeout(() => startAnimation(), duration);
      return () => window.clearTimeout(t);
    }
  }, [duration, isAnimating, isMobileLike, reduceMotion, startAnimation, words.length]);

  return (
    <span
      className={cn(
        "relative inline-block align-baseline",
        className,
      )}
    >
      {/* Reserve size to avoid layout shift / "jumping" */}
      <span className="opacity-0 pointer-events-none select-none whitespace-nowrap">
        {longestWord}
      </span>

      {(reduceMotion || isMobileLike) ? (
        <span className="absolute inset-0 whitespace-nowrap">
          {currentWord}
        </span>
      ) : (
        <AnimatePresence
          mode="popLayout"
          onExitComplete={() => setIsAnimating(false)}
        >
          <motion.span
            key={currentWord}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0 z-10 inline-block whitespace-nowrap"
          >
            {currentWord.split(" ").map((w, wi) => (
              <span key={`${w}-${wi}`} className="inline-block whitespace-nowrap">
                {w.split("").map((ch, ci) => (
                  <motion.span
                    key={`${w}-${wi}-${ci}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: wi * 0.04 + ci * 0.015, duration: 0.15 }}
                    className="inline-block"
                  >
                    {ch}
                  </motion.span>
                ))}
                <span className="inline-block">&nbsp;</span>
              </span>
            ))}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
};

