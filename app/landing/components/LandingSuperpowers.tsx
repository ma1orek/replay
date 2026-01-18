"use client";

import { useEffect, useRef } from "react";

export default function LandingSuperpowers() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Force autoplay on mobile - iOS Safari needs explicit play() call
  useEffect(() => {
    const playAllVideos = () => {
      videoRefs.current.forEach(video => {
        if (video) {
          video.play().catch(() => {});
        }
      });
    };

    // Try to play immediately
    playAllVideos();
    
    // Try again after short delays (videos might not be ready)
    const t1 = setTimeout(playAllVideos, 100);
    const t2 = setTimeout(playAllVideos, 500);
    const t3 = setTimeout(playAllVideos, 1000);

    // Also use IntersectionObserver for videos that come into view later
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

    // Handle page visibility change (when user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        playAllVideos();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const powers = [
    {
      title: "Clone UI Logic",
      subtitle: { input: "Competitor's Booking Flow", output: "Working React Component" },
      bodyPart1: "See a UX pattern you love? Don't rebuild it from scratch. Record the flow. Replay extracts the structure, animations, and state logic.",
      bodyPart2: "Get the exact code foundation in seconds. Stop reinventing the wheel.",
      video: "/sphere.mp4",
    },
    {
      title: "Sketch to App",
      subtitle: { input: "Napkin Wireframe", output: "High-Fidelity Dashboard" },
      bodyPart1: "Skip the Figma bottleneck. Record a video of your rough paper sketches or whiteboard drawings.",
      bodyPart2: "Replay converts them into a polished, responsive interface with modern Shadcn styling ready for production.",
      video: "/lens.mp4",
    },
    {
      title: "Video to Landing Page",
      subtitle: { input: "Product Demo / Object", output: "Sales Page with Context" },
      bodyPart1: "Have a physical product or a rough prototype? Just film it. Replay analyzes the visual context (colors, vibe, object type).",
      bodyPart2: "It generates a high-converting landing page structure tailored specifically to sell that item.",
      video: "/box.mp4",
    },
    {
      title: "Instant Refactor",
      subtitle: { input: "Old ERP / Legacy SaaS", output: "Modern Next.js Interface" },
      bodyPart1: "Stuck with an ugly internal tool from 2010? Don't rewrite the logic manually. Record the workflow.",
      bodyPart2: "Replay modernizes the UI into clean React & Tailwind while preserving the complex forms and data tables.",
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
                  onLoadedData={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                  onCanPlay={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
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
