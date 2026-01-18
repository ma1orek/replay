"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, ScanFace, Video } from "lucide-react";

export default function LandingHowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      num: "1",
      icon: Video,
      title: "Capture Reality",
      desc: "Record a flow you want to recreate.",
    },
    {
      num: "2",
      icon: ScanFace,
      title: "Rebuild the Structure",
      desc: "Replay reconstructs the layout, states, and interactions.",
    },
    {
      num: "3",
      icon: Code2,
      title: "Ship the Interface",
      desc: "Get clean React code you can edit and use.",
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="relative z-10 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative z-10 max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
            From video to interface
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            One recording in. A working interface out.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
              className="relative p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-colors group"
            >
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 group-hover:bg-white/10 transition-colors">
                    <span className="font-mono font-bold">{step.num}</span>
                 </div>
                 <step.icon className="w-6 h-6 text-[#FF6E3C]" />
              </div>

              <h4 className="text-xl font-semibold text-white mb-3">{step.title}</h4>
              <p className="text-white/50 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}