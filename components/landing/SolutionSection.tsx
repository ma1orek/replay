"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Play, Scan, FileCode } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

const steps = [
  {
    id: "01",
    title: "Record",
    description: "Capture user intent. Don't guess requirements. Replay records real user sessions, capturing DOM events, network flows, and business logic in action.",
    icon: Play
  },
  {
    id: "02",
    title: "Extract",
    description: "Structure the chaos. Our engine doesn't just copy screens. It identifies patterns to build a unified Component Library and Design Tokens from the raw footage.",
    icon: Scan
  },
  {
    id: "03",
    title: "Deploy",
    description: "Code is just the start. Receive a fully synchronized Design System, atomic Component Library, and scalable React architecture. The complete source of truth, ready for production.",
    icon: FileCode
  }
];

// Tech Visual Helper
const TechGrid = () => (
  <div className="absolute inset-0 pointer-events-none select-none opacity-[0.03]" style={{
    backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  }} />
);

// Minimalistic Record Visual - Dark Technical
const RecordVisual = () => {
  return (
    <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
      <TechGrid />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div 
            className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-16 h-16 rounded-full border border-red-500/30 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
            <motion.div 
              className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              animate={{ opacity: [1, 0.5, 1], scale: [1, 0.9, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 border border-zinc-800 bg-zinc-900 rounded text-[10px] font-mono text-zinc-500">
          <motion.div 
            className="w-1.5 h-1.5 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
          <span>REC_00:04:21</span>
        </div>
      </div>
      
      {/* Fake cursor path */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <path d="M 50 150 Q 100 50 200 100 T 300 150" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    </div>
  );
};

// Minimalistic Extract Visual - Dark Technical
const ExtractVisual = () => {
  return (
    <div className="relative w-full h-full bg-zinc-950 p-4 overflow-hidden">
      <TechGrid />
      <div className="relative h-full flex flex-col gap-2 z-10 opacity-80">
        <div className="h-6 w-full bg-zinc-900 border border-zinc-800 rounded flex items-center px-2">
          <div className="w-2 h-2 rounded-full bg-zinc-700 mr-1" />
          <div className="w-2 h-2 rounded-full bg-zinc-700 mr-1" />
        </div>
        <div className="flex-1 flex gap-2">
          <div className="w-1/4 h-full bg-zinc-900 border border-zinc-800 rounded" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-1/2 w-full bg-zinc-900 border border-zinc-800 rounded relative overflow-hidden group">
              <div className="absolute inset-0 border-2 border-orange-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-1 right-1 bg-orange-500/20 text-orange-400 text-[8px] px-1 font-mono">Hero</div>
            </div>
            <div className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded relative overflow-hidden group">
              <div className="absolute inset-0 border-2 border-orange-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-1 right-1 bg-orange-500/20 text-orange-400 text-[8px] px-1 font-mono">Grid</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scanning effect - orange, subtle, fade in/out */}
      <motion.div
        className="absolute left-0 w-full h-px bg-orange-500/60 shadow-[0_0_8px_rgba(249,115,22,0.3)] z-20"
        animate={{ 
          top: ["0%", "100%", "0%"],
          opacity: [0, 0.8, 0.8, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut",
          times: [0, 0.45, 0.55, 1]
        }}
      />
    </div>
  );
};

// Minimalistic Export Visual - Dark Technical
const ExportVisual = () => {
  return (
    <div className="relative w-full h-full bg-zinc-950 p-4 font-mono text-[10px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-transparent pointer-events-none" />
      <div className="relative z-10 space-y-1.5 opacity-80">
        <div className="flex gap-2">
          <span className="text-purple-400">export</span>
          <span className="text-blue-400">function</span>
          <span className="text-yellow-100">Dashboard</span>
          <span className="text-zinc-500">() {"{"}</span>
        </div>
        <div className="pl-4 text-zinc-500">// Auto-generated from replay</div>
        <div className="pl-4 flex gap-2">
          <span className="text-purple-400">return</span>
          <span className="text-zinc-500">(</span>
        </div>
        <div className="pl-8 text-zinc-300">&lt;Layout&gt;</div>
        <div className="pl-12 text-zinc-300">&lt;Header /&gt;</div>
        <div className="pl-12 text-zinc-300">&lt;Grid&gt;</div>
        <div className="pl-16 text-zinc-500">...items</div>
        <div className="pl-12 text-zinc-300">&lt;/Grid&gt;</div>
        <div className="pl-8 text-zinc-300">&lt;/Layout&gt;</div>
        <div className="pl-4 text-zinc-500">);</div>
        <div className="text-zinc-500">{"}"}</div>
      </div>
      <div className="absolute bottom-3 right-3">
        <motion.div 
          className="w-2 h-2 bg-orange-500 rounded-full"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="solution" className="relative py-20 lg:py-28 bg-zinc-950 border-t border-zinc-900" ref={ref}>
      <div className="landing-container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            From black box to{" "}
            <span className="italic text-zinc-500">documented codebase</span>
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Three steps. No guessing. No archaeology.
          </p>
        </motion.div>

        {/* Steps - Technical Grid Layout - Full Width */}
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <BlurFade key={step.id} delay={0.2 + index * 0.1} inView>
              <div className="group relative bg-zinc-950 border border-zinc-800 p-6 flex flex-col hover:bg-zinc-900/30 transition-colors h-full">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700 opacity-50" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 opacity-50" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700 opacity-50" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-700 opacity-50" />
                
                {/* Visual */}
                <div className="aspect-[4/3] mb-6 border border-zinc-800 overflow-hidden bg-zinc-900/50 group-hover:border-zinc-700 transition-colors">
                  {step.id === "01" && <RecordVisual />}
                  {step.id === "02" && <ExtractVisual />}
                  {step.id === "03" && <ExportVisual />}
                </div>

                {/* Text */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5">{step.id}</span>
                    <h3 className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors">{step.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>

      </div>
    </section>
  );
}
