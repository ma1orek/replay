"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyleInjectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER_EXAMPLES = [
  "Apple-style with frosted glass and smooth animations",
  "Dark mode like Linear with subtle glow effects",
  "Colorful gradients like Stripe's landing page",
  "Minimalist Notion-style with clean typography",
  "Glassmorphism with vibrant mesh backgrounds",
  "Neubrutalist with bold borders and shadows",
  "Vercel-dark with high contrast black & white",
];

const STYLE_PRESETS = [
  { id: "custom", name: "Custom", desc: "Describe your own style • Full creative control", fullDesc: "" },
  { id: "original", name: "Original", desc: "1:1 Copy • Exact Match • Pixel Perfect", fullDesc: "Recreates the exact design from the video with pixel-perfect accuracy. No style changes applied." },
  { id: "apple", name: "Apple Style", desc: "Frosted Glass • Clear Depth • Soft Blur • Dark Glass", fullDesc: "Clean SF Pro typography, subtle glassmorphism, generous whitespace, and refined micro-interactions." },
  { id: "material-you", name: "Material You", desc: "Dynamic Color • Playful Rounding • Surface Tones • Ripple Effect", fullDesc: "Google's expressive design with dynamic color extraction, rounded shapes, and layered surfaces." },
  { id: "fluent", name: "Microsoft Fluent", desc: "Mica Texture • Acrylic Layer • Segoe Clean • Elevation Depth", fullDesc: "Modern Windows aesthetic with translucent materials, depth hierarchy, and clean Segoe UI." },
  { id: "linear", name: "Linear Dark", desc: "Midnight Blur • Subtle Glow • Micro Borders • Precision Dark", fullDesc: "Technical precision with dark backgrounds, subtle borders, and refined hover states." },
  { id: "cyberpunk", name: "Cyberpunk Neon", desc: "Neon Glitch • Matrix Black • Electric Blue • Acid Green", fullDesc: "Futuristic aesthetics with glowing neon accents, dark backgrounds, and tech-inspired elements." },
  { id: "obsidian", name: "Obsidian Minimal", desc: "Pure Void • Monochrome • High Contrast • Sharp Edges", fullDesc: "Deep blacks with minimal colors, focusing on typography and content hierarchy." },
  { id: "neubrutalism", name: "Neubrutalism", desc: "Hard Edge • Bold Stroke • Neo-Pop • Stark Shadow", fullDesc: "Bold borders, stark shadows, and playful colors inspired by 90s web aesthetics." },
  { id: "bento", name: "Bento Grid", desc: "Modular Blocks • Soft Corners • Organized Flow • Card Layout", fullDesc: "Japanese-inspired modular design with organized card layouts and soft rounded corners." },
  { id: "glassmorphism", name: "Glassmorphism Pure", desc: "Crystal Layer • Vivid Mesh • Ice Texture • Translucent", fullDesc: "Frosted glass panels with vivid gradient backgrounds and translucent layers." },
  { id: "dribbble", name: "Dribbble Candy", desc: "Pastel Gradient • Deep Shadow • Pill Shapes • Candy Pop", fullDesc: "Playful pastels, large shadows, pill-shaped buttons, and cheerful aesthetic." },
  { id: "swiss", name: "Swiss International", desc: "Heavy Type • Absolute White • Grid Focus • Helvetica", fullDesc: "Typography-first design with strong grid alignment and classic Swiss style." },
  { id: "enterprise", name: "Enterprise Trust", desc: "Clean Trust • Crisp Whites • Soft Shadow • Vibrant Blue", fullDesc: "Professional SaaS aesthetic with trust-building blues and clean white spaces." },
  { id: "spotify", name: "Spotify Dark", desc: "Deep Black • Green Accent • Card Overflow • Music Vibe", fullDesc: "Dark theme with vibrant green accents and card-based content organization." },
  { id: "notion", name: "Notion Style", desc: "Paper White • Content First • Minimal Icons • Soft Gray", fullDesc: "Clean document-style interface with focus on readability and minimal distractions." },
  { id: "stripe", name: "Stripe Design", desc: "Premium Gradient • Trust Blue • Clean Forms • Smooth Flow", fullDesc: "Premium gradient backgrounds, smooth animations, and trust-building blue accents." },
  { id: "vercel", name: "Vercel Dark", desc: "Pure Black • White Type • Zero Color • Maximum Contrast", fullDesc: "Pure black and white with maximum contrast and no color distractions." },
  { id: "tailwind", name: "Tailwind UI", desc: "Utility Modern • Indigo Accent • Component Ready • Responsive", fullDesc: "Modern utility-first components with indigo accents and responsive design." },
];

export default function StyleInjector({ value, onChange, disabled }: StyleInjectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find preset - check if value starts with any preset name
  const selectedPreset = STYLE_PRESETS.find(p => value === p.name || value.startsWith(p.name + "."));
  
  // Extract custom instructions from value
  const customInstructions = selectedPreset 
    ? value.slice(selectedPreset.name.length).replace(/^\.\s*/, '').trim()
    : "";

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(72, Math.min(textareaRef.current.scrollHeight, 150)) + 'px';
    }
  }, [value]);

  // Animated typing placeholder effect
  useEffect(() => {
    if (isFocused) return; // Don't animate when focused
    
    const currentText = PLACEHOLDER_EXAMPLES[placeholderIndex];
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    if (isTyping) {
      // Type out the text
      const typeChar = () => {
        if (charIndex <= currentText.length) {
          setAnimatedPlaceholder(currentText.slice(0, charIndex));
          charIndex++;
          timeoutId = setTimeout(typeChar, 40 + Math.random() * 30);
        } else {
          // Pause at end, then start erasing
          timeoutId = setTimeout(() => setIsTyping(false), 2000);
        }
      };
      typeChar();
    } else {
      // Erase the text
      let eraseIndex = currentText.length;
      const eraseChar = () => {
        if (eraseIndex >= 0) {
          setAnimatedPlaceholder(currentText.slice(0, eraseIndex));
          eraseIndex--;
          timeoutId = setTimeout(eraseChar, 20);
        } else {
          // Move to next placeholder
          setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
          setIsTyping(true);
        }
      };
      eraseChar();
    }
    
    return () => clearTimeout(timeoutId);
  }, [placeholderIndex, isTyping, isFocused]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors duration-300 ease-out bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.08]",
            isOpen && "border-[#FF6E3C]/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className={cn("text-xs", selectedPreset ? "text-white/80" : "text-white/40")}>
            {selectedPreset ? selectedPreset.name : "Select a style..."}
          </span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && !disabled && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0a0a0a] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.8)] z-50">
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    // Keep custom instructions when changing preset
                    onChange(customInstructions ? `${preset.name}. ${customInstructions}` : preset.name);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.05]",
                    selectedPreset?.id === preset.id && "bg-[#FF6E3C]/10 border-l-2 border-[#FF6E3C]"
                  )}
                >
                  <div className="text-xs text-white/80">{preset.name}</div>
                  <div className="text-[10px] text-white/40 truncate">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Textarea for custom additions - always enabled */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={selectedPreset?.id === "custom" ? value.replace("Custom. ", "").replace("Custom", "") : (selectedPreset ? customInstructions : value)}
          onChange={(e) => {
            if (selectedPreset?.id === "custom") {
              // For Custom, save directly without prefix
              onChange(e.target.value ? `Custom. ${e.target.value}` : "Custom");
            } else if (selectedPreset) {
              // Keep preset and update custom instructions (preserve spaces while typing)
              const customText = e.target.value;
              onChange(customText ? `${selectedPreset.name}. ${customText}` : selectedPreset.name);
            } else {
              onChange(e.target.value);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={selectedPreset && selectedPreset.id !== "custom" ? "Add custom instructions (optional)" : (isFocused ? "Describe your target design system..." : "")}
          disabled={disabled}
          rows={3}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg text-xs text-white/70 placeholder:text-white/25 transition-colors duration-300 ease-out focus:outline-none textarea-grow bg-white/[0.03] border border-white/[0.06] focus:border-[#FF6E3C]/20 focus:bg-white/[0.035] min-h-[72px]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {((!customInstructions && selectedPreset?.id === "custom") || (!value && !selectedPreset)) && !isFocused && (
          <div className="absolute inset-0 px-3 py-2.5 pointer-events-none flex items-start">
            <span className="text-xs text-white/25">{animatedPlaceholder}</span>
            <span className="inline-block w-[2px] h-3 bg-[#FF6E3C]/50 ml-0.5 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
