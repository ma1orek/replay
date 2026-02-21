import { ExtractedSpacing, ExtractedBorderRadius } from "../types";

export async function extractSpacing(): Promise<{ spacing: ExtractedSpacing[]; borderRadius: ExtractedBorderRadius[] }> {
  const spacing: ExtractedSpacing[] = [];
  const borderRadius: ExtractedBorderRadius[] = [];
  const seenSpacing = new Set<number>();
  const seenRadius = new Set<number>();

  // 1. From Variables (FLOAT type)
  try {
    const floatVars = await figma.variables.getLocalVariablesAsync("FLOAT");
    for (const v of floatVars) {
      const collection = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
      if (!collection) continue;

      const collectionName = collection.name.toLowerCase();
      const varName = v.name.toLowerCase();
      const value = v.valuesByMode[collection.defaultModeId];

      if (typeof value !== "number" || value <= 0) continue;

      const name = v.name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();

      // Check if spacing variable
      const isSpacing =
        collectionName.includes("spacing") || collectionName.includes("space") ||
        varName.includes("spacing") || varName.includes("space") ||
        varName.includes("gap") || varName.includes("padding") || varName.includes("margin");

      // Check if border radius variable
      const isRadius =
        collectionName.includes("radius") || collectionName.includes("corner") ||
        varName.includes("radius") || varName.includes("rounded") || varName.includes("corner");

      if (isRadius && !seenRadius.has(value)) {
        seenRadius.add(value);
        borderRadius.push({ name, value: `${value}px` });
      } else if (isSpacing && !seenSpacing.has(value)) {
        seenSpacing.add(value);
        spacing.push({ name, value: `${value}px` });
      }
    }
  } catch (_e) {
    // Variables API not available
  }

  // 2. From auto-layout frames (heuristic: collect unique gap/padding)
  try {
    const frames = figma.root.findAll(
      (node) => node.type === "FRAME" && "layoutMode" in node && (node as FrameNode).layoutMode !== "NONE"
    ) as FrameNode[];

    for (const frame of frames.slice(0, 100)) {
      const values = [
        frame.itemSpacing,
        frame.paddingTop,
        frame.paddingRight,
        frame.paddingBottom,
        frame.paddingLeft,
      ];

      for (const val of values) {
        if (val > 0 && !seenSpacing.has(val)) {
          seenSpacing.add(val);
          spacing.push({ name: `space-${val}`, value: `${val}px` });
        }
      }

      // Extract corner radius from frames
      if (frame.cornerRadius && typeof frame.cornerRadius === "number" && frame.cornerRadius > 0) {
        if (!seenRadius.has(frame.cornerRadius)) {
          seenRadius.add(frame.cornerRadius);
          borderRadius.push({ name: `radius-${frame.cornerRadius}`, value: `${frame.cornerRadius}px` });
        }
      }
    }
  } catch (_e) {}

  // Sort by numeric value
  spacing.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
  borderRadius.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

  return { spacing, borderRadius };
}
