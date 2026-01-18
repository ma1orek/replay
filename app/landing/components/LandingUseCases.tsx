"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function LandingUseCases() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const cases = [
    {
      category: "Inspiration",
      title: "Clone UI Logic",
      desc: "See a perfect UX pattern? Don't rebuild from scratch. Record the flow. Replay extracts the structure, animations, and state logic instantly.",
    },
    {
      category: "Prototyping",
      title: "Sketch to App",
      desc: "Skip the Figma bottleneck. Record your whiteboard sketches/prototypes. Get a polished, responsive interface ready for backend integration.",
    },
    {
      category: "Modernization",
      title: "Legacy Refactor",
      desc: "Updating an old ERP? Don't rewrite manually. Record the workflow. Replay modernizes the UI and logic while preserving complex data tables.",
    },
  ];

  return (
    <section id="use-cases" ref={ref} className="relative z-10 py-28 lg:py-36 bg-[#050505]/50">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Solve real problems
          </h2>
          <p className="text-xl text-gray-400">
             From quick prototypes to full-scale migrations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((c, idx) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 + idx * 0.08 }}
              className="relative p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="mb-4">
                  <span className="text-[#FF6E3C] text-xs font-bold uppercase tracking-wider block mb-2">
                    {c.category}
                  </span>
                  <h3 className="text-2xl font-bold text-white">{c.title}</h3>
              </div>
              
              <p className="text-white/50 leading-relaxed">
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}