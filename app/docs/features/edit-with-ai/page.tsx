import Link from "next/link";
import { Edit3, Sparkles, Code, Image, ArrowRight } from "lucide-react";

export default function EditWithAIPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Features</span>
          <span>/</span>
          <span className="text-white">Edit with AI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <Edit3 className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Edit with AI</h1>
        </div>
        <p className="text-xl text-zinc-400">
          Modify your generated code using natural language prompts.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-zinc-400 leading-relaxed">
          After generating your initial UI, use Edit with AI to make changes without writing code.
          Simply describe what you want to change, and Gemini will update your HTML/CSS accordingly.
        </p>
      </div>

      {/* How to use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How to Use</h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">1</span>
            <div>
              <p className="text-white font-medium">Open the Input panel</p>
              <p className="text-sm text-zinc-500">Click "Input" in the top toolbar or use the sidebar</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">2</span>
            <div>
              <p className="text-white font-medium">Type your edit request</p>
              <p className="text-sm text-zinc-500">Describe what you want to change in natural language</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">3</span>
            <div>
              <p className="text-white font-medium">Press Enter or click Edit</p>
              <p className="text-sm text-zinc-500">AI will process and update your code</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Example prompts */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Example Prompts</h2>
        <div className="space-y-3">
          {[
            { category: "Styling", prompts: [
              "Change the header background to a dark gradient",
              "Make all buttons rounded with shadow",
              "Use a serif font for headings",
              "Add a glassmorphism effect to cards"
            ]},
            { category: "Layout", prompts: [
              "Make the sidebar fixed on scroll",
              "Convert the grid to a 2-column layout on mobile",
              "Add more padding to sections",
              "Center the hero content vertically"
            ]},
            { category: "Content", prompts: [
              "Change the headline to 'Welcome to Our Platform'",
              "Add a testimonials section with 3 cards",
              "Include a FAQ accordion at the bottom",
              "Add placeholder images to all cards"
            ]},
            { category: "Functionality", prompts: [
              "Add a mobile hamburger menu",
              "Make the tabs work with Alpine.js",
              "Add smooth scroll to anchor links",
              "Create a modal for the signup button"
            ]},
          ].map((section) => (
            <div key={section.category} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <h4 className="font-medium text-white mb-3">{section.category}</h4>
              <div className="space-y-2">
                {section.prompts.map((prompt) => (
                  <div key={prompt} className="flex items-center gap-2 text-sm">
                    <Code className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-400 font-mono">"{prompt}"</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Page generation */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Creating New Pages</h2>
        <p className="text-zinc-400 leading-relaxed">
          Use the <code className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">@PageName</code> prefix 
          to generate entirely new pages:
        </p>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 font-mono text-sm">
          <p className="text-emerald-400">// Create a new About page</p>
          <p className="text-zinc-300 mt-1">@About Create this page with team members and company history</p>
          <p className="text-emerald-400 mt-4">// Create a Pricing page</p>
          <p className="text-zinc-300 mt-1">@Pricing Add 3 pricing tiers: Free, Pro, and Enterprise</p>
        </div>
        <p className="text-sm text-zinc-500">
          The AI will generate a complete page matching your existing design system and 
          automatically add it to the navigation.
        </p>
      </div>

      {/* Image uploads */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Using Images</h2>
        <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <Image className="w-6 h-6 text-zinc-400 mt-1" />
          <div>
            <p className="text-white font-medium mb-2">Upload images with your prompt</p>
            <p className="text-sm text-zinc-500">
              Click the image icon to attach reference images. The AI will incorporate 
              them into your design or use them as visual references.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-zinc-900">
              <p className="text-sm text-zinc-400 font-mono">
                "Add this logo to the header" + [uploaded logo.png]
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Database integration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Database-Aware Edits</h2>
        <p className="text-zinc-400 leading-relaxed">
          If you've connected Supabase in Project Settings, AI can generate code that 
          fetches real data from your tables:
        </p>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-zinc-300 font-mono">
            "Show a list of users from my profiles table with their email and join date"
          </p>
          <p className="text-xs text-emerald-400 mt-2">
            → AI will generate supabase.from('profiles').select() code
          </p>
        </div>
        <Link href="/docs/integrations/supabase" className="inline-flex items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors">
          Learn more about Supabase integration <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Smart Edit Engine */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Smart Edit Engine</h2>
        <p className="text-zinc-400 leading-relaxed">
          Replay uses an intelligent dual-mode editing system that picks the best strategy for each request:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-2">SEARCH/REPLACE Mode</h4>
            <p className="text-sm text-zinc-500 mb-3">For small, precise changes</p>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>Change colors, text, fonts</li>
              <li>Add/remove CSS classes</li>
              <li>Swap icons or images</li>
              <li>Tweak spacing or sizing</li>
            </ul>
            <div className="mt-3 p-2 rounded bg-zinc-900 text-xs font-mono text-emerald-400">
              200-2000 tokens, 2-5s latency
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-2">Full HTML Mode</h4>
            <p className="text-sm text-zinc-500 mb-3">For large structural changes</p>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>Add new sections or pages</li>
              <li>Translate entire page</li>
              <li>Redesign layout structure</li>
              <li>Replace images with uploads</li>
            </ul>
            <div className="mt-3 p-2 rounded bg-zinc-900 text-xs font-mono text-zinc-500">
              Full regeneration, 8-25s
            </div>
          </div>
        </div>
        <p className="text-sm text-zinc-500">
          The system automatically selects the right mode. Simple requests use fast SEARCH/REPLACE.
          Complex requests (translations, new pages, redesigns) use Full HTML for accuracy.
        </p>
      </div>

      {/* Structural Protection */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Structural Protection</h2>
        <p className="text-zinc-400 leading-relaxed">
          AI edits include built-in safety checks. If an edit would destroy more than 60% of your page code
          (e.g., replacing an entire page with just one element), the system rejects it and asks for clarification.
          Your original code is always preserved.
        </p>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-400 font-medium">Protection example:</p>
          <p className="text-sm text-zinc-400 mt-1">
            Request: "Fix the chart" &rarr; AI tries to output only a chart (dropping 90% of the page) &rarr;
            Rejected. AI asks: "Did you mean to fix the chart within the existing page?"
          </p>
        </div>
      </div>

      {/* Version history */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Version History</h2>
        <p className="text-zinc-400 leading-relaxed">
          Every edit creates a new version. You can:
        </p>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
          <li>View all previous versions in the sidebar</li>
          <li>Restore any version with one click</li>
          <li>Compare changes between versions</li>
        </ul>
      </div>

      {/* Credits */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Credit Cost</h2>
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-white">Edit with AI</span>
            <span className="font-mono text-zinc-300">~10 credits per edit</span>
          </div>
        </div>
        <p className="text-sm text-zinc-500">
          Each edit request costs ~10 credits, regardless of complexity. New page generation with @PageName also costs ~10 credits.
        </p>
      </div>

      {/* AI Response */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">AI Response in Chat</h2>
        <p className="text-zinc-400 leading-relaxed">
          After each edit, the AI explains what changes it made in the chat window. 
          This helps you understand exactly what was modified without comparing code line by line.
        </p>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-sm text-zinc-400">
              <p className="text-white font-medium mb-1">Done!</p>
              <p>I've made the header sticky with a frosted glass effect. Added backdrop-blur-xl and bg-black/80. The navigation now stays visible while scrolling.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
