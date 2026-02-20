import Link from "next/link";
import { Video, Edit3, GitBranch, Globe, Database, Zap, ArrowRight, BookOpen, Layers, LayoutGrid } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation - Replay",
  description: "Learn how to use Replay to turn video recordings into complete design systems with components, documentation, and visual editing.",
};

export default function DocsPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Documentation
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Welcome to Replay
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl">
          Turn any screen recording into a complete design system. Extract components, 
          generate documentation, and edit components visually with AI.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/docs/quickstart"
          className="group p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-zinc-700">
              <Zap className="w-5 h-5 text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Quickstart</h3>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
          </div>
          <p className="text-sm text-zinc-400">
            Get up and running in 5 minutes. Create your first design system from video.
          </p>
        </Link>

        <Link
          href="/docs/features/library"
          className="group p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-zinc-700">
              <BookOpen className="w-5 h-5 text-zinc-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Component Library</h3>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
          </div>
          <p className="text-sm text-zinc-400">
            Learn about the Storybook-style component library with controls and docs.
          </p>
        </Link>
      </div>

      {/* What is Replay */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What is Replay?</h2>
        <p className="text-zinc-400 leading-relaxed">
          Replay is an AI-powered design system generator. Upload any screen recording of an app or website, 
          and Replay will extract components, generate documentation, and create an interactive design system 
          you can edit, customize, and publish.
        </p>
        <p className="text-zinc-400 leading-relaxed">
          Powered by <strong className="text-white">Gemini 3.1 Pro</strong> for code generation and <strong className="text-white">Gemini 3.1 Flash with Agentic Vision</strong> for precise UI measurements.
        </p>
        <p className="text-zinc-400 leading-relaxed">
          The AI analyzes your video to detect:
        </p>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
          <li>UI components (buttons, cards, inputs, navigation)</li>
          <li>Component props and variants (sizes, colors, states)</li>
          <li>Layout patterns and responsive behavior</li>
          <li>Navigation flows and page structure</li>
          <li>Design tokens (colors, typography, spacing)</li>
        </ul>
      </div>

      {/* Core Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Core Features</h2>
        <div className="grid gap-4">
          {[
            {
              icon: BookOpen,
              title: "Component Library",
              description: "Storybook-style docs with Controls, Actions, Visual Tests, Accessibility checks, and Usage examples.",
              href: "/docs/features/library",
            },
            {
              icon: LayoutGrid,
              title: "Editor",
              description: "Visual canvas to arrange components, edit with AI, and build layouts interactively.",
              href: "/docs/features/blueprints",
            },
            {
              icon: GitBranch,
              title: "Flow Map",
              description: "Interactive visualization of page navigation and user flows detected from video.",
              href: "/docs/features/flow-map",
            },
            {
              icon: Edit3,
              title: "AI Editing",
              description: "Modify components with natural language: 'Make it red', 'Add shadow', 'Change icon'.",
              href: "/docs/features/edit-with-ai",
            },
            {
              icon: Globe,
              title: "One-Click Publish",
              description: "Deploy your design system instantly to replay.build with a unique URL.",
              href: "/docs/features/publish",
            },
            {
              icon: Database,
              title: "Supabase Integration",
              description: "Connect your database and generate components with real data fetching.",
              href: "/docs/integrations/supabase",
            },
          ].map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group flex items-start gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
            >
              <div className="p-2 rounded-lg bg-zinc-700 group-hover:bg-zinc-600 transition-colors">
                <feature.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white group-hover:text-zinc-200 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">{feature.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all mt-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">How It Works</h2>
        <div className="grid md:grid-cols-5 gap-4">
          {[
            { step: "1", title: "Record", description: "Capture any UI on screen" },
            { step: "2", title: "Upload", description: "Drop video into Replay" },
            { step: "3", title: "Extract", description: "AI detects components" },
            { step: "4", title: "Edit", description: "Customize with AI chat" },
            { step: "5", title: "Publish", description: "Deploy with one click" },
          ].map((item) => (
            <div key={item.step} className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <h4 className="font-medium text-white mb-1">{item.title}</h4>
              <p className="text-sm text-zinc-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Views Overview */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Interface Views</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <Layers className="w-5 h-5 text-zinc-400" />
              <h3 className="font-semibold text-white">Preview</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Live preview of generated UI. See your design system in action with responsive viewport toggles.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-zinc-400" />
              <h3 className="font-semibold text-white">Library</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Component documentation with interactive controls, prop tables, and accessibility audits.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <LayoutGrid className="w-5 h-5 text-zinc-400" />
              <h3 className="font-semibold text-white">Editor</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Visual canvas for component composition. Drag, resize, and edit components with AI assistance.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <GitBranch className="w-5 h-5 text-zinc-400" />
              <h3 className="font-semibold text-white">Flow</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Navigation map showing page relationships and user flows detected from your recording.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 rounded-2xl bg-zinc-800/50 border border-zinc-700 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Ready to start?</h3>
        <p className="text-zinc-400 mb-6">Create your first design system from video in under 5 minutes.</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/docs/quickstart"
            className="px-6 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-medium transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-white font-medium transition-colors"
          >
            Open App
          </Link>
        </div>
      </div>
    </div>
  );
}
