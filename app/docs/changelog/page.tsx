import Link from "next/link";
import { Clock, Sparkles, Bug, Wrench, ArrowUp, Bell } from "lucide-react";

const changelog = [
  {
    date: "January 2, 2026",
    version: "1.2.0",
    changes: [
      {
        type: "feature",
        title: "Supabase Database Integration",
        description: "Connect your Supabase database and generate code that fetches real data. AI now understands your table schema."
      },
      {
        type: "feature",
        title: "Project Settings Modal",
        description: "New settings panel with General, Secrets, Database, and Analytics tabs."
      },
      {
        type: "feature",
        title: "Real-time Table Detection",
        description: "Database tab shows your actual tables with row counts. RLS instructions included."
      },
      {
        type: "improvement",
        title: "Better AI Page Generation",
        description: "Improved prompts for creating new pages with @PageName syntax. AI now respects existing navigation."
      },
      {
        type: "fix",
        title: "localStorage Quota Fix",
        description: "Fixed QuotaExceededError by limiting history size and code storage."
      },
      {
        type: "fix",
        title: "Avatar Upload",
        description: "Fixed avatar upload functionality with crop support."
      },
    ]
  },
  {
    date: "December 28, 2025",
    version: "1.1.0",
    changes: [
      {
        type: "feature",
        title: "Style Injection Presets",
        description: "Added 10+ style presets including Neon Glow, Glassmorphism, Brutalist, and more."
      },
      {
        type: "feature",
        title: "Flow Map Visualization",
        description: "Visual map showing page structure and navigation paths."
      },
      {
        type: "improvement",
        title: "Video Trimming",
        description: "Trim videos before generation to focus on specific sections."
      },
      {
        type: "fix",
        title: "Mobile Navigation",
        description: "Fixed hamburger menu and responsive layouts."
      },
    ]
  },
  {
    date: "December 20, 2025",
    version: "1.0.0",
    changes: [
      {
        type: "feature",
        title: "Initial Release",
        description: "Replay launches with Video to UI generation, Edit with AI, and one-click publishing."
      },
      {
        type: "feature",
        title: "Gemini Integration",
        description: "Powered by Google Gemini for video analysis and code generation."
      },
      {
        type: "feature",
        title: "Credit System",
        description: "Pay-as-you-go credits with Pro and Agency subscription plans."
      },
    ]
  },
];

const typeConfig = {
  feature: { icon: Sparkles, color: "text-green-400", bg: "bg-green-500/10", label: "New" },
  fix: { icon: Bug, color: "text-red-400", bg: "bg-red-500/10", label: "Fix" },
  improvement: { icon: ArrowUp, color: "text-blue-400", bg: "bg-blue-500/10", label: "Improved" },
};

export default function ChangelogPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white">Changelog</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <Clock className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-white">Changelog</h1>
        </div>
        <p className="text-xl text-white/60">
          All the latest updates, improvements, and fixes to Replay.
        </p>
      </div>

      {/* Subscribe */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
        <Bell className="w-4 h-4 text-[#FF6E3C]" />
        <p className="text-sm text-white/70">
          Follow <a href="https://twitter.com/replaybuild" target="_blank" rel="noopener noreferrer" className="text-[#FF6E3C] hover:underline">@replaybuild</a> on Twitter for the latest updates.
        </p>
      </div>

      {/* Changelog entries */}
      <div className="space-y-12">
        {changelog.map((release) => (
          <div key={release.version} className="relative">
            {/* Version header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#FF6E3C]/20 text-[#FF6E3C] text-sm font-mono">
                  v{release.version}
                </span>
                <span className="text-white/50 text-sm">{release.date}</span>
              </div>
            </div>

            {/* Changes */}
            <div className="space-y-4 ml-4 border-l-2 border-white/10 pl-6">
              {release.changes.map((change, i) => {
                const config = typeConfig[change.type as keyof typeof typeConfig];
                return (
                  <div key={i} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-white/20" />
                    
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.bg} ${config.color}`}>
                          <config.icon className="w-3 h-3" />
                          {config.label}
                        </span>
                        <h3 className="font-medium text-white">{change.title}</h3>
                      </div>
                      <p className="text-sm text-white/60">{change.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Earlier versions */}
      <div className="text-center py-8 border-t border-white/10">
        <p className="text-white/40 text-sm">
          Showing recent releases. For full history, see our{" "}
          <a href="https://github.com/ma1orek/replay/releases" target="_blank" rel="noopener noreferrer" className="text-[#FF6E3C] hover:underline">
            GitHub releases
          </a>.
        </p>
      </div>
    </div>
  );
}

