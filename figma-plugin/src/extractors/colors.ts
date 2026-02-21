import { ExtractedColor } from "../types";

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function extractColors(): ExtractedColor[] {
  const colors: ExtractedColor[] = [];
  const seen = new Set<string>();

  // 1. Paint styles (always available)
  const paintStyles = figma.getLocalPaintStyles();
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
    const variables = figma.variables.getLocalVariables("COLOR");
    for (const variable of variables) {
      const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
      if (!collection) continue;

      const modeId = collection.defaultModeId;
      const value = variable.valuesByMode[modeId];

      // Resolve aliases
      let resolvedValue = value;
      if (value && typeof value === "object" && "type" in value && (value as any).type === "VARIABLE_ALIAS") {
        try {
          const aliasVar = figma.variables.getVariableById((value as any).id);
          if (aliasVar) {
            const aliasCollection = figma.variables.getVariableCollectionById(aliasVar.variableCollectionId);
            if (aliasCollection) {
              resolvedValue = aliasVar.valuesByMode[aliasCollection.defaultModeId];
            }
          }
        } catch {}
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
  } catch {
    // Variables API not available — that's fine, we have paint styles
  }

  return colors;
}
