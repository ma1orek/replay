"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, Video, ScanFace } from "lucide-react";

export default function LandingHowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      num: "01",
      icon: Video,
      title: "Capture Reality",
      desc: "Upload a screen recording, a phone video of a physical object, or a rough prototype walkthrough.",
    },
    {
      num: "02",
      icon: ScanFace,
      title: "Semantic Reconstruction",
      desc: "Replay analyzes visuals, timing, and interactions to build a semantic understanding of the UI structure.",
    },
    {
      num: "03",
      icon: Code2,
      title: "Production Ready",
      desc: "Get clean, componentized React code. Ready to copy, remix, or deploy directly to production.",
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative z-10"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">How it works</p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Visual Reverse Engineering
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
              className="relative p-6 rounded-2xl bg-[#050505] border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-[#FF6E3C]/30 hover:shadow-[0_0_25px_rgba(255,110,60,0.08)]"
            >
              {/* Number background */}
              <span className="absolute top-4 right-4 text-6xl font-bold text-white/[0.03] pointer-events-none font-mono">
                {step.num}
              </span>

              {/* Icon */}
              <div className="w-12 h-12 bg-[#FF6E3C]/10 rounded-xl flex items-center justify-center text-[#FF6E3C] mb-5 border border-[#FF6E3C]/20">
                <step.icon className="w-6 h-6" />
              </div>

              {/* Text */}
              <h4 className="text-lg font-semibold text-white mb-2">{step.title}</h4>
              <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
