import Link from "next/link";
import { Edit3, Sparkles, Code, Image, ArrowRight } from "lucide-react";

export default function EditWithAIPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Features</span>
          <span>/</span>
          <span className="text-white">Edit with AI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <Edit3 className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-white">Edit with AI</h1>
        </div>
        <p className="text-xl text-white/60">
          Modify your generated code using natural language prompts.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-white/70 leading-relaxed">
          After generating your initial UI, use Edit with AI to make changes without writing code.
          Simply describe what you want to change, and Gemini will update your HTML/CSS accordingly.
        </p>
      </div>

      {/* How to use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How to Use</h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF6E3C] text-white text-sm flex items-center justify-center">1</span>
            <div>
              <p className="text-white font-medium">Open the Input panel</p>
              <p className="text-sm text-white/60">Click "Input" in the top toolbar or use the sidebar</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF6E3C] text-white text-sm flex items-center justify-center">2</span>
            <div>
              <p className="text-white font-medium">Type your edit request</p>
              <p className="text-sm text-white/60">Describe what you want to change in natural language</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF6E3C] text-white text-sm flex items-center justify-center">3</span>
            <div>
              <p className="text-white font-medium">Press Enter or click Edit</p>
              <p className="text-sm text-white/60">AI will process and update your code</p>
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
            <div key={section.category} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-medium text-white mb-3">{section.category}</h4>
              <div className="space-y-2">
                {section.prompts.map((prompt) => (
                  <div key={prompt} className="flex items-center gap-2 text-sm">
                    <Code className="w-3 h-3 text-[#FF6E3C]" />
                    <span className="text-white/70 font-mono">"{prompt}"</span>
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
        <p className="text-white/70 leading-relaxed">
          Use the <code className="px-2 py-0.5 rounded bg-white/10 text-[#FF6E3C]">@PageName</code> prefix 
          to generate entirely new pages:
        </p>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 font-mono text-sm">
          <p className="text-green-400">// Create a new About page</p>
          <p className="text-white mt-1">@About Create this page with team members and company history</p>
          <p className="text-green-400 mt-4">// Create a Pricing page</p>
          <p className="text-white mt-1">@Pricing Add 3 pricing tiers: Free, Pro, and Enterprise</p>
        </div>
        <p className="text-sm text-white/50">
          The AI will generate a complete page matching your existing design system and 
          automatically add it to the navigation.
        </p>
      </div>

      {/* Image uploads */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Using Images</h2>
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <Image className="w-6 h-6 text-[#FF6E3C] mt-1" />
          <div>
            <p className="text-white font-medium mb-2">Upload images with your prompt</p>
            <p className="text-sm text-white/60">
              Click the image icon to attach reference images. The AI will incorporate 
              them into your design or use them as visual references.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-white/5">
              <p className="text-sm text-white/70 font-mono">
                "Add this logo to the header" + [uploaded logo.png]
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Database integration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Database-Aware Edits</h2>
        <p className="text-white/70 leading-relaxed">
          If you've connected Supabase in Project Settings, AI can generate code that 
          fetches real data from your tables:
        </p>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-white/70 font-mono">
            "Show a list of users from my profiles table with their email and join date"
          </p>
          <p className="text-xs text-green-400 mt-2">
            → AI will generate supabase.from('profiles').select() code
          </p>
        </div>
        <Link href="/docs/integrations/supabase" className="inline-flex items-center gap-2 text-[#FF6E3C] text-sm hover:underline">
          Learn more about Supabase integration <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Version history */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Version History</h2>
        <p className="text-white/70 leading-relaxed">
          Every edit creates a new version. You can:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
          <li>View all previous versions in the sidebar</li>
          <li>Restore any version with one click</li>
          <li>Compare changes between versions</li>
        </ul>
      </div>

      {/* Credits */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Credit Cost</h2>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white">Edit with AI</span>
            <span className="font-mono text-[#FF6E3C]">3 credits per edit</span>
          </div>
        </div>
        <p className="text-sm text-white/50">
          Each edit request costs 3 credits, regardless of complexity. New page generation with @PageName also costs 3 credits.
        </p>
      </div>

      {/* New: AI Response */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">AI Response in Chat</h2>
        <p className="text-white/70 leading-relaxed">
          After each edit, the AI explains what changes it made in the chat window. 
          This helps you understand exactly what was modified without comparing code line by line.
        </p>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C]/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#FF6E3C]" />
            </div>
            <div className="text-sm text-white/70">
              <p className="text-white font-medium mb-1">Done!</p>
              <p>I've made the header sticky with a frosted glass effect. Added backdrop-blur-xl and bg-black/80. The navigation now stays visible while scrolling.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

