/**
 * UI Components Barrel Export
 * 
 * This file re-exports all UI primitives for clean imports:
 * import { Button, Input, Badge } from "@/components/ui"
 * 
 * @module components/ui
 */

// === PRIMITIVES ===
export { Button, buttonVariants, type ButtonProps } from "./button";
export { Input, type InputProps } from "./input";
export { Badge, badgeVariants, type BadgeProps } from "./badge";
export { Separator } from "./separator";
export { Popover, PopoverTrigger, PopoverContent } from "./popover";

// === BUTTONS & ACTIONS ===
export { ShimmerButton } from "./shimmer-button";

// === BACKGROUNDS & EFFECTS ===
export { AuroraBackground } from "./aurora-background";
export { BackgroundGradientAnimation } from "./background-gradient-animation";
export { BeamsBackground } from "./beams-background";
export { RetroGrid } from "./retro-grid";
export { GlowCard } from "./spotlight-card";
export { Spotlight } from "./spotlight-new";
export { DitheringShader } from "./dithering-shader";

// === CARDS ===
export { GradientCard } from "./gradient-card";
export { CTASection } from "./hero-dithering-card";
export { MovingBorder } from "./moving-border";

// === ANIMATIONS ===
export { AnimatedGroup } from "./animated-group";
export { default as AnimatedLoadingSkeleton } from "./animated-loading-skeleton";
export { BlurFade } from "./blur-fade";
export { FlipWords } from "./flip-words";
export { TextEffect } from "./text-effect";
export { TextGenerateEffect } from "./text-generate-effect";

// === FORMS & INPUTS ===
export { ColorPicker, type ColorPickerProps } from "./color-picker";

// === MEDIA ===
export { VideoCompare } from "./video-compare";

// === PRICING ===
export { BentoPricing } from "./bento-pricing";
