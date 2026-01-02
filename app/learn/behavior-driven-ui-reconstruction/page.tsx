"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ArrowLeft, Video, Layers, Code2, Zap, Check, X, Clock, Eye, GitBranch, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function BehaviorDrivenReconstructionPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Seek to position based on clientX
  const seekToPosition = (clientX: number) => {
    if (videoRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = pos * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(pos * 100);
    }
  };

  // Mouse events for desktop dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        seekToPosition(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch events for mobile dragging
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekToPosition(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging) {
      seekToPosition(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
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
      <header className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-medium mb-8">
            <BookOpen className="w-3 h-3" />
            Case Study
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            I rebuilt the Y Combinator website from a screen recording
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl leading-relaxed mb-4">
            An experiment in behavior-driven UI reconstruction: treating video as the source of truth 
            instead of screenshots, text prompts, or design files.
          </p>
          
          <p className="text-sm text-white/40">
            December 2024 · 8 min read
          </p>
        </div>
      </header>

      {/* Video Demo */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black group">
            <video 
              ref={videoRef}
              className="w-full aspect-video object-cover"
              poster="/ShowcaseReplay.mp4#t=1"
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
            >
              <source src="/ShowcaseReplay.mp4" type="video/mp4" />
            </video>
            
            {/* Play overlay when paused */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 rounded-full bg-[#FF6E3C] flex items-center justify-center shadow-lg shadow-[#FF6E3C]/30 hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
                </div>
                <span className="mt-4 text-white/80 text-sm font-medium">Watch the Y Combinator Rebuild</span>
              </div>
            )}

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Progress Bar - clickable and draggable */}
              <div 
                ref={progressBarRef}
                className={`h-3 bg-white/20 rounded-full mb-3 cursor-pointer group/progress transition-[height] ${isDragging ? 'h-4' : 'hover:h-4'}`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="h-full bg-[#FF6E3C] rounded-full relative pointer-events-none"
                  style={{ width: `${progress}%` }}
                >
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg transition-opacity pointer-events-none ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover/progress:opacity-100'}`} />
                </div>
              </div>
              
              {/* Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                  <button 
                    onClick={toggleMute}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <span className="text-sm text-white/60 font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">Y Combinator Demo</span>
              </div>
            </div>
          </div>
          <p className="text-center text-white/40 text-sm mt-4">
            Full screen recording → working frontend in under 60 seconds
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">The Problem with Existing Approaches</h2>
          
          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              Most existing tools try to generate UI from screenshots or text prompts. 
              The problem is that <strong className="text-white">screenshots capture appearance, but not behavior</strong>.
            </p>
            
            <p>
              Interfaces exist in time: navigation, state changes, transitions, and interaction patterns 
              are invisible in a single frame. A screenshot of Y Combinator's homepage tells you nothing about:
            </p>
            
            <ul className="space-y-3 ml-6">
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                <span>How the navigation works</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                <span>What happens when you click "Startup Jobs"</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                <span>How many pages exist and how they connect</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                <span>The interaction states (hover, active, loading)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* The Approach */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">The Approach: Video as Source of Truth</h2>
          
          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              So I built a prototype that treats video as the source of truth.
            </p>
            
            <p>
              As an experiment, I recorded a short walkthrough of the Y Combinator website and rebuilt 
              the frontend purely from the screen recording. The system analyzes UI behavior over time—layout 
              hierarchy, navigation flow, interaction states—and reconstructs a working, responsive frontend 
              that matches what was actually shown.
            </p>
            
            <div className="p-6 rounded-2xl bg-[#FF6E3C]/5 border border-[#FF6E3C]/20 mt-8">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF6E3C]" />
                Key Constraints
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6E3C] mt-0.5 shrink-0" />
                  <span>If something isn't shown in the video, it's not generated</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6E3C] mt-0.5 shrink-0" />
                  <span>No guessing, no invented screens or logic</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FF6E3C] mt-0.5 shrink-0" />
                  <span>The output reflects observed behavior, not assumptions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What Worked */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">What Worked Better Than Expected</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: GitBranch,
                title: "Navigation Structure",
                description: "Page relationships and navigation flow were accurately captured from watching clicks and page transitions."
              },
              {
                icon: Layers,
                title: "State Changes",
                description: "Interaction patterns—hover states, active elements, transitions—were preserved from temporal analysis."
              },
              {
                icon: Eye,
                title: "Layout Fidelity",
                description: "The original visual flow was maintained without needing written specifications or design files."
              }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-white/50">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Behavior-Driven vs. Screenshot-Based</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-4 text-white/50 font-medium text-sm">Capability</th>
                  <th className="py-4 px-4 text-white/50 font-medium text-sm">Screenshot Tools</th>
                  <th className="py-4 px-4 text-white/50 font-medium text-sm">Video Analysis</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["Visual layout", "✓", "✓"],
                  ["Multi-page apps", "✗", "✓"],
                  ["Navigation flow", "✗", "✓"],
                  ["Interaction states", "✗", "✓"],
                  ["State transitions", "✗", "✓"],
                  ["Form validation", "✗", "✓"],
                  ["Backend logic", "✗", "✗"],
                  ["Hidden screens", "✗", "✗"],
                ].map(([feature, screenshot, video], i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4 text-white/70">{feature}</td>
                    <td className="py-3 px-4">
                      <span className={screenshot === "✓" ? "text-green-400" : "text-red-400"}>
                        {screenshot}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={video === "✓" ? "text-green-400" : "text-red-400"}>
                        {video}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">What Doesn't Work (Yet)</h2>
          
          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              This approach has clear boundaries:
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                <div>
                  <strong className="text-white">Backend logic</strong>
                  <p className="text-white/50 text-base mt-1">The system generates frontend code. API integrations, databases, and server logic are not inferred.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                <div>
                  <strong className="text-white">Hidden states not demonstrated</strong>
                  <p className="text-white/50 text-base mt-1">If you don't show the error state in the video, it won't be generated.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                <div>
                  <strong className="text-white">Data relationships that never appear on screen</strong>
                  <p className="text-white/50 text-base mt-1">The video is the contract. Unseen features don't exist in the output.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* The Bigger Picture */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">The Bigger Picture</h2>
          
          <div className="space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              This experiment made me think that <strong className="text-white">behavior-driven UI reconstruction</strong> might 
              be a more reliable abstraction than screenshot-to-code or prompt-based generation, especially for:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-8">
              {[
                "Legacy systems without documentation",
                "Competitor analysis and research",
                "Rapid prototyping from references",
                "Rebuilding undocumented products",
                "Design system extraction",
                "Quality assurance testing"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-[#FF6E3C]" />
                  <span className="text-white/80">{item}</span>
                </div>
              ))}
            </div>
            
            <p className="mt-8 text-white/50 italic">
              I'm curious whether others have explored similar approaches, or see clear limitations I'm missing.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">How It Works (Technical)</h2>
          
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Video Input",
                description: "Upload a screen recording of any UI. The system accepts standard video formats (MP4, WebM, MOV)."
              },
              {
                step: "2",
                title: "Temporal Analysis",
                description: "The AI processes the video frame-by-frame, building a temporal model of UI changes, click events, and state transitions."
              },
              {
                step: "3",
                title: "Structure Extraction",
                description: "Layout hierarchy, component relationships, and navigation patterns are identified from observed behavior."
              },
              {
                step: "4",
                title: "Code Generation",
                description: "Working HTML/CSS/JS code is generated that reproduces the observed behavior with responsive design and interactions."
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-10 h-10 rounded-full bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 flex items-center justify-center shrink-0">
                  <span className="text-[#FF6E3C] font-bold">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Try It Yourself</h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Replay implements behavior-driven UI reconstruction. Upload your own video and see what gets generated.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6E3C] text-white font-semibold rounded-xl hover:bg-[#FF6E3C]/90 transition-colors"
          >
            Try Replay Free
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
