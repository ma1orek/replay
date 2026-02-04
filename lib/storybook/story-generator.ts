/**
 * Story Generator
 * 
 * Generates Storybook story files and component files from extracted component data.
 */

import { ComponentData, PropDefinition } from "./types";

/**
 * Generate a Storybook story file for a component
 */
export function generateStoryFile(
  component: ComponentData,
  projectTitle: string = "Generated Project"
): string {
  const { name, variants, defaultProps, description, category } = component;
  
  // Determine story category
  const storyCategory = category 
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : "Components";

  // Generate variant stories
  const variantStories = variants
    ?.map((variant) => {
      const variantName = variant.charAt(0).toUpperCase() + variant.slice(1).replace(/-/g, "");
      return `
export const ${variantName}: Story = {
  args: {
    ...Default.args,
    variant: "${variant}",
  },
};`;
    })
    .join("\n") || "";

  // Generate argTypes from props
  const argTypes = component.props
    .map((prop) => {
      if (prop.options && prop.options.length > 0) {
        return `    ${prop.name}: {
      control: "select",
      options: [${prop.options.map((o) => `"${o}"`).join(", ")}],
      description: "${prop.description || prop.name}",
    },`;
      }
      if (prop.type === "boolean") {
        return `    ${prop.name}: {
      control: "boolean",
      description: "${prop.description || prop.name}",
    },`;
      }
      if (prop.type === "string") {
        return `    ${prop.name}: {
      control: "text",
      description: "${prop.description || prop.name}",
    },`;
      }
      return null;
    })
    .filter(Boolean)
    .join("\n");

  return `import type { Meta, StoryObj } from "@storybook/react";
import { ${name} } from "./${name}";

/**
 * ${description || `${name} component from ${projectTitle}`}
 */
const meta: Meta<typeof ${name}> = {
  title: "${storyCategory}/${name}",
  component: ${name},
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "${description || `Auto-generated ${name} component`}",
      },
    },
  },
${argTypes ? `  argTypes: {\n${argTypes}\n  },` : ""}
};

export default meta;
type Story = StoryObj<typeof ${name}>;

/**
 * Default ${name} story
 */
export const Default: Story = {
  args: ${JSON.stringify(defaultProps || {}, null, 4).replace(/\n/g, "\n  ")},
};
${variantStories}

/**
 * Interactive playground
 */
export const Playground: Story = {
  args: {
    ...Default.args,
  },
};
`;
}

/**
 * Generate a React component file from component data
 */
export function generateComponentFile(component: ComponentData): string {
  const { name, code, props, description, cssClasses } = component;

  // Generate props interface
  const propsInterface = props.length > 0
    ? `
export interface ${name}Props {
${props
  .map((p) => {
    const optional = p.required ? "" : "?";
    const typeStr = p.options 
      ? p.options.map(o => `"${o}"`).join(" | ")
      : p.type;
    return `  /** ${p.description || p.name} */
  ${p.name}${optional}: ${typeStr};`;
  })
  .join("\n")}
  /** Additional CSS classes */
  className?: string;
  /** Child elements */
  children?: React.ReactNode;
}
`
    : `
export interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}
`;

  // Generate default props
  const defaultPropsStr = props
    .filter((p) => p.defaultValue !== undefined)
    .map((p) => `  ${p.name} = ${p.defaultValue},`)
    .join("\n");

  // Clean up the HTML code and convert to JSX
  const jsxCode = convertHtmlToJsx(code);

  return `import * as React from "react";

/**
 * ${description || `${name} component`}
 * 
 * @example
 * <${name}>Content</${name}>
 */
${propsInterface}

export function ${name}({
${defaultPropsStr}
  className = "",
  children,
  ...props
}: ${name}Props) {
  return (
    ${jsxCode}
  );
}

${name}.displayName = "${name}";
`;
}

/**
 * Convert HTML string to JSX-compatible code
 */
function convertHtmlToJsx(html: string): string {
  let jsx = html
    // Convert class to className
    .replace(/\bclass=/g, "className=")
    // Convert for to htmlFor
    .replace(/\bfor=/g, "htmlFor=")
    // Convert style strings to objects (basic)
    .replace(/style="([^"]*)"/g, (match, styles) => {
      const styleObj = styles
        .split(";")
        .filter(Boolean)
        .map((s: string) => {
          const [key, value] = s.split(":").map((x: string) => x.trim());
          if (!key || !value) return null;
          const camelKey = key.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
          return `${camelKey}: "${value}"`;
        })
        .filter(Boolean)
        .join(", ");
      return `style={{ ${styleObj} }}`;
    })
    // Self-close void elements
    .replace(/<(img|br|hr|input|meta|link)([^>]*)>/gi, "<$1$2 />")
    // Remove data-component attribute (used for extraction)
    .replace(/\s*data-component="[^"]*"/g, "")
    // Add className prop interpolation
    .replace(/className="([^"]*)"/g, 'className={`$1 ${className}`}');

  // If the JSX doesn't have a root element, wrap it
  const trimmed = jsx.trim();
  if (!trimmed.startsWith("<")) {
    jsx = `<div className={className}>${jsx}</div>`;
  }

  return jsx;
}

/**
 * Generate a barrel export file (index.ts)
 */
export function generateBarrelExport(components: ComponentData[]): string {
  const exports = components
    .map((c) => `export { ${c.name} } from "./${c.name}";`)
    .join("\n");

  return `/**
 * Generated Components
 * Auto-generated barrel export for all components
 */

${exports}
`;
}

/**
 * Generate CSS file with extracted styles
 */
export function generateStylesFile(components: ComponentData[]): string {
  const allClasses = new Set<string>();
  
  components.forEach((c) => {
    c.cssClasses?.forEach((cls) => allClasses.add(cls));
  });

  return `/**
 * Generated Styles
 * CSS classes extracted from components
 */

/* Base styles */
:root {
  --color-primary: #ff6e3c;
  --color-background: #111111;
  --color-foreground: #fafafa;
  --color-muted: #555555;
  --color-border: rgba(255, 255, 255, 0.08);
}

/* Component classes */
${Array.from(allClasses)
  .map((cls) => `.${cls} { /* TODO: Add styles */ }`)
  .join("\n")}
`;
}
