import { ExtractedComponent } from "../types";

// Infer category from page name or component path
function inferCategory(node: SceneNode): string {
  let parent: BaseNode | null = node.parent;
  while (parent && parent.type !== "PAGE") {
    parent = parent.parent;
  }
  return (parent as PageNode)?.name || "Uncategorized";
}

// Map Figma property type to simpler string
function mapPropertyType(type: string): string {
  switch (type) {
    case "BOOLEAN": return "boolean";
    case "TEXT": return "string";
    case "INSTANCE_SWAP": return "ReactNode";
    case "VARIANT": return "enum";
    default: return "string";
  }
}

// Safely read componentPropertyDefinitions (throws on broken component sets)
function safeGetProperties(node: ComponentSetNode | ComponentNode) {
  try {
    const defs = node.componentPropertyDefinitions;
    if (!defs) return [];
    return Object.entries(defs).map(([key, def]) => ({
      name: key,
      type: mapPropertyType(def.type),
      defaultValue: String(def.defaultValue || ""),
    }));
  } catch (_e) {
    return [];
  }
}

export async function extractComponents(): Promise<ExtractedComponent[]> {
  const result: ExtractedComponent[] = [];
  const seen = new Set<string>();

  // 1. Component sets (have variants)
  const componentSets = figma.root.findAll(
    (n) => n.type === "COMPONENT_SET"
  ) as ComponentSetNode[];

  for (const set of componentSets) {
    if (seen.has(set.name)) continue;
    seen.add(set.name);

    try {
      const variants = set.children
        .filter((c) => c.type === "COMPONENT")
        .map((c) => c.name);

      result.push({
        name: set.name,
        description: set.description || "",
        properties: safeGetProperties(set),
        variants,
        category: inferCategory(set),
      });
    } catch (_e) {
      // Skip broken component sets
      result.push({
        name: set.name,
        description: set.description || "",
        properties: [],
        variants: [],
        category: inferCategory(set),
      });
    }
  }

  // 2. Standalone components (not in variant sets)
  const standaloneComponents = figma.root.findAll(
    (n) => n.type === "COMPONENT" && n.parent?.type !== "COMPONENT_SET"
  ) as ComponentNode[];

  for (const comp of standaloneComponents) {
    if (seen.has(comp.name)) continue;
    seen.add(comp.name);

    result.push({
      name: comp.name,
      description: comp.description || "",
      properties: safeGetProperties(comp),
      variants: ["Default"],
      category: inferCategory(comp),
    });
  }

  return result;
}
