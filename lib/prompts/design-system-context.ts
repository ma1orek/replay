/**
 * Design System Context for AI Prompts
 * 
 * Provides context about available Design System components and tokens
 * to guide AI code generation towards reusing existing components.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { 
  DesignSystem, 
  DesignSystemComponent,
  DesignTokens,
  ComponentLayer,
  LAYER_ORDER 
} from "@/types/design-system";

/**
 * Fetch a Design System with all its components
 */
export async function getDesignSystem(designSystemId: string): Promise<DesignSystem | null> {
  const adminSupabase = createAdminClient();
  if (!adminSupabase) return null;

  const { data, error } = await adminSupabase
    .from("design_systems")
    .select("*")
    .eq("id", designSystemId)
    .single();

  if (error || !data) {
    console.error("[DesignSystemContext] Error fetching DS:", error);
    return null;
  }

  return data as DesignSystem;
}

/**
 * Fetch components for a Design System
 */
export async function getDesignSystemComponents(
  designSystemId: string
): Promise<DesignSystemComponent[]> {
  const adminSupabase = createAdminClient();
  if (!adminSupabase) return [];

  const { data, error } = await adminSupabase
    .from("design_system_components")
    .select("*")
    .eq("design_system_id", designSystemId)
    .eq("is_approved", true)
    .order("usage_count", { ascending: false })
    .order("layer", { ascending: true })
    .limit(50); // Limit to most-used components

  if (error) {
    console.error("[DesignSystemContext] Error fetching components:", error);
    return [];
  }

  return (data || []) as DesignSystemComponent[];
}

/**
 * Format design tokens for AI prompt
 */
function formatTokensForPrompt(tokens: DesignTokens | null): string {
  if (!tokens) return "No tokens defined.";

  const sections: string[] = [];

  // Colors
  if (tokens.colors && Object.keys(tokens.colors).length > 0) {
    const colorLines = Object.entries(tokens.colors)
      .slice(0, 15) // Limit to key colors
      .map(([name, value]) => `  --color-${name}: ${value};`);
    sections.push(`Colors:\n${colorLines.join('\n')}`);
  }

  // Typography
  if (tokens.typography) {
    const typoLines: string[] = [];
    if (tokens.typography.fontFamily) {
      Object.entries(tokens.typography.fontFamily).slice(0, 3).forEach(([name, value]) => {
        typoLines.push(`  --font-${name}: ${value};`);
      });
    }
    if (tokens.typography.fontSize) {
      Object.entries(tokens.typography.fontSize).slice(0, 6).forEach(([name, value]) => {
        typoLines.push(`  --text-${name}: ${value};`);
      });
    }
    if (typoLines.length > 0) {
      sections.push(`Typography:\n${typoLines.join('\n')}`);
    }
  }

  // Spacing
  if (tokens.spacing && Object.keys(tokens.spacing).length > 0) {
    const spacingLines = Object.entries(tokens.spacing)
      .slice(0, 8)
      .map(([name, value]) => `  --space-${name}: ${value};`);
    sections.push(`Spacing:\n${spacingLines.join('\n')}`);
  }

  // Border Radius
  if (tokens.borderRadius && Object.keys(tokens.borderRadius).length > 0) {
    const radiusLines = Object.entries(tokens.borderRadius)
      .slice(0, 5)
      .map(([name, value]) => `  --radius-${name}: ${value};`);
    sections.push(`Border Radius:\n${radiusLines.join('\n')}`);
  }

  return sections.join('\n\n') || "No tokens defined.";
}

/**
 * Format component as a SPECIFICATION for the AI prompt.
 * Instead of showing truncated placeholder code, we show the component's
 * purpose, variants, category, and usage guidance so the AI can build
 * proper implementations that match the design system.
 */
function formatComponentSnippet(component: DesignSystemComponent): string {
  const variants = component.variants
    ?.map((v: any) => v.name)
    .filter((n: string) => n && n !== "Docs")
    .join(", ") || "Default";
  
  const description = component.docs?.description || "";
  const usage = component.docs?.usage || "";
  const pkg = (component.docs as any)?.package || "";
  const category = component.category || "";
  
  let line = `- [${component.name}]`;
  if (description) line += ` ${description}`;
  line += `\n    Variants: ${variants}`;
  if (category) line += ` | Category: ${category}`;
  if (pkg) line += ` | Package: ${pkg}`;
  if (usage) line += `\n    ${usage}`;
  
  return line;
}

/**
 * Group components by layer for organized prompt
 */
function groupComponentsByLayer(
  components: DesignSystemComponent[]
): Record<ComponentLayer, DesignSystemComponent[]> {
  const grouped: Record<string, DesignSystemComponent[]> = {
    foundations: [],
    primitives: [],
    elements: [],
    components: [],
    patterns: [],
    product: [],
  };

  components.forEach(comp => {
    const layer = comp.layer || 'components';
    if (grouped[layer]) {
      grouped[layer].push(comp);
    } else {
      grouped.components.push(comp);
    }
  });

  return grouped as Record<ComponentLayer, DesignSystemComponent[]>;
}

/**
 * Generate the Design System context for AI prompts
 * 
 * This function creates a detailed context string that instructs the AI
 * to reuse existing components and follow the design system's tokens.
 */
export async function getDesignSystemPromptContext(
  designSystemId: string
): Promise<string> {
  const [ds, components] = await Promise.all([
    getDesignSystem(designSystemId),
    getDesignSystemComponents(designSystemId),
  ]);

  if (!ds) {
    return ""; // No design system context
  }

  const groupedComponents = groupComponentsByLayer(components);
  
  // Build component sections
  const componentSections: string[] = [];
  const layerOrder: ComponentLayer[] = ['primitives', 'elements', 'components', 'patterns'];
  
  layerOrder.forEach(layer => {
    const layerComponents = groupedComponents[layer];
    if (layerComponents.length > 0) {
      const componentList = layerComponents
        .slice(0, 10) // Limit per layer
        .map(formatComponentSnippet)
        .join('\n');
      componentSections.push(`**${layer.toUpperCase()}:**\n${componentList}`);
    }
  });

  const componentListText = componentSections.length > 0
    ? componentSections.join('\n\n')
    : "No components yet.";

  return `
### DESIGN SYSTEM CONTEXT (CRITICAL - FOLLOW STRICTLY)
You are generating code for the "${ds.name}" Design System.

**DESIGN TOKENS (USE THESE EXACT VALUES):**
${formatTokensForPrompt(ds.tokens)}

**AVAILABLE COMPONENTS (${components.length} total):**
${componentListText}

**DESIGN SYSTEM RULES:**
1. **IMPLEMENT COMPONENTS FROM SPECS** - The components listed above are specifications from the design system. When generating code, create REAL implementations that match the purpose, structure, and variants described. Use the same component names.
2. **USE EXACT TOKENS** - Apply design tokens as CSS variables: \`var(--color-primary)\`, \`var(--space-4)\`, etc.
3. **MAINTAIN CONSISTENCY** - All generated components should share a cohesive visual style (border radius, shadows, spacing, color palette).
4. **FOLLOW VARIANT STRUCTURE** - If a component has variants (Primary, Secondary, Disabled etc.), implement support for those variants.
5. **FOLLOW LAYER HIERARCHY** - Compose complex components from simpler ones (primitives -> elements -> components -> patterns).
6. **MARK NEW COMPONENTS** - If you create a component that doesn't exist in the library above, mark it with \`data-new-component="true"\` and \`data-component="ComponentName"\` attributes.
`;
}

/**
 * Detect new components from generated code
 * Looks for data-new-component="true" attributes
 */
export function detectNewComponentsFromCode(
  generatedCode: string,
  existingComponentNames: string[]
): { name: string; code: string }[] {
  const newComponents: { name: string; code: string }[] = [];
  
  // Regex to find elements with data-new-component="true"
  const newComponentRegex = /data-new-component=["']true["'][^>]*data-component=["']([^"']+)["']/gi;
  
  let match;
  while ((match = newComponentRegex.exec(generatedCode)) !== null) {
    const componentName = match[1];
    
    // Skip if already exists
    if (existingComponentNames.includes(componentName)) {
      continue;
    }
    
    // Try to extract the component code (basic extraction)
    // This is a simplified approach - in production, use a proper HTML parser
    const startIndex = generatedCode.lastIndexOf('<', match.index);
    if (startIndex !== -1) {
      // Find the matching closing tag
      const tagMatch = generatedCode.slice(startIndex).match(/<(\w+)/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const closeTagRegex = new RegExp(`</${tagName}>`, 'i');
        const closeMatch = generatedCode.slice(startIndex).match(closeTagRegex);
        if (closeMatch && closeMatch.index) {
          const endIndex = startIndex + closeMatch.index + closeMatch[0].length;
          const componentCode = generatedCode.slice(startIndex, endIndex);
          
          newComponents.push({
            name: componentName,
            code: componentCode,
          });
        }
      }
    }
  }
  
  // Also check for data-component without data-new-component (might be extracted components)
  const componentRegex = /data-component=["']([^"']+)["']/gi;
  const allComponentNames = new Set<string>();
  
  while ((match = componentRegex.exec(generatedCode)) !== null) {
    allComponentNames.add(match[1]);
  }
  
  // Find components that aren't in the existing list and weren't already marked as new
  const existingSet = new Set(existingComponentNames);
  const newSet = new Set(newComponents.map(c => c.name));
  
  allComponentNames.forEach(name => {
    if (!existingSet.has(name) && !newSet.has(name)) {
      // This is a potentially new component
      // We could try to extract its code, but for safety just flag it
      newComponents.push({
        name,
        code: `<!-- Component "${name}" detected but code not extracted -->`,
      });
    }
  });
  
  return newComponents;
}

/**
 * Increment usage count for components used in a generation
 */
export async function incrementComponentUsage(componentIds: string[]): Promise<void> {
  if (componentIds.length === 0) return;
  
  const adminSupabase = createAdminClient();
  if (!adminSupabase) return;

  // Increment usage count for each component
  for (const id of componentIds) {
    await adminSupabase.rpc('increment_component_usage', { component_id: id });
  }
}
