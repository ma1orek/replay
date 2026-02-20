import Link from "next/link";
import { CheckCircle, ArrowRight, Video, Sparkles, Globe, BookOpen, Lightbulb, LayoutGrid } from "lucide-react";

export default function QuickstartPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white">Quickstart</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Quickstart Guide</h1>
        <p className="text-xl text-zinc-400">
          Create your first design system from video in under 5 minutes.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
        <h4 className="font-medium text-white mb-2">Prerequisites</h4>
        <ul className="space-y-1 text-sm text-zinc-400">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            A Replay account (sign up at replay.build)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            A screen recording (any format: MP4, WebM, MOV)
          </li>
        </ul>
      </div>

      {/* Steps */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h2 className="text-xl font-semibold text-white">Record Your Screen</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-zinc-400">
              Use any screen recording tool (Loom, OBS, QuickTime, or the built-in recorder) 
              to capture the UI you want to turn into a design system.
            </p>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Tips for better results:
              </h4>
              <ul className="space-y-1 text-sm text-zinc-400">
                <li>• Record at 1080p or higher resolution</li>
                <li>• Show multiple components and their states</li>
                <li>• Hover over elements to capture hover states</li>
                <li>• Click buttons to show different variants</li>
                <li>• Keep recordings under 60 seconds</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h2 className="text-xl font-semibold text-white">Upload to Replay</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-zinc-400">
              Open <Link href="/" className="text-white hover:underline">replay.build</Link> and 
              either drag & drop your video or click "Upload video".
            </p>
            <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700 border-dashed text-center">
              <Video className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Drop your video here</p>
              <p className="text-xs text-zinc-500 mt-1">or record your screen directly</p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h2 className="text-xl font-semibold text-white">Generate UI</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-zinc-400">
              Choose a generation mode and click <strong className="text-white">Generate</strong>:
            </p>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 space-y-3">
              <div>
                <span className="font-medium text-white">Reconstruct</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400 ml-2">Default</span>
                <p className="text-sm text-zinc-400 mt-1">Exact layout & structure — faithfully reproduces the video.</p>
              </div>
              <div className="border-t border-zinc-700 pt-3">
                <span className="font-medium text-white">Reimagine</span>
                <p className="text-sm text-zinc-400 mt-1">Creative layout, same content — brand-new design with advanced animations and effects.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-zinc-400" />
                <span className="font-medium text-white">Generation takes 30-90 seconds</span>
              </div>
              <p className="text-sm text-zinc-400">
                The AI processes each frame, extracts layouts, detects patterns,
                and generates responsive HTML/CSS code.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-sm">
              4
            </div>
            <h2 className="text-xl font-semibold text-white">Extract Components</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-zinc-400">
              Go to the <strong className="text-white">Library</strong> tab and click 
              <strong className="text-white"> Extract Components</strong>. AI will detect 
              reusable UI patterns and create a component library.
            </p>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-zinc-400" />
                <span className="font-medium text-white">What you get:</span>
              </div>
              <ul className="text-sm text-zinc-400 space-y-1">
                <li>• Component documentation with descriptions</li>
                <li>• Interactive Controls (edit props in real-time)</li>
                <li>• Accessibility checks</li>
                <li>• Usage code snippets</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-sm">
              5
            </div>
            <h2 className="text-xl font-semibold text-white">Edit in Editor</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-zinc-400">
              Use the <strong className="text-white">Editor</strong> tab to visually arrange 
              and edit components with AI:
            </p>
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-3 mb-3">
                <LayoutGrid className="w-5 h-5 text-zinc-400" />
                <span className="font-medium text-white">AI editing examples:</span>
              </div>
              <ul className="text-sm text-zinc-400 space-y-1">
                <li>"Make the button red"</li>
                <li>"Add an icon to the left"</li>
                <li>"Make it bigger"</li>
                <li>"Add a shadow effect"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 6 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-sm">
              6
            </div>
            <h2 className="text-xl font-semibold text-white">Publish</h2>
          </div>
          <div className="ml-11 space-y-3">
            <p className="text-zinc-400">
              Click <strong className="text-white">Publish</strong> to deploy your design system 
              to a live URL on replay.build.
            </p>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-400">Your project is live!</p>
                  <p className="text-sm text-zinc-400">https://replay.build/p/your-project-slug</p>
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
            href="/docs/features/library"
            className="group p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-zinc-400" />
              <span className="font-medium text-white">Explore Library</span>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
            </div>
          </Link>
          <Link
            href="/docs/features/blueprints"
            className="group p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-zinc-400" />
              <span className="font-medium text-white">Learn Editor</span>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
