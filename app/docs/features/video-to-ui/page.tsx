import Link from "next/link";
import { Video, CheckCircle, AlertTriangle, Lightbulb, Check, X, Copy, Wand2 } from "lucide-react";

export default function VideoToUIPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/docs/features/video-to-ui" className="hover:text-white transition-colors">Features</Link>
          <span>/</span>
          <span className="text-white">Video to UI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <Video className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Video to UI</h1>
        </div>
        <p className="text-xl text-zinc-400">
          Transform any screen recording into production-ready HTML and CSS code.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-zinc-400 leading-relaxed">
          Video to UI is Replay's core feature. Upload a screen recording of any website, 
          app, or UI design, and our AI will analyze every frame 
          to generate clean, semantic React code with Tailwind CSS styling.
        </p>
      </div>

      {/* AI Architecture */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">AI Architecture: The Sandwich Model</h2>
        <p className="text-zinc-400 leading-relaxed">
          Replay uses a sophisticated multi-model pipeline we call the <strong className="text-white">"Sandwich Architecture"</strong>:
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h4 className="font-medium text-blue-400 mb-2">🔍 Phase 1: Surveyor (Gemini 3.1 Flash)</h4>
            <p className="text-sm text-zinc-400">"Measure twice, cut once" — Extracts precise layout measurements, grid systems, spacing patterns, and color palettes from video frames using code execution for pixel-accurate data.</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <h4 className="font-medium text-purple-400 mb-2">⚡ Phase 2: Generator (Gemini 3.1 Pro)</h4>
            <p className="text-sm text-zinc-400">Main code generation — Receives Surveyor measurements and generates production-ready React + Tailwind code with working navigation and interactions.</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="font-medium text-emerald-400 mb-2">✅ Phase 3: QA Tester (Gemini 3.1 Flash)</h4>
            <p className="text-sm text-zinc-400">Visual verification — Compares generated UI against original frames, calculates SSIM similarity, and provides auto-fix suggestions for pixel-perfect output.</p>
          </div>
        </div>
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
            <div key={section.title} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <h3 className="font-medium text-white mb-3">{section.title}</h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
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
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["MP4", "WebM", "MOV", "AVI"].map((format) => (
              <div key={format} className="text-center p-3 rounded-lg bg-zinc-900">
                <span className="font-mono text-zinc-300">.{format.toLowerCase()}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-500 mt-4">
            Maximum file size: 100MB • Recommended length: 10-60 seconds
          </p>
        </div>
      </div>

      {/* Best practices */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Best Practices</h2>
        
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-emerald-400 mb-2">Do's</h4>
              <ul className="space-y-1 text-sm text-zinc-400">
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Record at high resolution (1080p+)</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Show the complete UI with scrolling</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Click through all navigation items you want generated</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Hover over interactive elements to capture states</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Use consistent, slow movements</li>
                <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Keep videos focused on one flow at a time</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-400 mb-2">Don'ts</h4>
              <ul className="space-y-1 text-sm text-zinc-400">
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

      {/* Generation Modes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Generation Modes</h2>
        <p className="text-zinc-400 leading-relaxed">
          Before generating, choose between two modes using the toggle in the sidebar:
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Copy className="w-4 h-4 text-zinc-300" />
              <h4 className="font-medium text-white">Reconstruct</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">Default</span>
            </div>
            <p className="text-sm text-zinc-400">
              Exact layout & structure match. The AI faithfully reproduces the video's layout,
              spacing, colors, and content placement. Best for pixel-accurate recreation of
              existing designs, dashboards, and app UIs.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-4 h-4 text-zinc-300" />
              <h4 className="font-medium text-white">Reimagine</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Creative layout, same content. The AI preserves all text, data, and section
              purposes but invents a completely new visual design with advanced animations
              (GSAP ScrollTrigger, split-text effects, parallax, glassmorphism), custom
              scrollbars, horizontal carousels, bento grids, and cinematic layouts.
              Powered by 18+ animation patterns from reactbits.dev.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-zinc-400">
            Tip: You can switch modes at any time — both in the New Project view and inside
            existing projects. The toggle appears above the Generate button in the sidebar.
          </p>
        </div>
      </div>

      {/* Video trimming */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Video Trimming</h2>
        <p className="text-zinc-400 leading-relaxed">
          Use the timeline slider to trim your video before generation. This helps you:
        </p>
        <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
          <li>Focus on specific sections of a longer recording</li>
          <li>Remove intro/outro portions</li>
          <li>Select only the screens you want to generate</li>
        </ul>
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-zinc-400">
            Tip: For multi-page apps, you can generate different sections separately 
            and then combine them using Edit with AI.
          </p>
        </div>
      </div>

      {/* Output */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Generated Output</h2>
        <p className="text-zinc-400 leading-relaxed">
          The AI generates a complete React component with Tailwind CSS:
        </p>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 font-mono text-sm overflow-x-auto">
          <pre className="text-zinc-400">
{`// Next.js App Router Page
// Generated by Replay from video analysis

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState('home');
  
  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Navigation */}
      <nav className="flex items-center gap-4 p-4">
        <button onClick={() => setCurrentPage('home')}>Home</button>
        <button onClick={() => setCurrentPage('about')}>About</button>
      </nav>
      
      {/* Page: Home */}
      {currentPage === 'home' && (
        <main className="p-8">...</main>
      )}
      
      {/* Page: About */}
      {currentPage === 'about' && (
        <main className="p-8">...</main>
      )}
    </div>
  );
}`}
          </pre>
        </div>
        <p className="text-sm text-zinc-500">
          Uses React useState for page switching and Tailwind CSS for styling. Ready to use in Next.js or any React project.
        </p>
      </div>

      {/* Credits */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Credit Cost</h2>
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-white">Video to UI Generation</span>
            <span className="font-mono text-zinc-300">~150 credits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
