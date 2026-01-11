import Link from "next/link";
import { Video, Edit3, GitBranch, Globe, Database, Zap, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation - Replay",
  description: "Learn how to use Replay to turn video recordings into production-ready UI code. Quickstart guides, features, and API reference.",
};

export default function DocsPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 text-[#FF6E3C] text-sm">
          <span className="w-2 h-2 rounded-full bg-[#FF6E3C] animate-pulse" />
          Documentation
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Welcome to Replay
        </h1>
        <p className="text-xl text-white/60 max-w-2xl">
          Turn any video into production-ready UI. Record your screen, upload to Replay, 
          and let AI generate clean HTML, CSS, and interactions.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/docs/quickstart"
          className="group p-6 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/10 to-transparent border border-[#FF6E3C]/20 hover:border-[#FF6E3C]/40 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#FF6E3C]/20">
              <Zap className="w-5 h-5 text-[#FF6E3C]" />
            </div>
            <h3 className="text-lg font-semibold text-white">Quickstart</h3>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#FF6E3C] group-hover:translate-x-1 transition-all ml-auto" />
          </div>
          <p className="text-sm text-white/60">
            Get up and running in 5 minutes. Create your first UI from video.
          </p>
        </Link>

        <Link
          href="/docs/features/video-to-ui"
          className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-white/10">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Video to UI</h3>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
          </div>
          <p className="text-sm text-white/60">
            Learn how AI analyzes video to generate pixel-perfect code.
          </p>
        </Link>
      </div>

      {/* What is Replay */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What is Replay?</h2>
        <p className="text-white/70 leading-relaxed">
          Replay is an AI-powered tool that transforms screen recordings into functional web interfaces. 
          Instead of manually coding every component, simply record a demo of any UI, upload it to Replay, 
          and receive production-ready HTML with Tailwind CSS styling.
        </p>
        <p className="text-white/70 leading-relaxed">
          The AI analyzes every frame of your video, detecting:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
          <li>Layout structure (headers, sidebars, grids, cards)</li>
          <li>Navigation patterns and page transitions</li>
          <li>Interactive elements (buttons, forms, modals)</li>
          <li>Color schemes and typography</li>
          <li>Content and copy from the screen</li>
        </ul>
      </div>

      {/* Core Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Core Features</h2>
        <div className="grid gap-4">
          {[
            {
              icon: Video,
              title: "Video to UI Generation",
              description: "Upload any screen recording and get instant HTML/CSS code. Supports complex multi-page flows.",
              href: "/docs/features/video-to-ui",
            },
            {
              icon: Edit3,
              title: "Edit with AI",
              description: "Modify generated code using natural language. Add features, change styles, create new pages.",
              href: "/docs/features/edit-with-ai",
            },
            {
              icon: GitBranch,
              title: "Flow Map",
              description: "Visual representation of your app's page structure. See navigation paths and page relationships.",
              href: "/docs/features/flow-map",
            },
            {
              icon: Globe,
              title: "One-Click Publish",
              description: "Deploy your project instantly to replay.build with a unique URL. Share with anyone.",
              href: "/docs/features/publish",
            },
            {
              icon: Database,
              title: "Supabase Integration",
              description: "Connect your database and generate code that fetches real data from your tables.",
              href: "/docs/integrations/supabase",
            },
          ].map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="p-2 rounded-lg bg-white/10 group-hover:bg-[#FF6E3C]/20 transition-colors">
                <feature.icon className="w-5 h-5 text-white/60 group-hover:text-[#FF6E3C] transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white group-hover:text-[#FF6E3C] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/50 mt-1">{feature.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#FF6E3C] group-hover:translate-x-1 transition-all mt-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Record", description: "Capture your screen showing any UI" },
            { step: "2", title: "Upload", description: "Drop video into Replay" },
            { step: "3", title: "Generate", description: "AI creates HTML/CSS code" },
            { step: "4", title: "Publish", description: "Deploy with one click" },
          ].map((item) => (
            <div key={item.step} className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <h4 className="font-medium text-white mb-1">{item.title}</h4>
              <p className="text-sm text-white/50">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF3C6E]/20 border border-[#FF6E3C]/20 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Ready to start?</h3>
        <p className="text-white/60 mb-6">Create your first UI from video in under 5 minutes.</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/docs/quickstart"
            className="px-6 py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF6E3C]/90 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Open App
          </Link>
        </div>
      </div>
    </div>
  );
}
