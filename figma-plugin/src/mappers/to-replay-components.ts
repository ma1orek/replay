import { ExtractedComponent, ReplayComponentSpec } from "../types";

/**
 * Map extracted Figma components to Replay.build component spec format.
 * These are metadata-only specs for AI context (not renderable code).
 */
export function mapToReplayComponents(components: ExtractedComponent[]): ReplayComponentSpec[] {
  return components.map((comp) => ({
    name: comp.name,
    category: comp.category,
    description: comp.description || `${comp.name} component from Figma`,
    variants: comp.variants,
    props: comp.properties,
  }));
}
