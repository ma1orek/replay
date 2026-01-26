import Link from "next/link";
import { Code, Copy, Download, Eye, Braces, FileCode } from "lucide-react";

export default function CodeViewPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Features</span>
          <span>/</span>
          <span className="text-white">Code View</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <Code className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Code View</h1>
        </div>
        <p className="text-xl text-zinc-400">
          View, copy, and download the generated HTML, CSS, and JavaScript code.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-zinc-400 leading-relaxed">
          Code View gives you full access to the generated code. The HTML is production-ready 
          with Tailwind CSS classes, Alpine.js for interactions, and clean semantic markup.
        </p>
      </div>

      {/* What's included */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What's Generated</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-5 h-5 text-zinc-400" />
              <h4 className="font-medium text-white">HTML Structure</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Semantic HTML5 with proper heading hierarchy, ARIA labels, and accessibility features.
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Braces className="w-5 h-5 text-zinc-400" />
              <h4 className="font-medium text-white">Tailwind CSS</h4>
            </div>
            <p className="text-sm text-zinc-400">
              All styling uses Tailwind utility classes. No separate CSS files needed.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-5 h-5 text-zinc-400" />
              <h4 className="font-medium text-white">Alpine.js Interactions</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Page navigation, modals, dropdowns, and other interactions use Alpine.js for minimal JavaScript.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <Copy className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">Copy Code</h4>
            <p className="text-xs text-zinc-500">Copy entire HTML to clipboard</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <Download className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">Download</h4>
            <p className="text-xs text-zinc-500">Download as index.html file</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <Eye className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <h4 className="font-medium text-white mb-1">Preview</h4>
            <p className="text-xs text-zinc-500">Toggle between code and preview</p>
          </div>
        </div>
      </div>

      {/* Code structure */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Code Structure</h2>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 font-mono text-sm overflow-x-auto">
          <pre className="text-zinc-400">{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>Your Generated App</title>
  <!-- Tailwind CSS CDN -->
  <!-- Alpine.js CDN -->
  <!-- Google Fonts -->
</head>
<body>
  <!-- Header/Navigation -->
  <header>...</header>
  
  <!-- Main Content (Alpine.js pages) -->
  <main x-data="{ currentPage: 'home' }">
    <section x-show="currentPage === 'home'">...</section>
    <section x-show="currentPage === 'about'">...</section>
  </main>
  
  <!-- Footer -->
  <footer>...</footer>
</body>
</html>`}</pre>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Tips</h2>
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• The code is self-contained - works as a single HTML file</li>
            <li>• Uses CDN links for Tailwind and Alpine.js - no build step required</li>
            <li>• Easy to integrate into any project or host on any static hosting</li>
            <li>• Perfect for prototypes, landing pages, and quick projects</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
