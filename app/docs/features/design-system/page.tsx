import Link from "next/link";
import { Palette, Droplet, Type, Square, Layers } from "lucide-react";

export default function DesignSystemPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-zinc-900 transition-colors">Docs</Link>
          <span>/</span>
          <span>Features</span>
          <span>/</span>
          <span className="text-zinc-900">Design System</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <Palette className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-900">Design System</h1>
        </div>
        <p className="text-xl text-zinc-500">
          View and understand the visual language extracted from your video.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Overview</h2>
        <p className="text-zinc-600 leading-relaxed">
          When you generate UI from video, Replay's AI extracts a complete design system including 
          colors, typography, spacing, and component patterns. The Design System panel shows these 
          extracted values so you can understand and maintain consistency.
        </p>
      </div>

      {/* What's extracted */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">What's Extracted</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="w-5 h-5 text-[#FF6E3C]" />
              <h3 className="font-medium text-zinc-900">Colors</h3>
            </div>
            <ul className="space-y-1 text-sm text-zinc-500">
              <li>Primary brand colors</li>
              <li>Background colors</li>
              <li>Text colors</li>
              <li>Accent/highlight colors</li>
              <li>Border colors</li>
            </ul>
          </div>
          
          <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-5 h-5 text-[#FF6E3C]" />
              <h3 className="font-medium text-zinc-900">Typography</h3>
            </div>
            <ul className="space-y-1 text-sm text-zinc-500">
              <li>Font families</li>
              <li>Heading sizes</li>
              <li>Body text sizes</li>
              <li>Font weights</li>
              <li>Line heights</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <Square className="w-5 h-5 text-[#FF6E3C]" />
              <h3 className="font-medium text-zinc-900">Spacing</h3>
            </div>
            <ul className="space-y-1 text-sm text-zinc-500">
              <li>Padding values</li>
              <li>Margin values</li>
              <li>Gap/gutter sizes</li>
              <li>Section spacing</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-[#FF6E3C]" />
              <h3 className="font-medium text-zinc-900">Components</h3>
            </div>
            <ul className="space-y-1 text-sm text-zinc-500">
              <li>Button styles</li>
              <li>Card layouts</li>
              <li>Input fields</li>
              <li>Navigation patterns</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How to access */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">How to Access</h2>
        <p className="text-zinc-600 leading-relaxed">
          Click the <strong className="text-zinc-900">"Design System"</strong> tab in the top toolbar 
          after generating your UI. The panel shows all extracted design tokens.
        </p>
      </div>

      {/* Using design tokens */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Using Design Tokens</h2>
        <p className="text-zinc-600 leading-relaxed">
          The extracted design system is automatically applied when you use Edit with AI. 
          New pages and components will match your existing visual language.
        </p>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-zinc-200 font-mono text-sm">
          <p className="text-green-400">// AI uses your design system</p>
          <p className="text-zinc-600 mt-2">"Add a contact form"</p>
          <p className="text-zinc-400 mt-1">→ Form will use your button styles, input styles, and colors</p>
        </div>
      </div>

      {/* Style injection */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Style Injection</h2>
        <p className="text-zinc-600 leading-relaxed">
          Want a completely different look? Use Style Injection presets to transform your design:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Neon Glow", "Glassmorphism", "Brutalist", "Organic"].map((style) => (
            <div key={style} className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-center">
              <span className="text-sm text-zinc-600">{style}</span>
            </div>
          ))}
        </div>
        <Link href="/docs/guides/style-injection" className="inline-flex items-center gap-2 text-[#FF6E3C] text-sm hover:underline">
          Learn more about Style Injection
        </Link>
      </div>
    </div>
  );
}

