import Link from "next/link";
import { Globe, Rocket, Link2, Share2, Check, ExternalLink } from "lucide-react";

export default function PublishPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-zinc-900 transition-colors">Docs</Link>
          <span>/</span>
          <span>Features</span>
          <span>/</span>
          <span className="text-zinc-900">Publish</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <Globe className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-900">Publish</h1>
        </div>
        <p className="text-xl text-zinc-500">
          Deploy your generated UI to a live URL in one click.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Overview</h2>
        <p className="text-zinc-600 leading-relaxed">
          Replay allows you to publish your generated projects directly to the web. Get a unique 
          replay.build subdomain and share your creation with anyone. No hosting setup required.
        </p>
      </div>

      {/* How to publish */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">How to Publish</h2>
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Generate your UI",
              description: "Upload a video and wait for the AI to generate your code."
            },
            {
              step: "2",
              title: "Review and edit",
              description: "Use Edit with AI to make any adjustments. Preview your work."
            },
            {
              step: "3",
              title: "Click Publish",
              description: "Hit the Publish button in the bottom toolbar."
            },
            {
              step: "4",
              title: "Get your URL",
              description: "Receive a unique replay.build URL to share."
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-zinc-100 border border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-[#FF6E3C] flex items-center justify-center flex-shrink-0">
                <span className="text-zinc-900 font-bold text-sm">{item.step}</span>
              </div>
              <div>
                <h4 className="font-medium text-zinc-900">{item.title}</h4>
                <p className="text-sm text-zinc-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* URL structure */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Your Published URL</h2>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-zinc-200">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-[#FF6E3C]" />
            <span className="text-zinc-400 text-sm">Your site will be available at:</span>
          </div>
          <code className="text-[#FF6E3C] text-lg">
            https://your-project-id.replay.build
          </code>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">What's Included</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: Rocket,
              title: "Instant Deploy",
              description: "Published in seconds, not minutes"
            },
            {
              icon: Globe,
              title: "HTTPS by Default",
              description: "Secure connection out of the box"
            },
            {
              icon: Share2,
              title: "Shareable Link",
              description: "Send to anyone, no login required"
            },
            {
              icon: Check,
              title: "Production Ready",
              description: "Optimized for performance"
            },
          ].map((feature) => (
            <div key={feature.title} className="p-4 rounded-xl bg-zinc-100 border border-zinc-200">
              <feature.icon className="w-5 h-5 text-[#FF6E3C] mb-2" />
              <h4 className="font-medium text-zinc-900">{feature.title}</h4>
              <p className="text-sm text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pro tip */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Export Options</h2>
        <p className="text-zinc-600 leading-relaxed">
          Don't want to use Replay hosting? You can always download the HTML file and host it anywhere:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Vercel", "Netlify", "GitHub Pages", "Any Web Server"].map((option) => (
            <div key={option} className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-center">
              <span className="text-sm text-zinc-600">{option}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Updating */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Updating Your Site</h2>
        <p className="text-zinc-600 leading-relaxed">
          Made changes? Simply click Publish again. Your URL stays the same, and the content 
          updates instantly.
        </p>
        <div className="p-4 rounded-xl bg-[#FF6E3C]/10 border border-[#FF6E3C]/30">
          <p className="text-sm text-zinc-600">
            <strong className="text-zinc-900">Pro tip:</strong> Share the URL with stakeholders early. 
            They'll always see the latest version when you re-publish.
          </p>
        </div>
      </div>
    </div>
  );
}

