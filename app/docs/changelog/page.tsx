import Link from "next/link";
import { Clock, Sparkles, Bug, ArrowUp, Bell } from "lucide-react";

const changelog = [
  {
    date: "January 26, 2026",
    version: "2.0.0",
    changes: [
      {
        type: "feature",
        title: "Component Library (Storybook-style)",
        description: "Extract components from your generated UI. View with Controls, Actions, Visual Tests, Accessibility checks, and Usage examples."
      },
      {
        type: "feature",
        title: "Blueprints Visual Editor",
        description: "Visual canvas for component composition. Drag, resize, and edit components with AI assistance."
      },
      {
        type: "feature",
        title: "Advanced Color Picker",
        description: "New color picker with saturation/hue controls, contrast ratio checking, and preset swatches."
      },
      {
        type: "improvement",
        title: "Unified Dark Theme Docs",
        description: "Complete documentation redesign with dark theme matching the main application."
      },
      {
        type: "improvement",
        title: "Auto-load Library Data",
        description: "Component library now auto-loads when opening a project via URL."
      },
    ]
  },
  {
    date: "January 14, 2026",
    version: "1.8.0",
    changes: [
      {
        type: "feature",
        title: "Accessibility Improvements (WCAG)",
        description: "Full keyboard navigation support. Focus trap for all modals - TAB never escapes open modals. Visible focus rings on all interactive elements. aria-labels on icon-only buttons."
      },
      {
        type: "feature",
        title: "Project Dropdown Redesign",
        description: "New clickable Project button with ChevronDown icon, visible background and border. 'Create New Project' at top of dropdown (highlighted in brand color). Better visual hierarchy."
      },
      {
        type: "feature",
        title: "Edit Name Quick Action",
        description: "Quickly rename projects from context menu in project list. No need to open settings modal for simple rename."
      },
      {
        type: "improvement",
        title: "Unified Desktop Layout",
        description: "Aligned top bars - Logo section and main top bar now same height (h-12). Removed duplicate mobile view toggle from center. Publish button always in brand color."
      },
      {
        type: "improvement",
        title: "Semantic HTML Refactor",
        description: "Converted clickable divs to semantic buttons for keyboard accessibility. All interactive elements now reachable via TAB key."
      },
    ]
  },
  {
    date: "January 10, 2026",
    version: "1.7.0",
    changes: [
      {
        type: "feature",
        title: "Redesigned Loading State",
        description: "Beautiful skeleton loader with animated Replay logo during generation. Rotating pro tips educate users while they wait. Smooth animations that don't restart."
      },
      {
        type: "feature",
        title: "Spotlight Background Effects",
        description: "Subtle animated spotlight effects on landing page for premium visual depth. Dynamic light beams move gently across the background."
      },
      {
        type: "improvement",
        title: "Edit with AI UI Overhaul",
        description: "Removed nested box design - now single clean frame with live code streaming. Header shows status and line count, code area streams in real-time."
      },
    ]
  },
  {
    date: "January 9, 2026",
    version: "1.6.0",
    changes: [
      {
        type: "feature",
        title: "Mobile-Optimized Landing Page",
        description: "Complete mobile redesign: simplified hero animation, removed scroll-blocking effects, stacked card layout, background videos with pointer-events-none."
      },
      {
        type: "feature",
        title: "Profile Menu Modal",
        description: "Profile button now opens dropdown modal on both landing and tool pages. Shows credits, plan, settings link, and sign out - consistent across app."
      },
      {
        type: "improvement",
        title: "Extended Video Limit",
        description: "Free accounts now get 5-minute video limit (up from 30 seconds). Better testing experience based on user feedback."
      },
    ]
  },
  {
    date: "January 5, 2026",
    version: "1.4.0",
    changes: [
      {
        type: "feature",
        title: "Supabase-First Architecture",
        description: "All generation history now saves to Supabase as primary storage. No more localStorage quota crashes. Unlimited history, syncs across devices."
      },
      {
        type: "feature",
        title: "Style Reference Mode",
        description: "Upload any image and Replay will copy its exact visual style - colors, typography, border-radius, shadows. Video provides content, image provides design."
      },
      {
        type: "fix",
        title: "Memory Crash Fix",
        description: "Fixed infinite loop and out-of-memory crash caused by localStorage quota exceeded errors."
      },
    ]
  },
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
        type: "improvement",
        title: "Better AI Page Generation",
        description: "Improved prompts for creating new pages with @PageName syntax. AI now respects existing navigation."
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
  feature: { icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "New" },
  fix: { icon: Bug, color: "text-red-400", bg: "bg-red-500/10", label: "Fix" },
  improvement: { icon: ArrowUp, color: "text-blue-400", bg: "bg-blue-500/10", label: "Improved" },
};

export default function ChangelogPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white">Changelog</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <Clock className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Changelog</h1>
        </div>
        <p className="text-xl text-zinc-400">
          All the latest updates, improvements, and fixes to Replay.
        </p>
      </div>

      {/* Subscribe */}
      <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-center gap-2">
        <Bell className="w-4 h-4 text-zinc-400" />
        <p className="text-sm text-zinc-400">
          Follow <a href="https://twitter.com/replaybuild" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">@replaybuild</a> on Twitter for the latest updates.
        </p>
      </div>

      {/* Changelog entries */}
      <div className="space-y-12">
        {changelog.map((release) => (
          <div key={release.version} className="relative">
            {/* Version header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm font-mono">
                  v{release.version}
                </span>
                <span className="text-zinc-500 text-sm">{release.date}</span>
              </div>
            </div>

            {/* Changes */}
            <div className="space-y-4 ml-4 border-l-2 border-zinc-700 pl-6">
              {release.changes.map((change, i) => {
                const config = typeConfig[change.type as keyof typeof typeConfig];
                return (
                  <div key={i} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-zinc-900 border-2 border-zinc-600" />
                    
                    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.bg} ${config.color}`}>
                          <config.icon className="w-3 h-3" />
                          {config.label}
                        </span>
                        <h3 className="font-medium text-white">{change.title}</h3>
                      </div>
                      <p className="text-sm text-zinc-400">{change.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Earlier versions */}
      <div className="text-center py-8 border-t border-zinc-700">
        <p className="text-zinc-500 text-sm">
          Showing recent releases. For full history, see our{" "}
          <a href="https://github.com/ma1orek/replay/releases" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">
            GitHub releases
          </a>.
        </p>
      </div>
    </div>
  );
}
