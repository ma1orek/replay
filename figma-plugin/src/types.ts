// ============================================
// Shared types between code.ts (sandbox) and ui.tsx (iframe)
// Communication via figma.ui.postMessage / parent.postMessage
// ============================================

// --- Extracted data from Figma document ---

export interface ExtractedColor {
  name: string;
  hex: string;
  opacity?: number;
  group?: string; // from path separators e.g. "Brand/Primary" → group: "Brand"
}

export interface ExtractedTypography {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
}

export interface ExtractedShadow {
  name: string;
  cssValue: string; // "2px 4px 8px rgba(0,0,0,0.1)"
}

export interface ExtractedSpacing {
  name: string;
  value: string; // "8px", "16px"
}

export interface ExtractedBorderRadius {
  name: string;
  value: string; // "8px", "16px"
}

export interface ExtractedComponent {
  name: string;
  description: string;
  properties: { name: string; type: string; defaultValue?: string }[];
  variants: string[];
  category: string;
}

export interface ExtractionResult {
  fileName: string;
  colors: ExtractedColor[];
  typography: ExtractedTypography[];
  shadows: ExtractedShadow[];
  spacing: ExtractedSpacing[];
  borderRadius: ExtractedBorderRadius[];
  components: ExtractedComponent[];
}

// --- Replay DesignTokens format (must match types/design-system.ts) ---

export interface ReplayDesignTokens {
  colors: Record<string, string>;
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface ReplayComponentSpec {
  name: string;
  category: string;
  description: string;
  variants: string[];
  props: { name: string; type: string; defaultValue?: string }[];
}

// --- PostMessage protocol ---

// Messages from code.ts → ui.tsx
export type SandboxMessage =
  | { type: "extracting"; status: string }
  | { type: "extraction-complete"; data: ExtractionResult }
  | { type: "extraction-error"; error: string };

// Messages from ui.tsx → code.ts
export type UIMessage =
  | { type: "extract" }
  | { type: "close" };
