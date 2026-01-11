"use client";

import { Building2, Code2, Lightbulb, Zap } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function LandingUseCases() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const cases = [
    {
      title: "For Developers",
      tagline: "Stop fighting with CSS Grid.",
      desc: "See a layout you love? Don't reverse-engineer it div by div inside Inspect Element. Record it. Replay scaffolds the perfect Tailwind structure and responsiveness instantly. Skip the boilerplate, focus on shipping features.",
      icon: Code2,
    },
    {
      title: "For Founders",
      tagline: "Ship \"Vercel-level\" UI without a design team.",
      desc: "Your backend is solid, but your frontend looks like a weekend project? Upload your napkin sketches, wireframes, or rough MVP. Replay turns them into stunning, animated interfaces that look like you just raised a Series A.",
      icon: Zap,
    },
    {
      title: "For Marketers",
      tagline: "Turn viral moments into landing pages.",
      desc: "Have a killer product demo, a robot video, or a physical object? Don't write copy from scratch. Replay analyzes the visual vibe and context to generate a high-converting sales page structure that matches your video perfectly.",
      icon: Lightbulb,
    },
    {
      title: "For Product Teams",
      tagline: "Modernize legacy tools without the rewrite nightmare.",
      desc: "Stuck with mission-critical internal dashboards from 2010? Don't rewrite the logic from scratch. Record the workflow, and let Replay rebuild the UI in modern React & Shadcn, preserving complex forms and data flows.",
      icon: Building2,
    },
  ];

  return (
    <section id="use-cases" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">Use Cases</p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            Who is Replay for?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {cases.map((c, idx) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 + idx * 0.08 }}
              className="relative p-6 rounded-2xl bg-[#050505] border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-[#FF6E3C]/30 hover:shadow-[0_0_25px_rgba(255,110,60,0.08)]"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-[#FF6E3C]/10 rounded-xl flex items-center justify-center text-[#FF6E3C] mb-5 border border-[#FF6E3C]/20">
                <c.icon className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{c.title}</h3>
              
              {/* Orange tagline */}
              <p className="text-[#FF6E3C] font-mono text-xs uppercase tracking-wide mb-3 font-semibold">
                {c.tagline}
              </p>

              <p className="text-white/50 text-sm leading-relaxed">
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
