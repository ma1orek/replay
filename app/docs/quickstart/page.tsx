import Link from "next/link";
import { CheckCircle, ArrowRight, Video, Sparkles, Globe, Edit3, Lightbulb } from "lucide-react";

export default function QuickstartPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white">Quickstart</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Quickstart Guide</h1>
        <p className="text-xl text-white/60">
          Create your first UI from video in under 5 minutes.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <h4 className="font-medium text-blue-400 mb-2">Prerequisites</h4>
        <ul className="space-y-1 text-sm text-white/70">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            A Replay account (sign up at replay.build)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            A screen recording (any format: MP4, WebM, MOV)
          </li>
        </ul>
      </div>

      {/* Steps */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h2 className="text-xl font-semibold text-white">Record Your Screen</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-white/70">
              Use any screen recording tool (Loom, OBS, QuickTime, or the built-in recorder) 
              to capture the UI you want to recreate.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-yellow-400" />
                              Tips for better results:
                            </h4>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• Record at 1080p or higher resolution</li>
                <li>• Show full page scrolls to capture all content</li>
                <li>• Click through navigation to capture multiple pages</li>
                <li>• Hover over interactive elements to show states</li>
                <li>• Keep recordings under 60 seconds for best results</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h2 className="text-xl font-semibold text-white">Upload to Replay</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-white/70">
              Open <Link href="/" className="text-[#FF6E3C] hover:underline">replay.build</Link> and 
              either drag & drop your video or click "Upload video".
            </p>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 border-dashed text-center">
              <Video className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/50">Drop your video here</p>
              <p className="text-xs text-white/30 mt-1">or record your screen directly</p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h2 className="text-xl font-semibold text-white">Configure Generation</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-white/70">
              Optionally add context and choose a style preset:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="font-medium text-white mb-2">Context (optional)</h4>
                <p className="text-sm text-white/50">
                  Describe what you recorded to help AI understand better.
                  Example: "This is a SaaS dashboard with user analytics"
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="font-medium text-white mb-2">Style Presets</h4>
                <p className="text-sm text-white/50">
                  Choose from styles like Neon Glow, Glassmorphism, 
                  Brutalist, or keep the original look.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">
              4
            </div>
            <h2 className="text-xl font-semibold text-white">Generate UI</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-white/70">
              Click the <strong className="text-[#FF6E3C]">Generate</strong> button. 
              AI will analyze your video and create HTML/CSS code.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-[#FF6E3C]" />
                <span className="font-medium text-white">Generation takes 30-90 seconds</span>
              </div>
              <p className="text-sm text-white/50">
                The AI processes each frame, extracts layouts, detects navigation, 
                and generates clean, responsive code.
              </p>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">
              5
            </div>
            <h2 className="text-xl font-semibold text-white">Edit & Refine</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-white/70">
              Use <strong className="text-white">Edit with AI</strong> to make changes:
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-sm">
              <p className="text-green-400">// Example prompts:</p>
              <p className="text-white/70 mt-2">"Change the header color to blue"</p>
              <p className="text-white/70">"Add a contact form to the About page"</p>
              <p className="text-white/70">"Make the layout mobile-responsive"</p>
              <p className="text-white/70">"@About Create this page with team members"</p>
            </div>
          </div>
        </div>

        {/* Step 6 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">
              6
            </div>
            <h2 className="text-xl font-semibold text-white">Publish</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-white/70">
              Click <strong className="text-white">Publish</strong> to deploy your project 
              to a live URL on replay.build.
            </p>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium text-green-400">Your project is live!</p>
                  <p className="text-sm text-white/50">https://replay.build/p/your-project-slug</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Next Steps</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/docs/features/edit-with-ai"
            className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <Edit3 className="w-5 h-5 text-white/60" />
              <span className="font-medium text-white">Learn Edit with AI</span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
            </div>
          </Link>
          <Link
            href="/docs/integrations/supabase"
            className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-white/60" />
              <span className="font-medium text-white">Connect Database</span>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

