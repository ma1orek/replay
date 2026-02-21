import { ExtractionResult, ReplayDesignTokens } from "../types";

/**
 * Map extracted Figma data to Replay.build DesignTokens format.
 * Must match the shape in types/design-system.ts → DesignTokens interface.
 */
export function mapToReplayTokens(data: ExtractionResult): ReplayDesignTokens {
  // Colors: name → hex
  const colors: Record<string, string> = {};
  for (const c of data.colors) {
    colors[c.name] = c.hex;
  }

  // Typography: deduplicate font families, map sizes/weights/lineHeights
  const fontFamilySet = new Map<string, string>();
  const fontSize: Record<string, string> = {};
  const fontWeight: Record<string, number> = {};
  const lineHeight: Record<string, string> = {};

  for (const t of data.typography) {
    // Deduplicate font families
    if (!fontFamilySet.has(t.fontFamily)) {
      const key = `font-${t.fontFamily.toLowerCase().replace(/\s+/g, "-")}`;
      fontFamilySet.set(t.fontFamily, key);
    }

    // Use style name as key for size/weight/lineHeight
    fontSize[t.name] = `${t.fontSize}px`;
    fontWeight[t.name] = t.fontWeight;
    if (t.lineHeight !== "normal") {
      lineHeight[t.name] = t.lineHeight;
    }
  }

  const fontFamily: Record<string, string> = {};
  for (const [family, key] of fontFamilySet.entries()) {
    fontFamily[key] = `${family}, sans-serif`;
  }

  // Spacing: name → value
  const spacing: Record<string, string> = {};
  for (const s of data.spacing) {
    spacing[s.name] = s.value;
  }

  // Border radius: name → value
  const borderRadius: Record<string, string> = {};
  for (const r of data.borderRadius) {
    borderRadius[r.name] = r.value;
  }

  // Shadows: name → CSS value
  const shadows: Record<string, string> = {};
  for (const s of data.shadows) {
    shadows[s.name] = s.cssValue;
  }

  return {
    colors,
    typography: { fontFamily, fontSize, fontWeight, lineHeight },
    spacing,
    borderRadius,
    shadows,
  };
}
