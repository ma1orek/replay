import Link from "next/link";
import { Sparkles, Palette, Wand2, Check, Layers, Search } from "lucide-react";

// Real style categories and presets from the app
const STYLE_CATEGORIES = [
  { name: "Creative & Experimental", color: "text-orange-400" },
  { name: "Dark Premium", color: "text-purple-400" },
  { name: "Light & Clean", color: "text-blue-400" },
  { name: "Motion & 3D", color: "text-cyan-400" },
  { name: "Brand Inspired", color: "text-green-400" },
];

const FEATURED_STYLES = [
  { name: "Custom", desc: "Describe your own style" },
  { name: "Original", desc: "1:1 Copy • Exact Match" },
  { name: "Apple Style", desc: "Frosted Glass • Clean • SF Pro" },
  { name: "Stripe Design", desc: "Premium Gradient • Trust Blue" },
  { name: "Spatial Glass", desc: "Vision Pro • 3D Tilt • Light" },
  { name: "Dark Cosmos", desc: "Purple/Cyan Glow • Glass • Float" },
  { name: "Kinetic Brutalism", desc: "15vw Type • Acid Yellow • Bold" },
  { name: "Neo-Retro OS", desc: "Windows 95 • Draggable • Vaporwave" },
];

const ALL_STYLES = [
  // Creative & Experimental
  { name: "Particle Brain", desc: "AI Cloud • 50k Points • WebGL", category: "Creative" },
  { name: "Old Money Heritage", desc: "Cream • Gold Serif • Classic", category: "Creative" },
  { name: "Tactical HUD", desc: "Sci-Fi Game • Brackets • Scanning", category: "Creative" },
  { name: "Urban Grunge", desc: "Concrete • Spray Paint • Street", category: "Creative" },
  { name: "Ink & Zen", desc: "Japanese • Vertical • Sumi-e", category: "Creative" },
  { name: "Infinite Tunnel", desc: "Z-Axis • Fly Through • Warp", category: "Creative" },
  { name: "Frosted Acrylic", desc: "Thick Glass • Solid • Glow Through", category: "Creative" },
  { name: "Datamosh Glitch", desc: "Pixel Sort • Melt • RGB Split", category: "Creative" },
  { name: "Origami Fold", desc: "Paper 3D • Unfold • Envelope", category: "Creative" },
  { name: "Spatial Glass", desc: "Vision Pro • 3D Tilt • Light", category: "Creative" },
  { name: "Kinetic Brutalism", desc: "15vw Type • Acid Yellow • Bold", category: "Creative" },
  { name: "Gravity Physics", desc: "Falling Tags • Drag & Throw • Bounce", category: "Creative" },
  { name: "Neo-Retro OS", desc: "Windows 95 • Draggable • Vaporwave", category: "Creative" },
  { name: "Soft Clay Pop", desc: "Claymorphism • Pastel • Bouncy", category: "Creative" },
  { name: "Deconstructed Editorial", desc: "Fashion • Vertical Text • Chaos", category: "Creative" },
  { name: "Cinematic Product", desc: "Apple Page • Scroll-Driven 3D", category: "Creative" },
  // Dark Premium
  { name: "High-End Dark Glass", desc: "Aurora Glow • Spotlight • Premium", category: "Dark" },
  { name: "Void Spotlight", desc: "Deep Void • Mouse Glow • Heavy", category: "Dark" },
  { name: "Dark Cosmos", desc: "Purple/Cyan Glow • Glass • Float", category: "Dark" },
  { name: "Liquid Chrome", desc: "Metallic • Y2K • Reflections", category: "Dark" },
  // Light & Clean
  { name: "Swiss Grid", desc: "Visible Grid • Massive Type • Sharp", category: "Light" },
  { name: "Silent Luxury", desc: "Radical Minimal • White Void", category: "Light" },
  { name: "Soft Organic", desc: "Blobs • Pastel • Underwater", category: "Light" },
  { name: "Ethereal Mesh", desc: "Aurora Blobs • Soft SaaS • Modern", category: "Light" },
  { name: "Neo-Brutalism", desc: "Hard Shadow • Thick Border • Bouncy", category: "Light" },
  // Motion & 3D
  { name: "Isometric City", desc: "3D CSS • Voxel Blocks • Hover Lift", category: "Motion" },
  { name: "X-Ray Blueprint", desc: "Wireframe Reveal • Scanner • Technical", category: "Motion" },
  { name: "Digital Collage", desc: "Scrapbook • Stickers • Draggable", category: "Motion" },
  // Brand Inspired
  { name: "Apple Style", desc: "Frosted Glass • Clean • SF Pro", category: "Brand" },
  { name: "Stripe Design", desc: "Premium Gradient • Trust Blue", category: "Brand" },
  { name: "Spotify Dark", desc: "#121212 • Green Accent • Cards", category: "Brand" },
];

export default function StyleInjectionPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Guides</span>
          <span>/</span>
          <span className="text-white">Style Injection</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <Sparkles className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-white">Style Injection</h1>
        </div>
        <p className="text-xl text-white/60">
          Transform your UI's look instantly with 30+ pre-built design styles.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What is Style Injection?</h2>
        <p className="text-white/70 leading-relaxed">
          Style Injection lets you apply completely different visual aesthetics to your generated UI 
          without changing the structure. Choose from brand-inspired styles like Apple and Stripe, 
          creative effects like Datamosh Glitch, or describe your own custom style.
        </p>
      </div>

      {/* Style Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Style Categories</h2>
        <div className="flex flex-wrap gap-2">
          {STYLE_CATEGORIES.map((cat) => (
            <span key={cat.name} className={`px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 ${cat.color}`}>
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Featured Styles */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Featured Styles</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {FEATURED_STYLES.map((style) => (
            <div key={style.name} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-medium text-white">{style.name}</h4>
              <p className="text-xs text-white/50 mt-1">{style.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All 30+ Styles */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">All 30+ Styles</h2>
        <div className="space-y-6">
          {["Creative", "Dark", "Light", "Motion", "Brand"].map((category) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-white/60 mb-2">{category}</h3>
              <div className="grid md:grid-cols-3 gap-2">
                {ALL_STYLES.filter(s => s.category === category).map((style) => (
                  <div key={style.name} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-xs text-white/80">{style.name}</span>
                    <p className="text-[10px] text-white/40 mt-0.5">{style.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to use */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How to Use</h2>
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: "Upload Your Video",
              description: "Record or upload your UI video as usual."
            },
            {
              step: 2,
              title: "Open Style Selector",
              description: "Click the Style dropdown below the Context field."
            },
            {
              step: 3,
              title: "Browse or Search",
              description: "Use the search bar to find styles, or browse by category."
            },
            {
              step: 4,
              title: "Select & Customize",
              description: "Pick a preset, then optionally add custom instructions to refine it."
            },
            {
              step: 5,
              title: "Generate",
              description: "Click Generate. Your UI will have the new visual style applied."
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#FF6E3C] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{item.step}</span>
              </div>
              <div>
                <h4 className="font-medium text-white">{item.title}</h4>
                <p className="text-sm text-white/60">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom styles */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Custom Style Prompts</h2>
        <p className="text-white/70 leading-relaxed">
          Select "Custom" and describe any style you want:
        </p>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 font-mono text-sm">
          <p className="text-[#FF6E3C]">"Apple-style with frosted glass and smooth animations"</p>
          <p className="text-[#FF6E3C] mt-2">"Dark mode like Linear with subtle glow effects"</p>
          <p className="text-[#FF6E3C] mt-2">"Colorful gradients like Stripe's landing page"</p>
          <p className="text-[#FF6E3C] mt-2">"Minimalist Notion-style with clean typography"</p>
          <p className="text-[#FF6E3C] mt-2">"Glassmorphism with vibrant mesh backgrounds"</p>
        </div>
      </div>

      {/* What changes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What Gets Changed</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-400" />
              <h4 className="font-medium text-green-400">Changes:</h4>
            </div>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Colors, gradients, and backgrounds</li>
              <li>• Font families and typography</li>
              <li>• Border radius and shadows</li>
              <li>• Button and component styles</li>
              <li>• Animation effects</li>
              <li>• Glass/blur effects</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-white/60" />
              <h4 className="font-medium text-white">Preserved:</h4>
            </div>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Layout structure</li>
              <li>• Content and text</li>
              <li>• Navigation order</li>
              <li>• Functionality</li>
              <li>• Responsive behavior</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Tips</h2>
        <div className="p-4 rounded-xl bg-[#FF6E3C]/10 border border-[#FF6E3C]/30">
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <Wand2 className="w-4 h-4 text-[#FF6E3C] mt-0.5" />
              <span>Use "Original" style for exact 1:1 recreation of the video</span>
            </li>
            <li className="flex items-start gap-2">
              <Wand2 className="w-4 h-4 text-[#FF6E3C] mt-0.5" />
              <span>Combine presets with custom instructions for unique results</span>
            </li>
            <li className="flex items-start gap-2">
              <Wand2 className="w-4 h-4 text-[#FF6E3C] mt-0.5" />
              <span>Try "Apple Style" for clean, professional SaaS looks</span>
            </li>
            <li className="flex items-start gap-2">
              <Wand2 className="w-4 h-4 text-[#FF6E3C] mt-0.5" />
              <span>Use "Kinetic Brutalism" for bold, attention-grabbing designs</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
