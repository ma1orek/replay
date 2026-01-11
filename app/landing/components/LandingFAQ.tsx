"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  { 
    q: "How does Replay work?", 
    a: "Upload or record a screen recording of any UI. Replay analyzes the video to understand layout, components, interactions, and navigation flow. It then generates clean, production-ready React + Tailwind CSS code that matches what was shown in the video." 
  },
  { 
    q: "What video formats are supported?", 
    a: "Replay supports most common video formats including MP4, WebM, and MOV. You can upload a file or record directly in the browser. For best results, use clear screen recordings at reasonable resolution — even phone recordings work." 
  },
  { 
    q: "How many credits does a generation cost?", 
    a: "Each video-to-code generation costs 75 credits. AI edits and refinements cost 25 credits each. Free accounts get 150 credits one-time (~2 generations). Pro accounts get 3,000 credits/month (~40 generations). You can also buy credits anytime." 
  },
  { 
    q: "Can I really upload a video of a physical object?",
    a: "Yes! Replay analyzes the context of the video. If you show a product, it will attempt to build a Landing Page or E-commerce view that matches the product's \"vibe\" and colors."
  },
  { 
    q: "Does it work with hand-drawn sketches?",
    a: "Yes. Record a video of you pointing at your sketch and explaining the flow, or just clicking through a paper prototype. Replay will structure it into a digital interface."
  },
  { 
    q: "What are the style presets?", 
    a: "Replay offers 30+ visual styles like Glassmorphism, Neubrutalism, Kinetic Brutalism, Retro Terminal, and more. Each style transforms the generated UI with a unique aesthetic while keeping the same layout and functionality. You can also add custom style instructions." 
  },
  { 
    q: "Can I edit the generated code?", 
    a: "Yes. Use the 'Edit with AI' feature to refine the output — change colors, add components, fix layouts, or adjust behavior. Each AI edit costs 25 credits. You can also download the code and edit it manually in your own editor." 
  },
  { 
    q: "What code format do I get?", 
    a: "Replay generates React components with Tailwind CSS. The code includes proper component structure, responsive design, and animations where applicable. You can download as HTML or copy the React code directly." 
  },
  { 
    q: "Does Replay work with mobile app recordings?", 
    a: "Yes — if the UI is visible on screen, Replay can analyze it. Mobile app recordings get rebuilt as responsive web UI. Native platform logic isn't included, but the visual structure and interactions are preserved." 
  },
  { 
    q: "What's the difference between Free and Pro?", 
    a: "Free: 150 credits (one-time), interactive preview only, code view is blurred. Pro ($35/month): 3,000 credits/month, full code access, download & copy, publish to web, rollover credits (up to 600). Both plans include all 30+ style presets and AI editing." 
  },
  { 
    q: "Can I cancel my subscription anytime?", 
    a: "Yes. Cancel anytime from Settings → Plans → Manage. You'll keep access until the end of your billing period. Unused monthly credits don't carry over after cancellation, but purchased top-up credits never expire." 
  },
  { 
    q: "What doesn't Replay do?", 
    a: "Replay focuses on frontend UI reconstruction. It doesn't generate backend logic, API integrations, database schemas, or authentication systems. It rebuilds what's visible — structure, styling, and interactions — not what's behind the scenes." 
  },
];

const FAQItem = ({ faq, index, isOpen, toggleIndex, isInView }: { 
  faq: typeof faqs[0], 
  index: number, 
  isOpen: boolean, 
  toggleIndex: (index: number) => void,
  isInView: boolean
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05 }}
    >
      <button
        onClick={() => toggleIndex(index)}
        className="w-full text-left rounded-xl border border-white/[0.06] bg-[#0a0a0a]/50 p-6 hover:border-white/[0.12] transition-all duration-300 flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 w-full">
          <span className="font-medium text-white/90 pr-4">{faq.q}</span>
          <ChevronDown className={cn(
            "w-5 h-5 text-[#FF6E3C] transition-transform duration-300 flex-shrink-0 mt-0.5",
            isOpen && "rotate-180"
          )} />
        </div>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key={`content-${index}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="pt-4 text-white/50 leading-relaxed text-sm">{faq.a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
};

export default function LandingFAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  const toggleIndex = (index: number) => {
    setOpenIndices((prev) => 
      prev.includes(index) 
        ? prev.filter((i) => i !== index) 
        : [...prev, index]
    );
  };

  // Split FAQs into two columns for independent layout behavior
  const leftFaqs = faqs.filter((_, i) => i % 2 === 0);
  const rightFaqs = faqs.filter((_, i) => i % 2 !== 0);

  return (
    <section id="faq" ref={ref} className="relative z-10 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs text-[#FF6E3C] uppercase tracking-[0.2em] mb-4">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            Questions & Answers
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-7xl mx-auto items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {leftFaqs.map((faq, i) => (
              <FAQItem 
                key={i * 2} 
                faq={faq} 
                index={i * 2} 
                isOpen={openIndices.includes(i * 2)}
                toggleIndex={toggleIndex}
                isInView={isInView}
              />
            ))}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {rightFaqs.map((faq, i) => (
              <FAQItem 
                key={i * 2 + 1} 
                faq={faq} 
                index={i * 2 + 1} 
                isOpen={openIndices.includes(i * 2 + 1)}
                toggleIndex={toggleIndex}
                isInView={isInView}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
