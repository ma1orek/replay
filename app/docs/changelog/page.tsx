import Link from "next/link";
import { Clock, Sparkles, Bug, Wrench, ArrowUp, Bell } from "lucide-react";

const changelog = [
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
      {
        type: "fix",
        title: "Project Settings Modal Name",
        description: "Settings modal now correctly displays actual project name instead of 'Untitled Project' when opened."
      },
      {
        type: "fix",
        title: "Focus Lock Library",
        description: "Added react-focus-lock to prevent focus escaping modals. Returns focus to trigger button on close."
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
        title: "FlipWords Hero Animation",
        description: "Smoother text transitions in hero section. Reduced gap between word changes by 50%. Uses popLayout mode for seamless text swaps."
      },
      {
        type: "improvement",
        title: "Edit with AI UI Overhaul",
        description: "Removed nested box design - now single clean frame with live code streaming. Header shows status and line count, code area streams in real-time."
      },
      {
        type: "improvement",
        title: "Reconstruct Button",
        description: "Larger, more prominent button with simple play icon. Better disabled/active states. Smaller Configuration text to improve visual hierarchy."
      },
      {
        type: "fix",
        title: "Skeleton Animation Restart",
        description: "Fixed skeleton loader restarting animation when analysis lines load. Now uses staggered CSS animations that run smoothly throughout generation."
      },
      {
        type: "fix",
        title: "Tip Color Accessibility",
        description: "Changed loading tip color from red/pink to blue. Red was confusing users (red = error). Tips now centered with better contrast."
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
        type: "feature",
        title: "Hover Glow on Cards",
        description: "Subtle orange glow effect on card hover for interactive feel. Uses exact brand color #FF6E3C. Disabled on mobile to prevent scroll issues."
      },
      {
        type: "feature",
        title: "Moving Border Button Effect",
        description: "Premium animated border effect component for CTAs. Orange gradient border that moves around the button continuously."
      },
      {
        type: "improvement",
        title: "Extended Video Limit",
        description: "Free accounts now get 5-minute video limit (up from 30 seconds). Better testing experience based on user feedback."
      },
      {
        type: "improvement",
        title: "Text Contrast Accessibility",
        description: "Improved contrast throughout landing page. Upload icons, configuration text, and other elements now more visible."
      },
      {
        type: "improvement",
        title: "RetroGrid Positioning",
        description: "Background grid animation now stays in hero section only. Fixed issue where it scrolled with the page."
      },
      {
        type: "improvement",
        title: "Card Styling Overhaul",
        description: "All cards restyled to match Pricing card aesthetic. Darker backgrounds, grain texture overlay, consistent border styling."
      },
      {
        type: "fix",
        title: "Hero Text Line Break",
        description: "Fixed 'Production-Ready Code' breaking to 2 lines. Added whitespace-nowrap and max-width constraints. Text stays on single line on desktop."
      },
      {
        type: "fix",
        title: "Video Autoplay on Mobile",
        description: "Background videos now properly autoplay, loop, and are muted on mobile. Added preload='auto' for faster loading."
      },
      {
        type: "fix",
        title: "GlowCard Mobile Scroll Block",
        description: "Removed glow animation on mobile that was blocking scroll. Cards now use static styling on touch devices."
      },
    ]
  },
  {
    date: "January 8, 2026",
    version: "1.5.0",
    changes: [
      {
        type: "feature",
        title: "Text Generate Effect",
        description: "Beautiful word-by-word blur fade-in animation on landing page hero. Integrated Aceternity UI component for smooth text reveals."
      },
      {
        type: "feature",
        title: "Delete Confirmation Modal",
        description: "Projects now require confirmation before deletion. Modal shows project title and prevents accidental deletions."
      },
      {
        type: "feature",
        title: "Edit with AI Chat Response",
        description: "AI now explains what changes it made in the chat after each edit. See exactly what was modified without comparing code."
      },
      {
        type: "improvement",
        title: "Extended History",
        description: "History now shows up to 500 projects (up from 100). See your full generation history across all sessions."
      },
      {
        type: "improvement",
        title: "Demo Project Loading",
        description: "Demo projects now load correctly from history. Fixed 404 errors and duplicate key issues when loading demos."
      },
      {
        type: "improvement",
        title: "Project Duplication",
        description: "Fixed empty project issue when duplicating. Duplication now properly copies all code, versions, and metadata."
      },
      {
        type: "improvement",
        title: "Version History",
        description: "Removed duplicate 'Initial generation' entries. Version count now correctly reflects actual edit history."
      },
      {
        type: "fix",
        title: "Image Paste in Chat",
        description: "Fixed Ctrl+V image pasting in Edit with AI. Images now upload to Supabase and convert to base64 for AI processing."
      },
      {
        type: "fix",
        title: "Title Saving",
        description: "Project title changes now save immediately to database. No more lost renames after refresh."
      },
      {
        type: "fix",
        title: "Aurora Background Animation",
        description: "Aurora beams now animate smoothly with subtle movement. Fixed static background issue."
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
        type: "improvement",
        title: "Fresh Start Experience",
        description: "Tool now starts with a clean slate by default. Access previous work via the History button - always visible even for new accounts."
      },
      {
        type: "improvement",
        title: "Consistent Empty States",
        description: "Flow, Code, Preview, and Design System tabs now share the same beautiful empty state with animated Replay logo."
      },
      {
        type: "fix",
        title: "Memory Crash Fix",
        description: "Fixed infinite loop and out-of-memory crash caused by localStorage quota exceeded errors."
      },
    ]
  },
  {
    date: "January 4, 2026",
    version: "1.3.0",
    changes: [
      {
        type: "feature",
        title: "AI Chat Interface",
        description: "New chat-based editing experience. Have a conversation with AI to refine your generated code. Supports image uploads for visual reference."
      },
      {
        type: "feature",
        title: "Auto SEO Blog Generator",
        description: "Admin panel can now auto-generate unlimited SEO-optimized blog articles. AI creates unique topics, avoids duplicates, and publishes instantly."
      },
      {
        type: "feature",
        title: "Meta Pixel Integration",
        description: "Full Facebook Conversions API integration with all standard events: PageView, Purchase, Subscribe, Lead, InitiateCheckout, and more."
      },
      {
        type: "feature",
        title: "WebGL Shader Styles",
        description: "New Liquid Neon style with ray-marched nebula shader, Matrix Rain with falling code, and other premium WebGL effects."
      },
      {
        type: "improvement",
        title: "Auto-Switch to Preview",
        description: "Generation now automatically switches to Preview tab so you see results immediately."
      },
      {
        type: "improvement",
        title: "Video Player Fix",
        description: "Landing page video player now works reliably with proper play/pause, mute toggle, and progress bar."
      },
    ]
  },
  {
    date: "January 3, 2026",
    version: "1.2.1",
    changes: [
      {
        type: "feature",
        title: "Admin User Management",
        description: "Toggle user membership (PRO/Free) directly from admin panel. View and manage all users with their credit balances."
      },
      {
        type: "feature",
        title: "Stripe Plan Integration",
        description: "Pricing page buttons now correctly redirect to Stripe checkout. Non-logged users go to login first, then Stripe."
      },
      {
        type: "improvement",
        title: "Project Settings Responsive",
        description: "Settings modal is now fully responsive - full-screen on mobile with scrollable tabs."
      },
      {
        type: "improvement",
        title: "Share Tab in Settings",
        description: "Analytics tab replaced with Share tab showing project URL, social share buttons, and embed code."
      },
      {
        type: "fix",
        title: "Feedback Popup Timing",
        description: "Feedback popup now appears 10 seconds after first generation, not immediately."
      },
      {
        type: "fix",
        title: "Blog SEO Score Hidden",
        description: "SEO Score removed from public article pages - it's internal info only."
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

