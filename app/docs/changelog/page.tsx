import Link from "next/link";
import { Clock, Sparkles, Bug, ArrowUp, Bell } from "lucide-react";

const changelog = [
  {
    date: "February 11, 2026",
    version: "2.4.0",
    changes: [
      {
        type: "improvement",
        title: "Disabled Fuzzy Matching in SEARCH/REPLACE",
        description: "SEARCH/REPLACE mode now uses only exact + normalized whitespace matching. Removed fuzzy matching (85% similarity) and anchor matching which were causing wrong code replacements. Large changes (replace animation, remove, redesign, >15 words) automatically use Full HTML mode instead."
      },
      {
        type: "improvement",
        title: "Smart Edit Mode Selection",
        description: "AI editor now intelligently picks between SEARCH/REPLACE (for small, precise edits) and Full HTML (for large structural changes). Translations, new pages, image edits, and complex requests automatically use Full HTML. Simple color/text changes use fast SEARCH/REPLACE."
      },
      {
        type: "fix",
        title: "Published Pages Cache-Busting v4",
        description: "Open button now generates unique URL on EVERY click using onClick handler: ?v=timestamp&_=millis.random. Previous versions generated random at render time, causing same URL on repeated clicks. Now published pages ALWAYS show fresh version."
      },
      {
        type: "fix",
        title: "Vercel Edge Cache Bypass",
        description: "Added s-maxage=0 and stale-while-revalidate=0 headers to /p/[slug] route. Eliminates Vercel CDN caching of published pages. Combined with onClick cache-buster for zero-cache guarantee."
      },
      {
        type: "fix",
        title: "Levenshtein Loop Bug",
        description: "Fixed critical infinite loop in fuzzy matching algorithm. Inner loop condition used 'i' instead of 'j' (for (let j = 1; i <= a.length; j++)), causing wrong matches and page corruption. Now: for (let j = 1; j <= a.length; j++)."
      },
      {
        type: "improvement",
        title: "Token Efficiency in AI Edits",
        description: "SEARCH/REPLACE mode: 10-30K → 200-2000 output tokens. Latency: 8-25s → 2-5s. Near-zero code corruption with exact matching only."
      },
    ]
  },
  {
    date: "February 10, 2026",
    version: "2.3.0",
    changes: [
      {
        type: "feature",
        title: "Reconstruct vs Reimagine Modes",
        description: "New generation mode toggle in the sidebar. Reconstruct faithfully reproduces video layouts. Reimagine creates a brand-new creative design with the same content, using 18+ animation patterns (GSAP, parallax, glassmorphism, split-text, snap carousels, and more)."
      },
      {
        type: "feature",
        title: "reactbits.dev Animation Library",
        description: "Reimagine mode integrates 18 animation patterns from reactbits.dev: split text entrance, scroll reveal, stagger cards, count-up numbers, gradient text, glitch text, spotlight cards, infinite marquee, film grain, aurora backgrounds, floating particles, glassmorphism, hover lift, star border, parallax, custom scrollbars, and horizontal snap carousels."
      },
      {
        type: "improvement",
        title: "Dashboard Layout Rules",
        description: "Both modes now handle dashboard/app UIs correctly: CSS Grid sidebar + main area with min-width:0 to prevent chart and table overflow."
      },
      {
        type: "improvement",
        title: "Testimonial Carousel Enforcement",
        description: "Testimonials are always rendered as horizontal snap carousels (never vertical stacks). Each card has fixed width with scroll-to-reveal behavior."
      },
      {
        type: "improvement",
        title: "Text Visibility & Word Wrapping",
        description: "Headlines use responsive clamp() sizing instead of fixed sizes. Split-text animations preserve word boundaries — no more mid-word line breaks like 'peo ple'."
      },
      {
        type: "improvement",
        title: "Custom Scrollbars",
        description: "Reimagine mode outputs sleek thin scrollbars (WebKit + Firefox) instead of browser defaults, both page-wide and on carousel containers."
      },
      {
        type: "fix",
        title: "504 Timeout Streaming",
        description: "All video generation now uses streaming route with server-side video fetch, eliminating 504 timeouts on large files."
      },
      {
        type: "fix",
        title: "Empty Sections Prevention",
        description: "Zero-tolerance rule ensures every generated section contains real content — no empty cards or placeholder-only blocks."
      },
    ]
  },
  {
    date: "February 8, 2026",
    version: "2.2.0",
    changes: [
      {
        type: "feature",
        title: "Enterprise Library Taxonomy",
        description: "Component Library now uses industry-standard 5-layer architecture: Foundations, Components (6 subcategories), Patterns, Templates, and Product Modules. Follows Carbon/Spectrum/Atlassian design system standards."
      },
      {
        type: "feature",
        title: "Design System Import",
        description: "Import Design Systems from any Storybook URL. Tokens (colors, typography, spacing) are extracted and applied consistently across all generated code."
      },
      {
        type: "feature",
        title: "Flow Map Reconstruct",
        description: "Click on detected navigation paths in Flow Map to reconstruct pages not shown in the original video. AI generates new subpages matching your existing design."
      },
      {
        type: "feature",
        title: "Project Export",
        description: "Download your entire project as a zip package including all components, design tokens, and configuration files."
      },
      {
        type: "improvement",
        title: "Editor Canvas Improvements",
        description: "Components now auto-size to their real rendered dimensions. Layer labels (Foundations, Components, Patterns, etc.) appear on the canvas. Google Fonts (Inter) load correctly in all previews."
      },
      {
        type: "improvement",
        title: "DS Color Consistency",
        description: "When a Design System is active, DS colors now override video-detected colors consistently across all sections — header, content, sidebar, and footer."
      },
      {
        type: "improvement",
        title: "Flow Map Detection",
        description: "Broadened multi-page detection to recognize anchor navigation, section IDs, and more Alpine.js variable patterns (activeTab, selected, view, section)."
      },
      {
        type: "fix",
        title: "Preview Refresh Crash",
        description: "Fixed a crash that occurred when clicking the refresh button on malformed or incomplete code. Now gracefully recovers."
      },
      {
        type: "fix",
        title: "Font Loading in Previews",
        description: "Google Fonts (Inter) now load correctly in Library and Editor component previews. Previously only system fonts were used."
      },
    ]
  },
  {
    date: "February 2, 2026",
    version: "2.1.0",
    changes: [
      {
        type: "feature",
        title: "Sandbox Demo Mode",
        description: "New users can explore a full demo project without signing up. Experience Flow Map, Library, and Editor in read-only mode."
      },
      {
        type: "feature",
        title: "Agency Plan ($499/mo)",
        description: "New Agency tier with 15,000 credits/month, 5 team members, shared Design System, and priority GPU access."
      },
      {
        type: "feature",
        title: "Gemini 3 Agentic Vision",
        description: "Upgraded AI pipeline using Gemini 3 Pro for generation and Gemini 3 Flash for Surveyor measurements and QA testing."
      },
      {
        type: "improvement",
        title: "Blueprints renamed to Editor",
        description: "Visual component editor is now simply called 'Editor' for clarity."
      },
      {
        type: "improvement",
        title: "Updated Pricing & Docs",
        description: "Aligned all documentation with current pricing: ~150 credits/generation, ~10 credits/edit."
      },
    ]
  },
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
        title: "Visual Editor",
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
