import Link from "next/link";
import { FileVideo, Upload, Play, Sparkles, Check, ArrowRight } from "lucide-react";

export default function FirstProjectPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Guides</span>
          <span>/</span>
          <span className="text-white">First Project</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <FileVideo className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-white">Create Your First Project</h1>
        </div>
        <p className="text-xl text-white/60">
          Step-by-step guide to generating your first UI from video.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Before You Start</h2>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>A Replay account (sign up at replay.build)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>A screen recording of any UI (5-60 seconds)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>At least 1 credit in your account</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recording tips */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Recording Tips</h2>
        <p className="text-white/70 leading-relaxed">
          The quality of your recording directly affects the generated UI. Follow these tips:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <h4 className="font-medium text-green-400 mb-2">Do:</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Record at 1080p or higher</li>
              <li>• Show all navigation states</li>
              <li>• Hover over interactive elements</li>
              <li>• Move slowly through the UI</li>
              <li>• Record both desktop and mobile views</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <h4 className="font-medium text-red-400 mb-2">Avoid:</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Blurry or low-quality video</li>
              <li>• Quick scrolling or fast movements</li>
              <li>• Cropped or partial views</li>
              <li>• Screen glare or reflections</li>
              <li>• Videos longer than 2 minutes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Step by Step</h2>
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: "Open Replay",
              description: "Go to replay.build and sign in to your account. You'll see the main editor interface.",
              icon: Play
            },
            {
              step: 2,
              title: "Upload Your Video",
              description: "Click the upload area or drag & drop your video file. Supported formats: MP4, WebM, MOV.",
              icon: Upload
            },
            {
              step: 3,
              title: "Add Context (Optional)",
              description: "In the context field, describe what you're building. Example: 'E-commerce product page with cart functionality'",
              icon: FileVideo
            },
            {
              step: 4,
              title: "Generate",
              description: "Click 'Generate' and wait 30-60 seconds. The AI analyzes your video frame by frame.",
              icon: Sparkles
            },
            {
              step: 5,
              title: "Review Your UI",
              description: "Preview your generated UI. Use the Flow Map to see all detected pages.",
              icon: Check
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-[#FF6E3C] flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white">Step {item.step}: {item.title}</h4>
                <p className="text-sm text-white/60 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's next */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What's Next?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/docs/features/edit-with-ai" className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF6E3C]/50 transition-colors group">
            <h4 className="font-medium text-white mb-1 flex items-center gap-2">
              Edit with AI
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-sm text-white/60">Modify and add new pages to your project</p>
          </Link>
          <Link href="/docs/features/publish" className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF6E3C]/50 transition-colors group">
            <h4 className="font-medium text-white mb-1 flex items-center gap-2">
              Publish
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-sm text-white/60">Deploy your UI to a live URL</p>
          </Link>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Troubleshooting</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">Generation Failed?</h4>
            <p className="text-sm text-white/60">Try a shorter video or check your internet connection. Complex animations may cause issues.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">UI Looks Different?</h4>
            <p className="text-sm text-white/60">Use Edit with AI to refine colors, fonts, or layout. The AI interprets - it doesn't pixel-perfect copy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

