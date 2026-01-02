"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ArrowLeft, Image, Video, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function WhyScreenshotsFailPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Replay</span>
          </Link>
          <Link 
            href="/"
            className="px-4 py-2 bg-[#FF6E3C] text-white text-sm font-medium rounded-lg hover:bg-[#FF6E3C]/90 transition-colors"
          >
            Try Replay Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-8">
            <BookOpen className="w-3 h-3" />
            Learn
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Why Screenshots Fail for UI Reconstruction
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl leading-relaxed">
            Screenshot-to-code tools have a fundamental problem: they only see one moment. 
            Interfaces exist in time. Here's why that gap matters.
          </p>
        </div>
      </header>

      {/* The Core Problem */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">The Core Problem</h2>
          
          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              A screenshot captures a user interface at a single point in time. It's a frozen moment—
              useful for documentation, but fundamentally incomplete for reconstruction.
            </p>
            
            <div className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20 my-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                <div>
                  <p className="text-white font-medium mb-2">
                    A screenshot shows what an interface looks like.
                  </p>
                  <p className="text-white/60">
                    It does not show how it works.
                  </p>
                </div>
              </div>
            </div>
            
            <p>
              When an AI analyzes a screenshot, it sees shapes, colors, and text. It does not see:
            </p>
            
            <ul className="space-y-3 ml-6 mt-4">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-3 shrink-0" />
                <span>What happens when you click a button</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-3 shrink-0" />
                <span>How the sidebar navigation works</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-3 shrink-0" />
                <span>What other pages exist in the application</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-3 shrink-0" />
                <span>How forms validate and respond to input</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-3 shrink-0" />
                <span>What animations and transitions exist</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Concrete Example */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">A Concrete Example</h2>
          
          <p className="text-white/70 text-lg mb-8">
            Consider a dashboard with a sidebar. A screenshot shows:
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Screenshot View */}
            <div className="p-6 rounded-2xl bg-black/30 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-white/40" />
                <h3 className="font-semibold text-white/60">What the screenshot shows</h3>
              </div>
              
              <div className="space-y-3 text-white/50 text-sm">
                <div className="p-3 rounded bg-white/5">
                  • A sidebar with 5 navigation items
                </div>
                <div className="p-3 rounded bg-white/5">
                  • "Dashboard" appears highlighted
                </div>
                <div className="p-3 rounded bg-white/5">
                  • A main content area with charts
                </div>
                <div className="p-3 rounded bg-white/5">
                  • Some buttons and controls
                </div>
              </div>
            </div>
            
            {/* Video View */}
            <div className="p-6 rounded-2xl bg-[#FF6E3C]/5 border border-[#FF6E3C]/20">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-[#FF6E3C]" />
                <h3 className="font-semibold text-[#FF6E3C]">What a video shows</h3>
              </div>
              
              <div className="space-y-3 text-white/70 text-sm">
                <div className="p-3 rounded bg-[#FF6E3C]/10">
                  • Click "Reports" → content changes to reports view
                </div>
                <div className="p-3 rounded bg-[#FF6E3C]/10">
                  • Click "Settings" → completely different layout
                </div>
                <div className="p-3 rounded bg-[#FF6E3C]/10">
                  • Hover on chart → tooltip appears with data
                </div>
                <div className="p-3 rounded bg-[#FF6E3C]/10">
                  • Click date picker → dropdown calendar opens
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-white/60 mt-8 text-center">
            The screenshot tool will generate a static page. The video tool will generate a working multi-page app.
          </p>
        </div>
      </section>

      {/* What Gets Lost */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">What Gets Lost</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/80 font-semibold">UI Element</th>
                  <th className="text-left py-4 px-4 text-white/80 font-semibold">Screenshot captures</th>
                  <th className="text-left py-4 px-4 text-white/80 font-semibold">Video captures</th>
                </tr>
              </thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Navigation</td>
                  <td className="py-4 px-4">List of links</td>
                  <td className="py-4 px-4 text-green-400/80">Full routing + page transitions</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Buttons</td>
                  <td className="py-4 px-4">Visual appearance</td>
                  <td className="py-4 px-4 text-green-400/80">Hover + click + response</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Forms</td>
                  <td className="py-4 px-4">Input fields</td>
                  <td className="py-4 px-4 text-green-400/80">Validation + error states</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Modals</td>
                  <td className="py-4 px-4">May not appear at all</td>
                  <td className="py-4 px-4 text-green-400/80">Trigger + animation + content</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Dropdowns</td>
                  <td className="py-4 px-4">Closed state only</td>
                  <td className="py-4 px-4 text-green-400/80">Open state + options + selection</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Tabs</td>
                  <td className="py-4 px-4">One tab visible</td>
                  <td className="py-4 px-4 text-green-400/80">All tabs + content switching</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The Guessing Problem */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">The Guessing Problem</h2>
          
          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              When AI tools only have a screenshot, they have to guess what happens next. 
              Sometimes they guess correctly. Often they don't.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <h3 className="font-semibold mb-3 text-white">Common AI guesses</h3>
                <ul className="space-y-2 text-sm text-white/50">
                  <li>• Adds navigation that doesn't exist</li>
                  <li>• Invents modal content</li>
                  <li>• Creates form validation logic</li>
                  <li>• Generates pages that were never shown</li>
                  <li>• Assumes responsive behavior</li>
                </ul>
              </div>
              
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <h3 className="font-semibold mb-3 text-white">Why this is a problem</h3>
                <ul className="space-y-2 text-sm text-white/50">
                  <li>• Output doesn't match original</li>
                  <li>• Extra work to remove unwanted features</li>
                  <li>• False confidence in completeness</li>
                  <li>• Debugging AI hallucinations</li>
                  <li>• Harder to trust the output</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Alternative */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">The Alternative: Video as Source of Truth</h2>
          
          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              When you record a video of the interface working, you create an unambiguous record 
              of actual behavior. The AI doesn't need to guess—it watches.
            </p>
            
            <div className="p-8 rounded-2xl bg-[#FF6E3C]/5 border border-[#FF6E3C]/20 my-8">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-[#FF6E3C] shrink-0 mt-1" />
                <div>
                  <p className="text-white font-medium mb-2">
                    What you show is what you get.
                  </p>
                  <p className="text-white/60">
                    If you navigate to three pages, you get three pages. If you only show one, 
                    you only get one. No hallucinations, no guessing.
                  </p>
                </div>
              </div>
            </div>
            
            <p>
              This is the principle behind <strong className="text-white">behavior-driven UI reconstruction</strong>—
              treating observed behavior as the specification, not static images or written descriptions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-white/70 mb-8">
            Stop guessing. Start recording. Replay rebuilds what you actually show.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6E3C] text-white font-semibold rounded-xl hover:bg-[#FF6E3C]/90 transition-colors"
          >
            Try Replay
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 px-6 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-white/40 mb-4">Related reading</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/rebuild/rebuild-ui-from-video" className="text-[#FF6E3C] hover:underline text-sm">
              Rebuild UI from Video Recordings
            </Link>
            <Link href="/learn/behavior-driven-ui-reconstruction" className="text-[#FF6E3C] hover:underline text-sm">
              What is Behavior-Driven UI Reconstruction?
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-white/40">
          <p>© 2025 Replay</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white/60">Terms</Link>
            <Link href="/privacy" className="hover:text-white/60">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


