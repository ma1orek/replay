"use client";

import { useEffect, useRef } from "react";

export default function LandingSuperpowers() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Force autoplay on mobile - iOS Safari needs explicit play() call
  useEffect(() => {
    const playVideos = () => {
      videoRefs.current.forEach(video => {
        if (video) {
          video.play().catch(() => {
            // Silent catch - video might not be ready or in viewport
          });
        }
      });
    };

    // Try to play immediately
    playVideos();

    // Also try when scrolling (for lazy loading)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target instanceof HTMLVideoElement) {
            entry.target.play().catch(() => {});
          }
        });
      },
      { threshold: 0.1 }
    );

    videoRefs.current.forEach(video => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, []);

  const powers = [
    {
      title: "The Mimic",
      subtitle: { input: "Complex Booking Flow", output: "Interactive User Flows" },
      bodyPart1: "See a perfect UX pattern? Record the user journey. Replay extracts the entire structure, interaction logic, and navigation flow — not just the visuals.",
      bodyPart2: "Apply your branding to a fully functional behavior. From \"Their App\" to \"Your Code\" in 60 seconds.",
      video: "/sphere.mp4",
    },
    {
      title: "The Visionary",
      subtitle: { input: "Grey Wireframe", output: "Animated SaaS Dashboard" },
      bodyPart1: "Your MVP works, but looks rough? Record your wireframes or raw user flows.",
      bodyPart2: "Replay reconstructs them into stunning, animated interfaces with modern styling and complex interactions preserved.",
      video: "/lens.mp4",
    },
    {
      title: "The Reality Bender",
      subtitle: { input: "Soda Can Video", output: "High-Converting Sales Page" },
      bodyPart1: "Have a product video, a robot demo, or just a recording of a soda can?",
      bodyPart2: "Replay analyzes the visual vibe and context to generate a high-converting landing page specifically for that object.",
      video: "/box.mp4",
    },
    {
      title: "The Legacy Slayer",
      subtitle: { input: "Legacy ERP System", output: "Linear-Style Data Table" },
      bodyPart1: "Stuck with mission-critical software that looks like it's from 2005? Don't rewrite the logic from scratch.",
      bodyPart2: "Record the workflow. Replay preserves the complex forms, data tables, and validation rules, but rebuilds the UI in clean, maintainable code.",
      video: "/glassmade.mp4",
    },
  ];

  return (
    <section className="relative z-10 py-16 md:py-32 border-t border-white/[0.03]">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-10 md:mb-20">
          <div className="max-w-4xl mx-auto">
             <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight text-white">
               One Engine.<br />Four Superpowers.
             </h2>
          </div>
        </div>

        {/* Grid - 1 column on mobile, 4 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {powers.map((power, i) => (
            <div
              key={power.title}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] min-h-[420px] md:min-h-[520px] bg-[#020202] transition-all duration-300 hover:border-[#FF6E3C]/30 hover:shadow-[0_0_30px_rgba(255,110,60,0.1)]"
            >
              {/* Video Background */}
              <div className="absolute inset-0 z-0 bg-black">
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  src={power.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover mix-blend-screen opacity-60 md:opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                />
                {/* Gradient: transparent at top, black at bottom for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
              </div>
              
              {/* Text Content - at bottom */}
              <div className="relative z-10 p-5 md:p-6 pb-6 md:pb-8 flex flex-col justify-end h-full">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{power.title}</h3>
                <div className="text-[11px] font-mono uppercase tracking-wide text-white/60 mb-3 md:mb-4">
                  <div className="flex flex-col gap-1">
                    <div><span className="text-white/40 mr-1">IN:</span><span className="text-white/80">{power.subtitle.input}</span></div>
                    <div><span className="text-[#FF6E3C] mr-1">OUT:</span><span className="text-white font-medium">{power.subtitle.output}</span></div>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-2">{power.bodyPart1}</p>
                <p className="text-sm text-white/60 leading-relaxed">{power.bodyPart2}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
