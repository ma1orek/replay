import { BarChart3, Code2, Eye, Layers, Palette, Sparkles } from "lucide-react";

export function LandingSocialProof() {
  return (
    <section className="relative z-10 py-20 border-t border-white/[0.03]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-xs text-white/30 uppercase tracking-[0.2em] mb-8">
            Built on production-grade libraries & modern effects
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "React", icon: Code2 },
              { name: "Tailwind CSS", icon: Palette },
              { name: "Framer Motion", icon: Sparkles, desc: "Animations" },
              { name: "Shadcn UI", icon: Layers, desc: "Accessible Components" },
              { name: "Aceternity UI", icon: Eye, desc: "Modern Effects" },
              { name: "Magic UI", icon: Sparkles, desc: "Animations" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <tech.icon className="w-4 h-4 text-[#FF6E3C]" />
                <span className="text-sm text-white/50">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
