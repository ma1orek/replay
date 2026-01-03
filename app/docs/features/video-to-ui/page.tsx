import Link from "next/link";
import { Video, CheckCircle, AlertTriangle, Lightbulb, Check, X } from "lucide-react";

export default function VideoToUIPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/docs/features/video-to-ui" className="hover:text-white transition-colors">Features</Link>
          <span>/</span>
          <span className="text-white">Video to UI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <Video className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-white">Video to UI</h1>
        </div>
        <p className="text-xl text-white/60">
          Transform any screen recording into production-ready HTML and CSS code.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-white/70 leading-relaxed">
          Video to UI is Replay's core feature. Upload a screen recording of any website, 
          app, or UI design, and our AI (powered by Google Gemini) will analyze every frame 
          to generate clean, semantic HTML with Tailwind CSS styling.
        </p>
      </div>

      {/* What AI detects */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What the AI Detects</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "Layout Structure", items: ["Headers & navigation", "Sidebars", "Grid layouts", "Card components", "Footers"] },
            { title: "Visual Design", items: ["Colors & gradients", "Typography", "Spacing", "Border radius", "Shadows"] },
            { title: "Content", items: ["Text & headlines", "Images (as placeholders)", "Icons", "Buttons", "Forms"] },
            { title: "Interactions", items: ["Page navigation", "Hover states", "Modal dialogs", "Tab switching", "Scroll content"] },
          ].map((section) => (
            <div key={section.title} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-medium text-white mb-3">{section.title}</h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Supported formats */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Supported Formats</h2>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["MP4", "WebM", "MOV", "AVI"].map((format) => (
              <div key={format} className="text-center p-3 rounded-lg bg-white/5">
                <span className="font-mono text-[#FF6E3C]">.{format.toLowerCase()}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/50 mt-4">
            Maximum file size: 100MB • Recommended length: 10-60 seconds
          </p>
        </div>
      </div>

      {/* Best practices */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Best Practices</h2>
        
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-400 mb-2">Do's</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Record at high resolution (1080p+)</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Show the complete UI with scrolling</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Click through all navigation items you want generated</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Hover over interactive elements to capture states</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Use consistent, slow movements</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Keep videos focused on one flow at a time</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-400 mb-2">Don'ts</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-400" /> Record videos longer than 2 minutes</li>
                <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-400" /> Use low resolution or blurry recordings</li>
                <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-400" /> Switch between many unrelated screens</li>
                <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-400" /> Include cursor animations or effects</li>
                <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-400" /> Record with visible browser dev tools</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Video trimming */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Video Trimming</h2>
        <p className="text-white/70 leading-relaxed">
          Use the timeline slider to trim your video before generation. This helps you:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
          <li>Focus on specific sections of a longer recording</li>
          <li>Remove intro/outro portions</li>
          <li>Select only the screens you want to generate</li>
        </ul>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-white/50">
            Tip: For multi-page apps, you can generate different sections separately 
            and then combine them using Edit with AI.
          </p>
        </div>
      </div>

      {/* Output */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Generated Output</h2>
        <p className="text-white/70 leading-relaxed">
          The AI generates a single HTML file containing:
        </p>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 font-mono text-sm overflow-x-auto">
          <pre className="text-white/70">
{`<!DOCTYPE html>
<html lang="en">
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/alpinejs"></script>
</head>
<body x-data="{ currentPage: 'home' }">
  
  <!-- Navigation -->
  <nav>...</nav>
  
  <!-- Page: Home -->
  <main x-show="currentPage === 'home'">
    ...
  </main>
  
  <!-- Page: About -->
  <main x-show="currentPage === 'about'">
    ...
  </main>
  
</body>
</html>`}
          </pre>
        </div>
        <p className="text-sm text-white/50">
          Uses Alpine.js for page switching and Tailwind CSS for styling.
        </p>
      </div>

      {/* Credits */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Credit Cost</h2>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white">Video to UI Generation</span>
            <span className="font-mono text-[#FF6E3C]">75 credits</span>
          </div>
        </div>
      </div>
    </div>
  );
}

