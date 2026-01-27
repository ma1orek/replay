"use client";

import { ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { DitheringShader } from "./dithering-shader";

interface CTASectionProps {
  badge?: string;
  headline?: React.ReactNode;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
}

export function CTASection({
  badge = "Start Today",
  headline = <>Ready to <br /><span className="text-foreground/60">modernize?</span></>,
  description = "Join enterprise teams using Replay to understand and modernize legacy systems. Clean, documented code from real workflows.",
  buttonText = "Book a Pilot",
  buttonHref = "/contact"
}: CTASectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [dimensions, setDimensions] = useState({ width: 1200, height: 500 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (ref.current) {
        setDimensions({
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <section className="py-16 w-full flex justify-center items-center px-4 md:px-6" ref={ref}>
      <motion.div 
        className="w-full max-w-5xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm min-h-[400px] md:min-h-[450px] flex flex-col items-center justify-center">
          {/* Shader Background */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-multiply">
            <DitheringShader
              width={dimensions.width}
              height={dimensions.height}
              colorBack="#ffffff"
              colorFront="#f97316"
              shape="warp"
              type="4x4"
              pxSize={4}
              speed={isHovered ? 0.5 : 0.15}
              className="w-full h-full"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div className="relative z-10 px-6 max-w-3xl mx-auto text-center flex flex-col items-center">
            
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
              </span>
              {badge}
            </motion.div>

            {/* Headline */}
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-zinc-900 mb-6 leading-[1.1]"
            >
              {headline}
            </motion.h2>
            
            {/* Description */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="text-zinc-500 text-base md:text-lg max-w-xl mb-8 leading-relaxed"
            >
              {description}
            </motion.p>

            {/* Button */}
            <motion.a 
              href={buttonHref}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 }}
              className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-all duration-300 hover:bg-zinc-800 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">{buttonText}</span>
              <ArrowRight className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
