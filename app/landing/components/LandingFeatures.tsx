"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

export function LandingFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const demos = useMemo(
    () => [
      { name: "Y Combinator", before: "/yvbefore.mp4", after: "/AFTERYC.mp4" },
      { name: "Microsoft", before: "/microbefore.mp4", after: "/microafter.mp4" },
      { name: "Craigslist", before: "/craiglistbefore.mp4", after: "/craigafter.mp4" },
    ],
    []
  );

  const [views, setViews] = useState<("before" | "after")[]>(() => demos.map(() => "after"));

  return (
    <section id="demo" ref={ref} className="relative z-10 py-28 lg:py-36 border-t border-white/[0.03]">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            See a real Replay generation
          </h2>
          <p className="text-lg text-white/60">
            Explore how a screen recording becomes a working interface — fully reconstructed by Replay.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {demos.map((demo, idx) => {
            const active = views[idx];
            return (
              <motion.div
                key={demo.name}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.1 + idx * 0.1 }}
                className="rounded-3xl border border-white/10 bg-[#0A0A0A] overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 pt-6">
                  <h3 className="text-lg font-semibold text-white">{demo.name}</h3>
                  <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1">
                    {(["before", "after"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setViews((prev) => prev.map((item, i) => (i === idx ? mode : item)))
                        }
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                          active === mode ? "bg-white text-black" : "text-white/60 hover:text-white"
                        )}
                      >
                        {mode === "before" ? "Before" : "After"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-6 pt-4">
                  <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <video
                      className="w-full aspect-[16/9] object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      src={active === "before" ? demo.before : demo.after}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
