import Link from "next/link";
import { GitBranch, Eye, Plus, MousePointer, Layers } from "lucide-react";

export default function FlowMapPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Features</span>
          <span>/</span>
          <span className="text-white">Flow Map</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <GitBranch className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Flow Map</h1>
        </div>
        <p className="text-xl text-zinc-400">
          Visual representation of your app's page structure and navigation paths.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-zinc-400 leading-relaxed">
          The Flow Map provides a bird's-eye view of your generated application. It shows all pages 
          detected from your video, their relationships, and navigation paths. Think of it as a 
          sitemap that updates in real-time as you add or modify pages.
        </p>
      </div>

      {/* Node types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Node Types</h2>
        <div className="grid gap-4">
          {[
            {
              icon: Eye,
              title: "Observed",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
              description: "Pages that were actually shown in your video recording. These have full content generated."
            },
            {
              icon: Plus,
              title: "Generated",
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
              description: "Pages created via Edit with AI using @PageName syntax. Added after initial generation."
            },
            {
              icon: Layers,
              title: "Possible",
              color: "text-zinc-400",
              bg: "bg-zinc-800/50 border-zinc-700",
              description: "Navigation items detected but not visited in the video. Click to generate these pages."
            },
          ].map((node) => (
            <div key={node.title} className={`p-4 rounded-xl ${node.bg} border`}>
              <div className="flex items-center gap-3 mb-2">
                <node.icon className={`w-5 h-5 ${node.color}`} />
                <h3 className="font-medium text-white">{node.title}</h3>
              </div>
              <p className="text-sm text-zinc-400">{node.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Features</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-2">View Code</h4>
            <p className="text-sm text-zinc-400">
              Click on any observed or generated node to view its HTML code in the Code View panel.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-2">Reconstruct Pages</h4>
            <p className="text-sm text-zinc-400">
              Click on any detected path to reconstruct pages not shown in the original video.
              The AI generates a new subpage matching your existing design system and connects it
              to the navigation flow automatically.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-2">Generate New Pages</h4>
            <p className="text-sm text-zinc-400">
              Click "+ Generate" on possible nodes to create new pages. The AI will match your existing design system.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-2">Navigation Paths</h4>
            <p className="text-sm text-zinc-400">
              Lines between nodes show how pages are connected via navigation links.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-2">Smart Detection</h4>
            <p className="text-sm text-zinc-400">
              Flow Map detects pages from multiple patterns: Alpine.js multi-page structures,
              anchor-based navigation, section IDs, tab/panel patterns, and navigation menu items.
              Detection covers variables like activeTab, currentPage, selected, view, and section.
            </p>
          </div>
        </div>
      </div>

      {/* How to access */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How to Access</h2>
        <p className="text-zinc-400 leading-relaxed">
          Click the <strong className="text-white">"Flow"</strong> tab in the top toolbar after generating your UI.
          The Flow Map appears in the left sidebar.
        </p>
      </div>

      {/* Tips */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Tips</h2>
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <MousePointer className="w-4 h-4 text-zinc-500 mt-0.5" />
              <span>Hover over nodes to see page details</span>
            </li>
            <li className="flex items-start gap-2">
              <MousePointer className="w-4 h-4 text-zinc-500 mt-0.5" />
              <span>Click a node to navigate to that page in preview</span>
            </li>
            <li className="flex items-start gap-2">
              <MousePointer className="w-4 h-4 text-zinc-500 mt-0.5" />
              <span>Use Flow Map to identify missing pages in your app</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
