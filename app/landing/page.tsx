import { AuroraEffect, FloatingOrbs, GridLines } from "./components/LandingBackgrounds";
import LandingNavigation from "./components/LandingNavigation";
import LandingHero from "./components/LandingHero";
import LandingScrollIndicator from "./components/LandingScrollIndicator";
import { LandingSocialProof } from "./components/LandingSocialProof";
import LandingHowItWorks from "./components/LandingHowItWorks";
import LandingSuperpowers from "./components/LandingSuperpowers";
import { MidPageCTA, FinalCTA } from "./components/LandingCTA";
import { LandingFeatures } from "./components/LandingFeatures";
import { LandingUseCases } from "./components/LandingUseCases";
import LandingPricing from "./components/LandingPricing";
import LandingFAQ from "./components/LandingFAQ";
import { LandingFooter } from "./components/LandingFooter";
import { RetroGrid } from "@/components/ui/retro-grid";
import { Spotlight } from "@/components/ui/spotlight-new";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Turn Video into Production-Ready Code | Replay.build",
  description: "Stop guessing with prompts. Replay treats video as the source of truth to reconstruct UI behavior into production-ready React code. Instantly.",
  openGraph: {
    title: "Visual Reverse Engineering is here.",
    description: "We built the first engine that understands UI behavior over time. Drag a video, get a production-ready web app. No prompts required.",
    images: [
      {
        url: "https://www.replay.build/og-image.png",
        width: 1200,
        height: 630,
        alt: "Replay - Turn Video into Production-Ready Code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual Reverse Engineering is here.",
    description: "We built the first engine that understands UI behavior over time. Drag a video, get a production-ready web app. No prompts required.",
    images: ["https://www.replay.build/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white font-poppins overflow-x-hidden">
      {/* Background spotlights (desktop only to avoid mobile jank) */}
      <div className="hidden md:block fixed inset-0 z-0 pointer-events-none opacity-70">
        <Spotlight
          // Brand-orange tuned gradients
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(18, 100%, 70%, .10) 0, hsla(18, 100%, 55%, .03) 52%, hsla(18, 100%, 45%, 0) 82%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(18, 100%, 70%, .07) 0, hsla(18, 100%, 55%, .025) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(18, 100%, 70%, .05) 0, hsla(18, 100%, 45%, .02) 80%, transparent 100%)"
          translateY={-420}
          width={620}
          height={1500}
          smallWidth={260}
          duration={10}
          xOffset={140}
        />
      </div>
      <div className="grain-overlay-landing" />
      
      <LandingNavigation />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO - Centered */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-20">
        {/* RetroGrid only in hero - HIDDEN ON MOBILE for performance */}
        <div className="hidden md:block absolute inset-0 z-0 overflow-hidden">
          <RetroGrid />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 w-full text-center">
          <LandingHero />
        </div>

        <LandingScrollIndicator />
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SUPERPOWERS (The Trifecta/Quadfecta) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LandingSuperpowers />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SOCIAL PROOF / TECH STACK */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LandingSocialProof />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LandingHowItWorks />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* THE DIFFERENCE (Features) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LandingFeatures />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MID-PAGE CTA - Action Banner */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <MidPageCTA />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* USE CASES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LandingUseCases />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PRICING */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LandingPricing />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FAQ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LandingFAQ />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FINAL CTA */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <FinalCTA />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LandingFooter />
    </div>
  );
}
