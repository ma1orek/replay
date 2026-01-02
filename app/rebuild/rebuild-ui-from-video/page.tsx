"use client";

import Link from "next/link";
import { ArrowRight, Play, Layers, Code, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

export default function RebuildUIFromVideoPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 rounded-full text-[#FF6E3C] text-xs font-medium mb-8">
            <Play className="w-3 h-3" />
            Use Case
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Rebuild UI from Video Recordings
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl leading-relaxed">
            Upload a screen recording of any interface. Replay analyzes the UI behavior over time and reconstructs working code that matches layout, navigation, and interaction states.
          </p>
        </div>
      </header>

      {/* Problem */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">The Problem</h2>
          
          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              You need to rebuild an existing interface. Maybe it's a legacy internal tool with no design files. 
              Maybe you're recreating a competitor's UI for reference. Maybe the original team is gone and 
              all you have is the running application.
            </p>
            
            <p>
              Traditional approaches fail here. Screenshots capture a single moment. Design files 
              (if they exist) show intent, not reality. AI prompt-based tools generate guesses, 
              not reconstructions.
            </p>
            
            <p>
              What you actually need is a tool that can watch the interface work and understand 
              its behavior over time.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Why Existing Tools Fail</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/80 font-semibold">Approach</th>
                  <th className="text-left py-4 px-4 text-white/80 font-semibold">What it captures</th>
                  <th className="text-left py-4 px-4 text-white/80 font-semibold">What it misses</th>
                </tr>
              </thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Screenshots</td>
                  <td className="py-4 px-4">Static layout</td>
                  <td className="py-4 px-4 text-red-400/80">Flow, state, interaction</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Design files</td>
                  <td className="py-4 px-4">Designer intent</td>
                  <td className="py-4 px-4 text-red-400/80">Real behavior</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium">Prompt-based AI</td>
                  <td className="py-4 px-4">Description</td>
                  <td className="py-4 px-4 text-red-400/80">Actual UI logic</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 px-4 font-medium text-[#FF6E3C]">Replay</td>
                  <td className="py-4 px-4 text-green-400/80">UI over time</td>
                  <td className="py-4 px-4 text-white/40">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-12">How Replay Works</h2>
          
          <div className="grid gap-8">
            {[
              {
                step: "01",
                title: "Upload or record a video",
                description: "Screen record the interface you want to rebuild. Navigate through all the screens and states you need."
              },
              {
                step: "02", 
                title: "Select the relevant flow",
                description: "Trim the video to focus on specific sections. Replay analyzes only what you select."
              },
              {
                step: "03",
                title: "Replay analyzes UI behavior",
                description: "The AI watches the video over time, detecting layouts, navigation patterns, and state changes."
              },
              {
                step: "04",
                title: "Structure, flow, and code are reconstructed",
                description: "Get working HTML/CSS/JS code that matches the interface shown in the video."
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-xl bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 flex items-center justify-center text-[#FF6E3C] font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Replay Copies */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-bold">What Replay Copies 1:1</h2>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  Layout hierarchy and component structure
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  Navigation structure and menu items
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  Screen-to-screen transitions
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  Interaction states (hover, active, focus)
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  Responsive behavior (if visible in video)
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                  Typography, colors, and spacing
                </li>
              </ul>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-6">
                <XCircle className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-bold">What Replay Does NOT Invent</h2>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                  Features not shown in the video
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                  Screens that weren't navigated to
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                  Business logic or backend functionality
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                  Data that wasn't displayed
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                  Animations not demonstrated
                </li>
              </ul>
              <p className="mt-6 text-sm text-white/50 italic">
                If it wasn't in the video, it won't be in the code. Trust over hype.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-12">Real Use Cases</h2>
          
          <div className="grid gap-6">
            {[
              {
                title: "Modernizing Internal Admin Dashboards",
                description: "Record your legacy admin panel and get a modern, responsive version. Replay captures all the data tables, filters, and navigation exactly as they work today."
              },
              {
                title: "Rebuilding Legacy CRM Interfaces",
                description: "That old CRM your team has been using for years? Record the key workflows and get production-ready code that matches the UI your users already know."
              },
              {
                title: "Competitive Analysis for MVP",
                description: "Need to understand how a competitor structured their product? Record a demo video and Replay will reconstruct the UI patterns and navigation flow."
              }
            ].map((useCase, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                <h3 className="text-lg font-semibold mb-3">{useCase.title}</h3>
                <p className="text-white/60">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-white/70 mb-8">
            If the UI exists on a screen, Replay can rebuild it from video.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6E3C] text-white font-semibold rounded-xl hover:bg-[#FF6E3C]/90 transition-colors"
          >
            Start Rebuilding
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 px-6 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-white/40 mb-4">Related reading</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/learn/behavior-driven-ui-reconstruction" className="text-[#FF6E3C] hover:underline text-sm">
              What is Behavior-Driven UI Reconstruction?
            </Link>
            <Link href="/learn/why-screenshots-fail-for-ui" className="text-[#FF6E3C] hover:underline text-sm">
              Why Screenshots Fail for UI Reconstruction
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


