import Link from "next/link";
import { Palette, Droplet, Type, Square, Layers } from "lucide-react";

export default function DesignSystemPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Features</span>
          <span>/</span>
          <span className="text-white">Design System</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <Palette className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Design System</h1>
        </div>
        <p className="text-xl text-zinc-400">
          View and understand the visual language extracted from your video.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-zinc-400 leading-relaxed">
          When you generate UI from video, Replay's AI extracts a complete design system including 
          colors, typography, spacing, and component patterns. The Design System panel shows these 
          extracted values so you can understand and maintain consistency.
        </p>
      </div>

      {/* What's extracted */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What's Extracted</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="w-5 h-5 text-zinc-400" />
              <h3 className="font-medium text-white">Colors</h3>
            </div>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li>Primary brand colors</li>
              <li>Background colors</li>
              <li>Text colors</li>
              <li>Accent/highlight colors</li>
              <li>Border colors</li>
            </ul>
          </div>
          
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-5 h-5 text-zinc-400" />
              <h3 className="font-medium text-white">Typography</h3>
            </div>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li>Font families</li>
              <li>Heading sizes</li>
              <li>Body text sizes</li>
              <li>Font weights</li>
              <li>Line heights</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Square className="w-5 h-5 text-zinc-400" />
              <h3 className="font-medium text-white">Spacing</h3>
            </div>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li>Padding values</li>
              <li>Margin values</li>
              <li>Gap/gutter sizes</li>
              <li>Section spacing</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-zinc-400" />
              <h3 className="font-medium text-white">Components</h3>
            </div>
            <ul className="space-y-1 text-sm text-zinc-400">
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
        <h2 className="text-2xl font-semibold text-white">How to Access</h2>
        <p className="text-zinc-400 leading-relaxed">
          Click the <strong className="text-white">"Design System"</strong> tab in the top toolbar 
          after generating your UI. The panel shows all extracted design tokens.
        </p>
      </div>

      {/* Using design tokens */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Using Design Tokens</h2>
        <p className="text-zinc-400 leading-relaxed">
          The extracted design system is automatically applied when you use Edit with AI. 
          New pages and components will match your existing visual language.
        </p>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 font-mono text-sm">
          <p className="text-emerald-400">// AI uses your design system</p>
          <p className="text-zinc-400 mt-2">"Add a contact form"</p>
          <p className="text-zinc-500 mt-1">→ Form will use your button styles, input styles, and colors</p>
        </div>
      </div>

      {/* Import Design System */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Import Design System</h2>
        <p className="text-zinc-400 leading-relaxed">
          Import your existing Design System from <strong className="text-white">Figma</strong>, <strong className="text-white">Storybook</strong>, or manually.
          Replay extracts tokens (colors, typography, spacing, border radius) and applies them
          consistently across all generated code.
        </p>

        <h3 className="text-lg font-medium text-white mt-6">Figma Plugin</h3>
        <p className="text-zinc-400 leading-relaxed">
          Install the <strong className="text-white">Replay.build — Design System Sync</strong> plugin
          from the Figma Community. Open any Figma file with your design system, enter your API key,
          and click Extract. The plugin scans all pages for:
        </p>
        <ul className="list-disc list-inside text-zinc-400 space-y-1 text-sm ml-2">
          <li>Paint styles and color variables (including alias resolution)</li>
          <li>Text styles with font family, size, weight, and line height</li>
          <li>Effect styles (drop shadows, layer blur)</li>
          <li>Spacing and border radius variables</li>
          <li>Component sets with variants and properties</li>
        </ul>

        <h3 className="text-lg font-medium text-white mt-6">Preview Tokens</h3>
        <p className="text-zinc-400 leading-relaxed">
          Click the <strong className="text-white">Eye icon</strong> next to any imported Design System
          in the style dropdown to preview its tokens before selecting. The preview modal shows color
          swatches, typography samples, spacing scale, border radius, shadows, and component list.
        </p>

        <h3 className="text-lg font-medium text-white mt-6">How DS Overrides Work</h3>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 font-mono text-sm">
          <p className="text-emerald-400">// When DS is selected:</p>
          <p className="text-zinc-400 mt-2">DS colors override video-detected colors</p>
          <p className="text-zinc-400">DS typography replaces default Inter font</p>
          <p className="text-zinc-400">DS spacing tokens used for all layout</p>
          <p className="text-zinc-500 mt-2">→ Layout and content come from video, styling from your DS</p>
          <p className="text-zinc-500">→ Works with both Reconstruct and Reimagine modes</p>
        </div>
      </div>

      {/* Style injection */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Style Injection</h2>
        <p className="text-zinc-400 leading-relaxed">
          Want a completely different look? Use Style Injection presets to transform your design:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Neon Glow", "Glassmorphism", "Brutalist", "Organic"].map((style) => (
            <div key={style} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
              <span className="text-sm text-zinc-400">{style}</span>
            </div>
          ))}
        </div>
        <Link href="/docs/guides/style-injection" className="inline-flex items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors">
          Learn more about Style Injection
        </Link>
      </div>
    </div>
  );
}
