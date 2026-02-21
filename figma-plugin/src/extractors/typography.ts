import { ExtractedTypography } from "../types";

// Map Figma font style string to CSS weight number
function mapFontWeight(style: string): number {
  const s = style.toLowerCase();
  if (s.includes("thin") || s.includes("hairline")) return 100;
  if (s.includes("extralight") || s.includes("ultra light") || s.includes("extra light")) return 200;
  if (s.includes("light")) return 300;
  if (s.includes("regular") || s.includes("normal") || s.includes("book")) return 400;
  if (s.includes("medium")) return 500;
  if (s.includes("semibold") || s.includes("semi bold") || s.includes("demi")) return 600;
  if (s.includes("extrabold") || s.includes("ultra bold") || s.includes("extra bold")) return 800;
  if (s.includes("bold")) return 700;
  if (s.includes("black") || s.includes("heavy")) return 900;
  return 400;
}

// Format Figma line height to CSS string
function formatLineHeight(lh: LineHeight): string {
  if (lh.unit === "AUTO") return "normal";
  if (lh.unit === "PERCENT") return `${Math.round(lh.value)}%`;
  if (lh.unit === "PIXELS") return `${lh.value}px`;
  return "normal";
}

// Format Figma letter spacing to CSS string
function formatLetterSpacing(ls: LetterSpacing): string {
  if (ls.unit === "PERCENT") {
    // Figma percent is relative to font size. Convert to em.
    return `${(ls.value / 100).toFixed(3)}em`;
  }
  if (ls.unit === "PIXELS") return `${ls.value}px`;
  return "normal";
}

export async function extractTypography(): Promise<ExtractedTypography[]> {
  const textStyles = await figma.getLocalTextStylesAsync();

  return textStyles.map((style) => {
    const name = style.name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();

    return {
      name,
      fontFamily: style.fontName.family,
      fontSize: style.fontSize,
      fontWeight: mapFontWeight(style.fontName.style),
      lineHeight: formatLineHeight(style.lineHeight),
      letterSpacing: formatLetterSpacing(style.letterSpacing),
    };
  });
}
