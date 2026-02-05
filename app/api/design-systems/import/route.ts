import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface StorybookStory {
  id: string;
  name: string;
  title: string;
  kind?: string;
  type?: string; // "story" | "docs" | "group" in Storybook v5+
  importPath?: string;
  exportName?: string;
  tags?: string[];
  parameters?: {
    docs?: {
      description?: {
        component?: string;
        story?: string;
      };
    };
  };
}

interface StorybookIndex {
  v: number;
  entries?: Record<string, StorybookStory>;
  stories?: Record<string, StorybookStory>;
}

/**
 * POST /api/design-systems/import
 * Import a design system from Storybook URL
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body = await request.json();
    const { url, name } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Clean the URL
    let baseUrl = url.trim();
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Try to fetch Storybook index
    let storybookData: StorybookIndex | null = null;
    let components: { 
      name: string; 
      category: string; 
      description?: string; 
      states?: string[]; 
      stories?: string[];
      importPath?: string;
      packageName?: string;
      tags?: string[];
    }[] = [];
    
    // Try different Storybook API endpoints (various versions and configurations)
    const endpoints = [
      // Storybook 7+ endpoints
      `${baseUrl}/index.json`,
      `${baseUrl}/stories.json`,
      // Static builds
      `${baseUrl}/storybook-static/index.json`,
      `${baseUrl}/storybook-static/stories.json`,
      // Older Storybook versions
      `${baseUrl}/storybook/index.json`,
      `${baseUrl}/storybook/stories.json`,
      // Alternative paths
      `${baseUrl}/sb/index.json`,
      `${baseUrl}/sb/stories.json`,
      // With iframe paths (some setups)
      `${baseUrl}/iframe.html`, // Will trigger fallback
      // Root fallback
      baseUrl,
    ];

    let htmlContent: string | null = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`[Import] Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            "Accept": "application/json, text/html",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          // 15 second timeout
          signal: AbortSignal.timeout(15000)
        });
        
        if (response.ok) {
          const contentType = response.headers.get("content-type") || "";
          const text = await response.text();
          
          if (contentType.includes("application/json") || text.trim().startsWith("{")) {
            try {
              storybookData = JSON.parse(text);
              console.log(`[Import] Found Storybook JSON at ${endpoint}`);
              break;
            } catch (parseError) {
              console.log(`[Import] Failed to parse JSON from ${endpoint}`);
            }
          } else if (contentType.includes("text/html")) {
            // Store HTML for fallback parsing
            htmlContent = text;
            console.log(`[Import] Found HTML at ${endpoint}, will try to extract stories`);
          }
        }
      } catch (fetchError: any) {
        console.log(`[Import] Failed to fetch ${endpoint}:`, fetchError.message);
      }
    }
    
    // Fallback: Try to extract component names from HTML if no JSON found
    if (!storybookData && htmlContent) {
      console.log(`[Import] Attempting to extract components from HTML content`);
      // Look for story/component patterns in HTML
      const componentMatches = new Set<string>();
      
      // Pattern: data-story-id or story names in script tags
      const storyIdPattern = /data-story-id="([^"]+)"/g;
      const storyNamePattern = /"((?:components|elements|patterns|primitives|pages|layout|form)\/[^"]+)"/gi;
      
      let match;
      while ((match = storyIdPattern.exec(htmlContent)) !== null) {
        const parts = match[1].split("--");
        if (parts.length >= 1) {
          const name = parts[0].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
          componentMatches.add(name);
        }
      }
      while ((match = storyNamePattern.exec(htmlContent)) !== null) {
        const parts = match[1].split("/");
        if (parts.length >= 1) {
          componentMatches.add(parts[parts.length - 1]);
        }
      }
      
      if (componentMatches.size > 0) {
        console.log(`[Import] Extracted ${componentMatches.size} component names from HTML`);
        components = Array.from(componentMatches).map(name => ({
          name,
          category: "Components",
          states: ["Default"],
          stories: [],
        }));
      }
    }

    if (storybookData) {
      // Parse Storybook entries - capture components AND their states/variants
      const entries = storybookData.entries || storybookData.stories || {};
      const componentMap = new Map<string, { 
        name: string; 
        category: string; 
        description?: string;
        states: string[];
        stories: string[];
        importPath?: string;
        packageName?: string;
        tags?: string[];
      }>();

      Object.values(entries).forEach((entry: any) => {
        // Skip docs entries - only import actual stories
        if (entry.type === "docs") return;
        if (entry.name === "Docs") return;

        const title = entry.title || entry.kind || "";
        const parts = title.split("/");
        const componentName = parts[parts.length - 1];
        const category = parts.length > 1 ? parts.slice(0, -1).join("/") : "Uncategorized";
        const storyName = entry.name || "Default";
        
        // Extract package name from importPath (e.g., "../../packages/button/src/button.stories.ts" -> "button")
        let packageName: string | undefined;
        if (entry.importPath) {
          const pkgMatch = entry.importPath.match(/packages\/([^/]+)\//);
          if (pkgMatch) packageName = pkgMatch[1];
        }
        
        if (componentName) {
          const existing = componentMap.get(componentName);
          if (existing) {
            if (!existing.states.includes(storyName)) {
              existing.states.push(storyName);
            }
            existing.stories.push(entry.id);
            // Capture importPath/packageName from first seen entry
            if (!existing.importPath && entry.importPath) existing.importPath = entry.importPath;
            if (!existing.packageName && packageName) existing.packageName = packageName;
            if (!existing.tags && entry.tags) existing.tags = entry.tags;
          } else {
            componentMap.set(componentName, {
              name: componentName,
              category,
              description: entry.parameters?.docs?.description?.component || undefined,
              states: [storyName],
              stories: [entry.id],
              importPath: entry.importPath,
              packageName,
              tags: entry.tags,
            });
          }
        }
      });

      components = Array.from(componentMap.values());
      console.log(`[Import] Found ${components.length} components with states:`, 
        components.map(c => `${c.name} (${(c as any).states?.length || 0} states)`).join(", "));
    }

    // If we couldn't fetch from API, create a placeholder design system
    if (components.length === 0) {
      console.log("[Import] No components found via API, creating placeholder DS");
      components = [
        { name: "Button", category: "Elements" },
        { name: "Input", category: "Form" },
        { name: "Card", category: "Components" },
      ];
    }

    // Create the design system
    const dsName = name?.trim() || extractNameFromUrl(baseUrl) || "Imported Library";
    
    const { data: newDS, error: dsError } = await adminSupabase
      .from("design_systems")
      .insert({
        user_id: user.id,
        name: dsName,
        source_type: "storybook",
        source_url: baseUrl,
        tokens: {
          colors: {},
          typography: { fontFamily: {}, fontSize: {}, fontWeight: {}, lineHeight: {} },
          spacing: {},
          borderRadius: {},
          shadows: {},
        },
        is_default: false,
        is_public: false,
      })
      .select()
      .single();

    if (dsError) {
      console.error("[Import] Failed to create design system:", dsError);
      return NextResponse.json({ error: dsError.message }, { status: 500 });
    }

    // Insert components with their states/variants
    const componentInserts = components.map(comp => {
      const states = comp.states || ["Default"];
      const variants = states.map(state => ({
        name: state,
        propsOverride: {},
        description: `${state} variant of ${comp.name}`,
      }));
      const layer = categorizeLayer(comp.category, comp.name);
      
      return {
        design_system_id: newDS.id,
        name: comp.name,
        layer,
        category: comp.category,
        code: generateComponentSpec(comp.name, {
          states,
          layer,
          category: comp.category,
          description: comp.description,
          packageName: comp.packageName,
          dsName,
        }),
        variants: variants,
        props: [],
        docs: {
          description: comp.description || `${comp.name} component from ${dsName}`,
          usage: `Use <${comp.name.replace(/\s+/g, "")} /> for ${describeUsage(comp.name, layer)}`,
          states: states.join(", "),
          package: comp.packageName || undefined,
          category: comp.category,
          accessibility: "",
          bestPractices: [],
        },
        is_approved: true,
        usage_count: 0,
      };
    });

    let insertedCount = 0;
    if (componentInserts.length > 0) {
      // Insert in batches of 20 to avoid payload size limits
      const batchSize = 20;
      for (let i = 0; i < componentInserts.length; i += batchSize) {
        const batch = componentInserts.slice(i, i + batchSize);
        const { error: compError, data: insertedData } = await adminSupabase
          .from("design_system_components")
          .insert(batch)
          .select("id");

        if (compError) {
          console.error(`[Import] Failed to insert batch ${i / batchSize + 1}:`, compError.message, compError.details, compError.hint);
          // Try inserting one by one for this batch
          for (const comp of batch) {
            const { error: singleError } = await adminSupabase
              .from("design_system_components")
              .insert(comp);
            if (singleError) {
              console.error(`[Import] Failed to insert component "${comp.name}":`, singleError.message);
            } else {
              insertedCount++;
            }
          }
        } else {
          insertedCount += insertedData?.length || batch.length;
        }
      }
      console.log(`[Import] Successfully inserted ${insertedCount}/${componentInserts.length} components`);
    }

    return NextResponse.json({
      success: true,
      designSystem: {
        id: newDS.id,
        name: newDS.name,
        component_count: insertedCount,
        source_type: "storybook",
        source_url: baseUrl,
      },
      components: insertedCount,
      totalParsed: components.length,
    });

  } catch (err: any) {
    console.error("[Import] Error:", err);
    return NextResponse.json({ error: err.message || "Import failed" }, { status: 500 });
  }
}

function extractNameFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    // Detect if hostname includes "designsystem" or "design-system" to append suffix later
    const hasDesignSystemPrefix = /designsystem\.|design-system\.|design\./i.test(hostname);
    // Remove common prefixes/suffixes
    const name = hostname
      .replace(/^(www\.|storybook\.|design\.|designsystem\.|design-system\.)/, "")
      .replace(/\.(com|io|dev|org|net)$/, "")
      .replace(/[.-]/g, " ")
      .split(" ")
      .filter(w => w.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    if (!name) return null;
    // If the URL was a design system subdomain, append "Design System" for clarity
    if (hasDesignSystemPrefix) {
      return `${name} Design System`;
    }
    return name;
  } catch {
    return null;
  }
}

function categorizeLayer(category: string, componentName?: string): string {
  const catLower = category.toLowerCase();
  const nameLower = (componentName || "").toLowerCase();
  
  // Check category first
  if (catLower.includes("foundation") || catLower.includes("token") || catLower.includes("color") || catLower.includes("typography")) {
    return "foundations";
  }
  
  // PRIMITIVES - basic atomic elements (check both category AND name)
  const primitivePatterns = ["icon", "text", "box", "stack", "divider", "spacer", "heading", "label", "paragraph"];
  if (catLower.includes("primitive") || primitivePatterns.some(p => nameLower === p || nameLower.includes(p))) {
    return "primitives";
  }
  
  // ELEMENTS - simple interactive components
  const elementPatterns = ["button", "input", "badge", "checkbox", "radio", "select", "switch", "toggle", "link", "tag", "chip", "avatar", "tooltip", "loader", "spinner", "skeleton"];
  if (catLower.includes("element") || elementPatterns.some(p => nameLower === p || nameLower.includes(p))) {
    return "elements";
  }
  
  // PATTERNS - complex reusable patterns
  const patternPatterns = ["card", "list", "table", "form", "modal", "dialog", "dropdown", "menu", "nav", "sidebar", "header", "footer", "grid", "carousel", "accordion", "tabs", "pagination"];
  if (catLower.includes("pattern") || catLower.includes("template") || catLower.includes("page") || patternPatterns.some(p => nameLower === p || nameLower.includes(p))) {
    return "patterns";
  }
  
  // PRODUCT - business-specific components (hero, pricing, testimonial, feature sections)
  const productPatterns = ["hero", "pricing", "testimonial", "feature", "cta", "banner", "section", "landing", "dashboard", "stats", "chart", "widget"];
  if (catLower.includes("product") || catLower.includes("section") || catLower.includes("layout") || productPatterns.some(p => nameLower.includes(p))) {
    return "product";
  }
  
  return "components";
}

/**
 * Generate a component SPECIFICATION - not fake code but a meaningful description
 * that the AI can actually use to generate proper designs using this component.
 */
function generateComponentSpec(
  name: string, 
  opts: {
    states: string[];
    layer: string;
    category: string;
    description?: string;
    packageName?: string;
    dsName: string;
  }
): string {
  const pascalName = name.replace(/[^a-zA-Z0-9]/g, "") || "Component";
  const variants = opts.states.filter(s => s !== "Default" && s !== "Docs");
  const variantsStr = variants.length > 0 ? variants.join(", ") : "Default";
  const catParts = opts.category.split("/").filter(Boolean);
  const categoryPath = catParts.join(" > ");
  const pkg = opts.packageName ? `@${opts.dsName.toLowerCase().replace(/\s+/g, "-")}/${opts.packageName}` : undefined;
  
  // Infer props from component name and category
  const props = inferComponentProps(name, opts.layer, opts.category);
  const propsStr = props.map(p => `${p.name}: ${p.type}${p.description ? ` // ${p.description}` : ""}`).join("\n *   ");
  
  // Build a rich JSDoc + component spec
  const description = opts.description || describeComponent(name, opts.layer, categoryPath);
  
  return `/**
 * ${name} - ${categoryPath || opts.layer} Component
 * ${description}
 *${pkg ? `\n * Package: ${pkg}` : ""}
 * Layer: ${opts.layer}
 * Variants: ${variantsStr}
 *
 * Props:
 *   ${propsStr || "className: string"}
 */
function ${pascalName}({ ${props.map(p => p.name).join(", ")} }) {
  // This is a Design System component from ${opts.dsName}
  // Use <${pascalName} /> in generated code to reference this component
  return null; // Actual implementation lives in the design system package
}`;
}

/** Infer likely props for a component based on its name and type */
function inferComponentProps(name: string, layer: string, category: string): { name: string; type: string; description?: string }[] {
  const n = name.toLowerCase();
  const base = [{ name: "className", type: "string", description: "Additional CSS classes" }];
  
  // Forms / Inputs
  if (n.includes("button")) return [...base, { name: "children", type: "ReactNode", description: "Button label" }, { name: "variant", type: "string", description: "Visual variant (filled, tonal, text)" }, { name: "disabled", type: "boolean" }, { name: "onClick", type: "function" }];
  if (n.includes("input") || n.includes("text field") || n.includes("textfield")) return [...base, { name: "value", type: "string" }, { name: "placeholder", type: "string" }, { name: "label", type: "string" }, { name: "disabled", type: "boolean" }, { name: "error", type: "string" }];
  if (n.includes("checkbox")) return [...base, { name: "checked", type: "boolean" }, { name: "label", type: "string" }, { name: "disabled", type: "boolean" }, { name: "onChange", type: "function" }];
  if (n.includes("radio")) return [...base, { name: "checked", type: "boolean" }, { name: "label", type: "string" }, { name: "value", type: "string" }, { name: "name", type: "string" }];
  if (n.includes("switch") || n.includes("toggle")) return [...base, { name: "checked", type: "boolean" }, { name: "label", type: "string" }, { name: "onChange", type: "function" }];
  if (n.includes("select")) return [...base, { name: "options", type: "array" }, { name: "value", type: "string" }, { name: "label", type: "string" }, { name: "placeholder", type: "string" }];
  if (n.includes("text area") || n.includes("textarea")) return [...base, { name: "value", type: "string" }, { name: "placeholder", type: "string" }, { name: "label", type: "string" }, { name: "rows", type: "number" }];
  if (n.includes("date") && n.includes("field")) return [...base, { name: "value", type: "Date" }, { name: "label", type: "string" }, { name: "format", type: "string" }];
  if (n.includes("file") && n.includes("field")) return [...base, { name: "accept", type: "string" }, { name: "label", type: "string" }, { name: "multiple", type: "boolean" }];
  if (n.includes("search")) return [...base, { name: "value", type: "string" }, { name: "placeholder", type: "string" }, { name: "onSearch", type: "function" }];
  
  // Navigation
  if (n.includes("breadcrumb")) return [...base, { name: "items", type: "array", description: "Array of {label, href}" }, { name: "separator", type: "string" }];
  if (n.includes("link")) return [...base, { name: "href", type: "string" }, { name: "children", type: "ReactNode" }];
  if (n.includes("tab")) return [...base, { name: "items", type: "array" }, { name: "activeTab", type: "string" }];
  
  // Data Display
  if (n.includes("table")) return [...base, { name: "columns", type: "array" }, { name: "data", type: "array" }, { name: "sortable", type: "boolean" }];
  if (n.includes("carousel") || n.includes("slider")) return [...base, { name: "items", type: "array" }, { name: "autoplay", type: "boolean" }, { name: "loop", type: "boolean" }];
  if (n.includes("tooltip")) return [...base, { name: "content", type: "string" }, { name: "children", type: "ReactNode" }, { name: "position", type: "string" }];
  if (n.includes("icon")) return [...base, { name: "name", type: "string", description: "Icon identifier" }, { name: "size", type: "number" }];
  if (n.includes("badge") || n.includes("tag") || n.includes("status")) return [...base, { name: "children", type: "ReactNode" }, { name: "variant", type: "string", description: "Color variant" }];
  if (n.includes("typography")) return [...base, { name: "variant", type: "string", description: "h1, h2, body, caption etc." }, { name: "children", type: "ReactNode" }];
  if (n.includes("trend")) return [...base, { name: "value", type: "number" }, { name: "direction", type: "string", description: "up or down" }];
  if (n.includes("skeleton")) return [...base, { name: "width", type: "string" }, { name: "height", type: "string" }];
  
  // Layout
  if (n.includes("grid")) return [...base, { name: "columns", type: "number" }, { name: "gap", type: "string" }, { name: "children", type: "ReactNode" }];
  if (n.includes("container")) return [...base, { name: "maxWidth", type: "string" }, { name: "children", type: "ReactNode" }];
  
  // Feedback
  if (n.includes("modal") || n.includes("dialog")) return [...base, { name: "open", type: "boolean" }, { name: "title", type: "string" }, { name: "children", type: "ReactNode" }, { name: "onClose", type: "function" }];
  if (n.includes("toast") || n.includes("result")) return [...base, { name: "message", type: "string" }, { name: "variant", type: "string", description: "success, error, warning" }];
  
  // Product / Content
  if (n.includes("feature") && n.includes("box")) return [...base, { name: "media", type: "string", description: "Image URL" }, { name: "title", type: "string" }, { name: "description", type: "string" }, { name: "children", type: "ReactNode" }];
  if (n.includes("product") && (n.includes("box") || n.includes("card"))) return [...base, { name: "media", type: "string", description: "Product image" }, { name: "label", type: "string" }, { name: "description", type: "string" }, { name: "price", type: "string" }];
  if (n.includes("product") && n.includes("carousel")) return [...base, { name: "products", type: "array" }, { name: "variant", type: "string" }];
  if (n.includes("hero") || n.includes("banner")) return [...base, { name: "title", type: "string" }, { name: "subtitle", type: "string" }, { name: "media", type: "string" }, { name: "children", type: "ReactNode" }];
  if (n.includes("category")) return [...base, { name: "title", type: "string" }, { name: "items", type: "array" }];
  if (n.includes("summary")) return [...base, { name: "title", type: "string" }, { name: "items", type: "array" }, { name: "actions", type: "ReactNode" }];
  
  // Generic with children
  if (n.includes("box") || n.includes("card") || n.includes("section") || n.includes("panel")) return [...base, { name: "children", type: "ReactNode" }, { name: "title", type: "string" }];
  
  return [...base, { name: "children", type: "ReactNode", description: "Content inside component" }];
}

/** Generate a meaningful description based on component name and layer */
function describeComponent(name: string, layer: string, categoryPath: string): string {
  const n = name.toLowerCase();
  
  if (n.includes("button")) return "Interactive button element with multiple visual variants (filled, tonal, text) and states.";
  if (n.includes("checkbox")) return "Checkbox form control with label, error, and disabled states.";
  if (n.includes("radio")) return "Radio button form control for single selection from a group.";
  if (n.includes("switch") || n.includes("toggle")) return "Toggle switch for binary on/off settings.";
  if (n.includes("input") || n.includes("text field")) return "Text input field with label, placeholder, and validation states.";
  if (n.includes("select")) return "Dropdown select field with options, search, and categorization support.";
  if (n.includes("text area")) return "Multi-line text input area with optional character limits.";
  if (n.includes("date") && n.includes("field")) return "Date picker input field supporting single and range selection.";
  if (n.includes("file") && n.includes("field")) return "File upload input with drag-and-drop and validation.";
  if (n.includes("search")) return "Search input field with autocomplete and category grouping.";
  if (n.includes("breadcrumb")) return "Navigation breadcrumbs showing current page hierarchy.";
  if (n.includes("link")) return "Styled anchor link component.";
  if (n.includes("table")) return "Data table with headers, rows, sorting, and expandable rows.";
  if (n.includes("carousel item")) return "Individual slide item for use inside a Carousel component.";
  if (n.includes("carousel")) return "Horizontal scrollable carousel with pagination and navigation controls.";
  if (n.includes("product carousel")) return "Product-specific carousel displaying product cards with images and details.";
  if (n.includes("feature box")) return "Feature highlight card with media image, title, description, and action buttons.";
  if (n.includes("product box")) return "Product display card with image, label, description, and eco-certification.";
  if (n.includes("hero banner")) return "Full-width hero section with background image, headline, and call-to-action.";
  if (n.includes("banner")) return "Promotional banner with media, text content, and action buttons.";
  if (n.includes("category")) return "Category navigation box with title and item listing.";
  if (n.includes("modal")) return "Modal dialog overlay with title, content, and action buttons.";
  if (n.includes("result dialog")) return "Result/confirmation dialog showing success, error, or warning states.";
  if (n.includes("result toast")) return "Toast notification for success, error, or warning messages.";
  if (n.includes("tooltip")) return "Contextual tooltip popup showing additional information on hover.";
  if (n.includes("icon")) return "SVG icon component from the design system icon set.";
  if (n.includes("status tag")) return "Status indicator tag/badge with color variants for different states.";
  if (n.includes("skeleton")) return "Loading placeholder skeleton with animated shimmer effect.";
  if (n.includes("typography")) return "Typography component supporting all text variants (headings, body, captions).";
  if (n.includes("trend")) return "Trend indicator showing value changes with directional arrow.";
  if (n.includes("grid item")) return "Grid layout child item with column and row span support.";
  if (n.includes("grid")) return "Responsive CSS grid layout container.";
  if (n.includes("container")) return "Page content container with responsive max-width constraints.";
  if (n.includes("simple summary")) return "Summary card displaying key-value data with optional actions.";
  if (n.includes("bottom sheet")) return "Bottom sheet panel sliding up from screen bottom.";
  
  return `${name} component from the ${categoryPath || layer} layer of the design system.`;
}

/** Describe what a component is used for */
function describeUsage(name: string, layer: string): string {
  const n = name.toLowerCase();
  if (n.includes("button")) return "all interactive buttons, CTAs, and form submissions";
  if (n.includes("input") || n.includes("field")) return "form text input fields";
  if (n.includes("checkbox")) return "multi-select options and toggles";
  if (n.includes("radio")) return "single-select option groups";
  if (n.includes("table")) return "displaying tabular data";
  if (n.includes("carousel")) return "horizontal scrolling content galleries";
  if (n.includes("card") || n.includes("box")) return "content display cards and containers";
  if (n.includes("modal") || n.includes("dialog")) return "overlay dialogs and confirmations";
  if (n.includes("nav") || n.includes("breadcrumb")) return "navigation and wayfinding";
  if (n.includes("hero") || n.includes("banner")) return "hero sections and promotional banners";
  if (n.includes("grid")) return "responsive layout grids";
  if (n.includes("toast") || n.includes("notification")) return "transient feedback messages";
  if (layer === "elements") return "interactive UI elements";
  if (layer === "patterns") return "reusable UI patterns";
  if (layer === "product") return "product-specific sections";
  return "UI composition";
}
