import { ExtractedColor } from "../types";

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Check if a color is near-white, near-black, or pure gray (likely not a brand color)
function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Pure white/black
  if ((r > 245 && g > 245 && b > 245) || (r < 10 && g < 10 && b < 10)) return true;
  // Pure grays (r≈g≈b within 5)
  if (Math.abs(r - g) < 6 && Math.abs(g - b) < 6 && Math.abs(r - b) < 6) return true;
  return false;
}

export async function extractColors(): Promise<ExtractedColor[]> {
  const colors: ExtractedColor[] = [];
  const seen = new Set<string>();

  // 1. Paint styles (local styles defined in this file)
  const paintStyles = await figma.getLocalPaintStylesAsync();
  for (const style of paintStyles) {
    if (!style.paints || style.paints.length === 0) continue;
    const paint = style.paints[0];
    if (paint.type === "SOLID" && paint.visible !== false) {
      const { r, g, b } = paint.color;
      const hex = rgbToHex(r, g, b);
      const parts = style.name.split("/");
      const name = style.name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();

      if (!seen.has(name)) {
        seen.add(name);
        colors.push({
          name,
          hex,
          opacity: paint.opacity,
          group: parts.length > 1 ? parts[0].trim() : undefined,
        });
      }
    }
  }

  // 2. Variables (COLOR type) — available on paid Figma plans
  try {
    const variables = await figma.variables.getLocalVariablesAsync("COLOR");
    for (const variable of variables) {
      const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
      if (!collection) continue;

      const modeId = collection.defaultModeId;
      const value = variable.valuesByMode[modeId];

      // Resolve aliases
      let resolvedValue = value;
      if (value && typeof value === "object" && "type" in value && (value as any).type === "VARIABLE_ALIAS") {
        try {
          const aliasVar = await figma.variables.getVariableByIdAsync((value as any).id);
          if (aliasVar) {
            const aliasCollection = await figma.variables.getVariableCollectionByIdAsync(aliasVar.variableCollectionId);
            if (aliasCollection) {
              resolvedValue = aliasVar.valuesByMode[aliasCollection.defaultModeId];
            }
          }
        } catch (_e) {}
      }

      if (resolvedValue && typeof resolvedValue === "object" && "r" in resolvedValue) {
        const { r, g, b } = resolvedValue as { r: number; g: number; b: number; a?: number };
        const hex = rgbToHex(r, g, b);
        const name = variable.name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();

        if (!seen.has(name)) {
          seen.add(name);
          colors.push({
            name,
            hex,
            opacity: "a" in resolvedValue ? (resolvedValue as any).a : 1,
            group: collection.name,
          });
        }
      }
    }
  } catch (_e) {
    // Variables API not available
  }

  // 3. Fallback: scan actual node fills on canvas (catches external/published styles)
  if (colors.length === 0) {
    try {
      const seenHex = new Set<string>();
      const nodes = figma.root.findAll(
        (n) => "fills" in n && Array.isArray((n as any).fills) && (n as any).fills.length > 0
      );

      // Sample up to 500 nodes to avoid slowdown on huge files
      const sample = nodes.slice(0, 500);

      for (const node of sample) {
        try {
          const fills = (node as GeometryMixin).fills;
          if (!Array.isArray(fills)) continue;

          for (const fill of fills) {
            if (fill.type === "SOLID" && fill.visible !== false) {
              const { r, g, b } = fill.color;
              const hex = rgbToHex(r, g, b);

              if (seenHex.has(hex) || isNeutral(hex)) continue;
              seenHex.add(hex);

              // Try to get the bound style name
              let styleName = "";
              try {
                if ("fillStyleId" in node && (node as any).fillStyleId) {
                  const styleId = (node as any).fillStyleId;
                  if (typeof styleId === "string" && styleId !== "") {
                    const style = await figma.getStyleByIdAsync(styleId);
                    if (style) styleName = style.name;
                  }
                }
              } catch (_e) {}

              const name = styleName
                ? styleName.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase()
                : `color-${hex.slice(1)}`;

              if (!seen.has(name)) {
                seen.add(name);
                colors.push({
                  name,
                  hex,
                  opacity: fill.opacity ?? 1,
                  group: styleName ? styleName.split("/")[0].trim() : "Discovered",
                });
              }
            }
          }
        } catch (_e) {
          // Skip nodes that error on fill access
        }
      }
    } catch (_e) {}
  }

  return colors;
}
