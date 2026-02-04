/**
 * Component Extractor
 * 
 * Extracts components from generated HTML/code using data-component attributes.
 * Analyzes component structure to determine props, variants, and categories.
 */

import { ComponentData, PropDefinition } from "./types";

/**
 * Extract all components from generated code
 * Uses data-component attributes to identify extractable sections
 */
export function extractComponentsFromCode(code: string): ComponentData[] {
  const components: ComponentData[] = [];
  const seenNames = new Set<string>();

  // Regex to find elements with data-component attribute
  // Matches: <tag data-component="Name" ...>content</tag>
  const componentRegex = /<([a-z][a-z0-9]*)\s+[^>]*data-component="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi;

  let match;
  while ((match = componentRegex.exec(code)) !== null) {
    const [fullMatch, tagName, componentName, content] = match;
    
    // Skip duplicates
    if (seenNames.has(componentName)) continue;
    seenNames.add(componentName);

    const component = analyzeComponent(componentName, fullMatch, tagName);
    components.push(component);
  }

  // Also extract common semantic elements as layout components
  const layoutExtractors = [
    { name: "Header", selector: /<header[^>]*>([\s\S]*?)<\/header>/i },
    { name: "Footer", selector: /<footer[^>]*>([\s\S]*?)<\/footer>/i },
    { name: "Navigation", selector: /<nav[^>]*>([\s\S]*?)<\/nav>/i },
    { name: "Sidebar", selector: /<aside[^>]*>([\s\S]*?)<\/aside>/i },
    { name: "Main", selector: /<main[^>]*>([\s\S]*?)<\/main>/i },
  ];

  for (const { name, selector } of layoutExtractors) {
    if (seenNames.has(name)) continue;
    
    const layoutMatch = code.match(selector);
    if (layoutMatch && layoutMatch[0].length > 100) { // Only if substantial content
      seenNames.add(name);
      components.push(analyzeComponent(name, layoutMatch[0], name.toLowerCase()));
    }
  }

  // Extract section elements
  const sectionRegex = /<section[^>]*(?:id="([^"]+)")?[^>]*>([\s\S]*?)<\/section>/gi;
  let sectionMatch;
  let sectionIndex = 1;
  
  while ((sectionMatch = sectionRegex.exec(code)) !== null) {
    const [fullMatch, sectionId] = sectionMatch;
    const name = sectionId 
      ? toPascalCase(sectionId) + "Section"
      : `Section${sectionIndex++}`;
    
    if (seenNames.has(name)) continue;
    if (fullMatch.length < 100) continue; // Skip tiny sections
    
    seenNames.add(name);
    components.push(analyzeComponent(name, fullMatch, "section"));
  }

  return components;
}

/**
 * Analyze a component to extract its metadata
 */
function analyzeComponent(
  name: string,
  code: string,
  tagName: string
): ComponentData {
  const props = extractPropsFromElement(code);
  const variants = extractVariantsFromElement(code);
  const cssClasses = extractCssClasses(code);
  const category = determineCategory(tagName, name, code);

  return {
    name: toPascalCase(name),
    code,
    props,
    variants,
    defaultProps: generateDefaultProps(props),
    description: generateDescription(name, category),
    category,
    cssClasses,
  };
}

/**
 * Extract props from element attributes
 */
export function extractPropsFromElement(code: string): PropDefinition[] {
  const props: PropDefinition[] = [];
  const seenProps = new Set<string>();

  // Extract data-variant attribute
  const variantMatch = code.match(/data-variant="([^"]+)"/);
  if (variantMatch) {
    const variants = extractAllVariants(code);
    props.push({
      name: "variant",
      type: variants.length > 0 ? variants.map(v => `"${v}"`).join(" | ") : "string",
      defaultValue: `"${variantMatch[1]}"`,
      required: false,
      description: "Visual variant of the component",
      options: variants,
    });
    seenProps.add("variant");
  }

  // Extract data-size attribute
  const sizeMatch = code.match(/data-size="([^"]+)"/);
  if (sizeMatch) {
    props.push({
      name: "size",
      type: '"sm" | "md" | "lg"',
      defaultValue: `"${sizeMatch[1]}"`,
      required: false,
      description: "Size of the component",
      options: ["sm", "md", "lg"],
    });
    seenProps.add("size");
  }

  // Check for interactive elements
  if (/<button/i.test(code) || /onclick/i.test(code)) {
    if (!seenProps.has("onClick")) {
      props.push({
        name: "onClick",
        type: "() => void",
        required: false,
        description: "Click handler",
      });
      seenProps.add("onClick");
    }
    
    if (!seenProps.has("disabled")) {
      props.push({
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        required: false,
        description: "Whether the component is disabled",
      });
      seenProps.add("disabled");
    }
  }

  // Check for form elements
  if (/<input/i.test(code) || /<textarea/i.test(code)) {
    if (!seenProps.has("value")) {
      props.push({
        name: "value",
        type: "string",
        required: false,
        description: "Input value",
      });
      seenProps.add("value");
    }
    
    if (!seenProps.has("onChange")) {
      props.push({
        name: "onChange",
        type: "(value: string) => void",
        required: false,
        description: "Change handler",
      });
      seenProps.add("onChange");
    }
    
    if (!seenProps.has("placeholder")) {
      const placeholderMatch = code.match(/placeholder="([^"]+)"/);
      props.push({
        name: "placeholder",
        type: "string",
        defaultValue: placeholderMatch ? `"${placeholderMatch[1]}"` : undefined,
        required: false,
        description: "Placeholder text",
      });
      seenProps.add("placeholder");
    }
  }

  // Check for images
  if (/<img/i.test(code)) {
    if (!seenProps.has("src")) {
      const srcMatch = code.match(/src="([^"]+)"/);
      props.push({
        name: "src",
        type: "string",
        defaultValue: srcMatch ? `"${srcMatch[1]}"` : undefined,
        required: true,
        description: "Image source URL",
      });
      seenProps.add("src");
    }
    
    if (!seenProps.has("alt")) {
      const altMatch = code.match(/alt="([^"]+)"/);
      props.push({
        name: "alt",
        type: "string",
        defaultValue: altMatch ? `"${altMatch[1]}"` : '""',
        required: true,
        description: "Image alt text",
      });
      seenProps.add("alt");
    }
  }

  // Check for links
  if (/<a\s/i.test(code)) {
    if (!seenProps.has("href")) {
      const hrefMatch = code.match(/href="([^"]+)"/);
      props.push({
        name: "href",
        type: "string",
        defaultValue: hrefMatch ? `"${hrefMatch[1]}"` : '"#"',
        required: false,
        description: "Link URL",
      });
      seenProps.add("href");
    }
  }

  return props;
}

/**
 * Extract all variant values from code
 */
function extractAllVariants(code: string): string[] {
  const variants = new Set<string>();
  
  // From data-variant
  const variantMatches = code.matchAll(/data-variant="([^"]+)"/g);
  for (const match of variantMatches) {
    variants.add(match[1]);
  }

  // From class names with common variant patterns
  const classMatch = code.match(/class(?:Name)?="([^"]+)"/);
  if (classMatch) {
    const classes = classMatch[1].split(/\s+/);
    for (const cls of classes) {
      // Look for patterns like btn-primary, btn-secondary
      const variantMatch = cls.match(/(?:btn|button|badge|card|text)-(\w+)/);
      if (variantMatch) {
        variants.add(variantMatch[1]);
      }
    }
  }

  return Array.from(variants);
}

/**
 * Extract variants from element (for backward compatibility)
 */
export function extractVariantsFromElement(code: string): string[] {
  return extractAllVariants(code);
}

/**
 * Extract CSS classes from code
 */
function extractCssClasses(code: string): string[] {
  const classes = new Set<string>();
  const classMatches = code.matchAll(/class(?:Name)?="([^"]+)"/g);
  
  for (const match of classMatches) {
    match[1].split(/\s+/).forEach((cls) => {
      if (cls && !cls.includes("{") && !cls.includes("$")) {
        classes.add(cls);
      }
    });
  }

  return Array.from(classes);
}

/**
 * Determine component category based on tag and content
 */
function determineCategory(
  tagName: string,
  name: string,
  code: string
): ComponentData["category"] {
  const lowerTag = tagName.toLowerCase();
  const lowerName = name.toLowerCase();

  // Layout components
  if (["header", "footer", "nav", "aside", "main"].includes(lowerTag)) {
    return "layout";
  }
  if (lowerName.includes("header") || lowerName.includes("footer") || 
      lowerName.includes("nav") || lowerName.includes("sidebar")) {
    return "layout";
  }

  // Section components
  if (lowerTag === "section" || lowerName.includes("section") ||
      lowerName.includes("hero") || lowerName.includes("feature")) {
    return "section";
  }

  // Form components
  if (/<(input|textarea|select|form)/i.test(code)) {
    return "form";
  }

  // UI components (buttons, cards, badges, etc.)
  if (/<button/i.test(code) || lowerName.includes("button") ||
      lowerName.includes("card") || lowerName.includes("badge") ||
      lowerName.includes("modal") || lowerName.includes("dropdown")) {
    return "ui";
  }

  // Default to display
  return "display";
}

/**
 * Generate default props based on prop definitions
 */
function generateDefaultProps(props: PropDefinition[]): Record<string, any> {
  const defaults: Record<string, any> = {};

  for (const prop of props) {
    if (prop.defaultValue !== undefined) {
      try {
        // Try to parse the default value
        defaults[prop.name] = JSON.parse(prop.defaultValue);
      } catch {
        // If it's a string with quotes, remove them
        if (prop.defaultValue.startsWith('"') && prop.defaultValue.endsWith('"')) {
          defaults[prop.name] = prop.defaultValue.slice(1, -1);
        } else {
          defaults[prop.name] = prop.defaultValue;
        }
      }
    }
  }

  return defaults;
}

/**
 * Generate description for a component
 */
function generateDescription(name: string, category?: string): string {
  const categoryStr = category ? ` ${category}` : "";
  const readableName = name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
  
  return `A${categoryStr} component for ${readableName}`;
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

/**
 * Extract components from file structure (FileNode array)
 */
export function extractComponentsFromFileStructure(
  files: Array<{ path: string; content: string; type: string }>
): ComponentData[] {
  const components: ComponentData[] = [];

  for (const file of files) {
    if (file.type === "component" && file.content) {
      const extracted = extractComponentsFromCode(file.content);
      components.push(...extracted);
    }
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return components.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}
