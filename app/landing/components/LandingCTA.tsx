import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";

export function MidPageCTA() {
  return (
    <section className="relative z-10 py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6E3C]/10 via-[#FF6E3C]/5 to-transparent border border-[#FF6E3C]/20">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF6E3C]/10 to-transparent opacity-30" />
          
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6">
            <p className="text-base sm:text-lg font-medium text-white/80 text-center sm:text-left">
              Don't just watch the demo. <span className="text-[#FF6E3C]">Try the engine yourself.</span>
            </p>
            
            <Link
              href="/tool"
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF6E3C] text-white font-semibold text-sm hover:bg-[#FF8F5C] transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(255,110,60,0.3)] whitespace-nowrap"
            >
              Try Replay Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="relative z-10 py-32">
      <div className="mx-auto max-w-3xl px-6">
        <GlowCard glowColor="orange" customSize className="!p-0 !gap-0 w-full">
          <div className="relative p-10 md:p-16 text-center">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white/90">
              Prove it to yourself.
            </h2>
            <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-8">
              Upload a video of a baby wipes, a competitor's site, or your ugly prototype. Whatever you want, see what happens.
            </p>
            
            <Link
              href="/tool"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-semibold text-lg shadow-[0_0_40px_rgba(255,110,60,0.4)] hover:shadow-[0_0_60px_rgba(255,110,60,0.6)] transition-all hover:scale-[1.02]"
            >
              Try Replay Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <p className="mt-4 text-sm text-white/40">
              No credit card required • <span className="text-[#FF6E3C]">100 Credits</span> included
            </p>
          </div>
        </GlowCard>
      </div>
    </section>
  );
}
