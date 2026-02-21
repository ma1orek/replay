import { ExtractedShadow } from "../types";

export function extractEffects(): ExtractedShadow[] {
  const effectStyles = figma.getLocalEffectStyles();
  const shadows: ExtractedShadow[] = [];

  for (const style of effectStyles) {
    const shadowEffects = style.effects.filter(
      (e) => (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") && e.visible !== false
    );

    if (shadowEffects.length === 0) continue;

    const cssValue = shadowEffects
      .map((e) => {
        const shadow = e as DropShadowEffect;
        const { r, g, b, a } = shadow.color;
        const inset = e.type === "INNER_SHADOW" ? "inset " : "";
        return `${inset}${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a.toFixed(2)})`;
      })
      .join(", ");

    const name = style.name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();
    shadows.push({ name, cssValue });
  }

  return shadows;
}
