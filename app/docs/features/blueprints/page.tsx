import Link from "next/link";
import { LayoutGrid, Move, Maximize2, Sparkles, Check, X, ArrowRight, BookOpen } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor - Replay Docs",
  description: "Learn about Replay's visual Editor for arranging and editing components with AI assistance.",
};

export default function BlueprintsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <Link href="/docs/features" className="hover:text-white transition-colors">Features</Link>
          <span>/</span>
          <span className="text-white">Editor</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Editor</h1>
        <p className="text-xl text-zinc-400">
          Visual canvas for component composition and AI-powered editing.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-zinc-400 leading-relaxed">
          The Editor is a visual canvas where you can arrange components, resize them, 
          and use AI to make changes. It's designed for designers who prefer visual editing 
          over code manipulation.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Canvas Features</h2>
        <div className="grid gap-4">
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Move className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">Drag & Drop</h3>
            </div>
            <p className="text-zinc-400">
              Click and drag any component to reposition it on the canvas. 
              Components snap to a grid for alignment.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Maximize2 className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">Resize</h3>
            </div>
            <p className="text-zinc-400">
              Drag the edges or corners of any component to resize it. 
              The component preview updates in real-time.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Sparkles className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Editing</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Select a component and use the chat input to make changes with natural language:
            </p>
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <p className="text-sm text-zinc-500 mb-2">Example prompts:</p>
              <ul className="text-sm text-zinc-400 space-y-1">
                <li>• "Make it red"</li>
                <li>• "Add icon to the left"</li>
                <li>• "Add button"</li>
                <li>• "Make bigger"</li>
                <li>• "Add line chart"</li>
                <li>• "Add shadow"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Editing Workflow</h2>
        <ol className="space-y-4 text-zinc-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">1</span>
            <span><strong className="text-white">Select</strong> - Click a component on the canvas to select it</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">2</span>
            <span><strong className="text-white">Edit</strong> - Type your changes in the AI chat input</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">3</span>
            <span><strong className="text-white">Preview</strong> - See the AI's changes in real-time</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">4</span>
            <span><strong className="text-white">Accept or Discard</strong> - Confirm changes or revert to original</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 text-white text-sm flex items-center justify-center">5</span>
            <span><strong className="text-white">Publish</strong> - Save the updated component to your library</span>
          </li>
        </ol>
      </div>

      {/* Action buttons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Action Buttons</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-white">Accept</span>
            </div>
            <p className="text-sm text-zinc-400">
              Confirm AI changes and update the component code.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-red-400" />
              <span className="font-medium text-white">Discard</span>
            </div>
            <p className="text-sm text-zinc-400">
              Revert changes and restore the original component.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-white">Publish</span>
            </div>
            <p className="text-sm text-zinc-400">
              Save the updated component to your Library.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Editor Toolbar</h2>
        <p className="text-zinc-400">
          The toolbar at the top provides canvas tools:
        </p>
        <ul className="space-y-2 text-zinc-400">
          <li>• <strong className="text-white">Grid</strong> - Toggle background grid</li>
          <li>• <strong className="text-white">Background</strong> - Dark/light/transparent canvas</li>
          <li>• <strong className="text-white">Ruler</strong> - Show component dimensions</li>
          <li>• <strong className="text-white">Outline</strong> - Highlight boundaries</li>
          <li>• <strong className="text-white">Vision Simulator</strong> - Accessibility testing</li>
        </ul>
        <p className="text-zinc-400 mt-4">
          Bottom-left controls:
        </p>
        <ul className="space-y-2 text-zinc-400">
          <li>• <strong className="text-white">Zoom</strong> - Zoom in/out with percentage display</li>
          <li>• <strong className="text-white">Reset</strong> - Reset zoom to 100%</li>
          <li>• <strong className="text-white">Auto Layout</strong> - Automatically arrange components</li>
        </ul>
      </div>

      {/* Tips */}
      <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
        <h3 className="text-lg font-semibold text-white mb-4">Tips</h3>
        <ul className="space-y-2 text-zinc-400">
          <li>• <strong className="text-white">Scroll to zoom</strong> - Use mouse wheel to zoom in/out</li>
          <li>• <strong className="text-white">Double-click canvas</strong> - Create a new empty component</li>
          <li>• <strong className="text-white">Double-click component</strong> - Open in Library for detailed editing</li>
          <li>• <strong className="text-white">Press Esc</strong> - Deselect current component</li>
          <li>• <strong className="text-white">Press Enter</strong> - Send AI edit command</li>
        </ul>
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
              <span className="font-medium text-white">Component Library</span>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
            </div>
          </Link>
          <Link
            href="/docs/features/publish"
            className="group p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-zinc-400" />
              <span className="font-medium text-white">Publishing</span>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
