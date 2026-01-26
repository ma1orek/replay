import Link from "next/link";
import { BookOpen, Settings, Zap, Eye, Shield, Code, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Component Library - Replay Docs",
  description: "Learn about Replay's Storybook-style component library with interactive controls, accessibility checks, and documentation.",
};

export default function LibraryPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/docs/features" className="hover:text-white transition-colors">Features</Link>
          <span>/</span>
          <span className="text-white">Library</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Component Library</h1>
        <p className="text-xl text-zinc-400">
          A Storybook-style documentation system for your extracted components.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-zinc-400 leading-relaxed">
          The Library view transforms your generated UI into a professional component documentation system. 
          Each component gets its own page with interactive controls, prop tables, accessibility audits, 
          and copy-paste code snippets.
        </p>
      </div>

      {/* Tabs explanation */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Library Tabs</h2>
        <div className="grid gap-4">
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Settings className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">Controls</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Interactive prop editor that lets you modify component properties in real-time. 
              Change colors, text, sizes, and see the preview update instantly.
            </p>
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <p className="text-sm text-zinc-500">Example props:</p>
              <ul className="text-sm text-zinc-400 mt-2 space-y-1">
                <li>• <code className="text-emerald-400">primaryColor</code> - Main accent color (#hex)</li>
                <li>• <code className="text-emerald-400">label</code> - Button text (string)</li>
                <li>• <code className="text-emerald-400">size</code> - Component size (sm/md/lg)</li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Zap className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">Actions</h3>
            </div>
            <p className="text-zinc-400">
              See interactive behaviors like onClick, onHover, and other events. 
              Useful for understanding component interactivity.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Eye className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">Visual Tests</h3>
            </div>
            <p className="text-zinc-400">
              Compare component states and variants side-by-side. 
              Great for ensuring visual consistency across different configurations.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Shield className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">Accessibility</h3>
            </div>
            <p className="text-zinc-400">
              WCAG compliance checks for your components. See contrast ratios, 
              ARIA attributes, and keyboard navigation support.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Code className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">Usage</h3>
            </div>
            <p className="text-zinc-400">
              Copy-paste code snippets for each component. 
              Includes HTML, CSS classes, and JavaScript for interactions.
            </p>
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How to Extract Components</h2>
        <ol className="space-y-4 text-zinc-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">1</span>
            <span>Generate your UI from video in the Preview tab</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">2</span>
            <span>Switch to the <strong className="text-white">Library</strong> tab</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">3</span>
            <span>Click <strong className="text-white">Extract Components</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">4</span>
            <span>AI will detect patterns and create component documentation</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">5</span>
            <span>Browse components in the sidebar, edit props in Controls</span>
          </li>
        </ol>
      </div>

      {/* Toolbar */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Library Toolbar</h2>
        <p className="text-zinc-400">
          The toolbar at the top provides additional tools for working with components:
        </p>
        <ul className="space-y-2 text-zinc-400">
          <li>• <strong className="text-white">Grid</strong> - Toggle background grid for alignment</li>
          <li>• <strong className="text-white">Background</strong> - Switch between dark/light/transparent</li>
          <li>• <strong className="text-white">Ruler</strong> - Show component dimensions in pixels</li>
          <li>• <strong className="text-white">Outline</strong> - Highlight component boundaries</li>
          <li>• <strong className="text-white">Vision Simulator</strong> - Test accessibility (blur, grayscale, color blindness)</li>
          <li>• <strong className="text-white">Viewport</strong> - Toggle desktop/mobile/fullscreen preview</li>
        </ul>
      </div>

      {/* Next steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Next Steps</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/docs/features/blueprints"
            className="group p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-zinc-400" />
              <span className="font-medium text-white">Edit in Blueprints</span>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
            </div>
          </Link>
          <Link
            href="/docs/features/edit-with-ai"
            className="group p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-zinc-400" />
              <span className="font-medium text-white">AI Editing</span>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
