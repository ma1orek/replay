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

/**
 * Categorize component layer following the Storybook source structure.
 * Respects the original Storybook category path (e.g. "Components/Inputs/Button")
 * and maps to the 6-layer system: foundations, primitives, elements, components, patterns, product.
 */
function categorizeLayer(category: string, componentName?: string): string {
  const catLower = category.toLowerCase();
  const nameLower = (componentName || "").toLowerCase();
  
  // 1. FOUNDATIONS - tokens, colors, typography, spacing, icons
  if (catLower.includes("foundation") || catLower.includes("token")) return "foundations";
  if (catLower.includes("color") && !catLower.includes("component")) return "foundations";
  if (catLower.includes("typography") && !nameLower.includes("component")) return "foundations";
  if (catLower.includes("spacing") || catLower.includes("breakpoint") || catLower.includes("shadow")) return "foundations";
  
  // 2. PRIMITIVES / LAYOUT - structural building blocks
  if (catLower.includes("layout")) return "primitives";
  if (catLower.includes("primitive")) return "primitives";
  const layoutNames = ["box", "stack", "container", "grid", "grid item", "divider", "spacer"];
  if (layoutNames.some(p => nameLower === p || nameLower === p.replace(" ", ""))) return "primitives";
  
  // 3. ELEMENTS - simple atomic components (Inputs category from Storybook)
  if (catLower.includes("input") || catLower.includes("form")) return "elements";
  const inputNames = ["button", "checkbox", "radio", "radio group", "select", "select field", "select field item", 
    "switch", "toggle", "text field", "textfield", "text area", "textarea", "date field", "file field", 
    "search field", "search", "link", "checkbox group"];
  if (inputNames.some(p => nameLower === p || nameLower === p.replace(" ", ""))) return "elements";
  
  // 4. COMPONENTS - composite components (Data Display, Feedback, Navigation, Surfaces)
  if (catLower.includes("data display") || catLower.includes("data-display")) return "components";
  if (catLower.includes("feedback")) return "components";
  if (catLower.includes("navigation")) return "components";
  if (catLower.includes("surface") || catLower.includes("overlay")) return "components";
  
  // Map specific component names to "components" layer
  const componentNames = ["table", "carousel", "carousel item", "tooltip", "modal", "dialog", 
    "result dialog", "result toast", "bottom sheet", "breadcrumb", "breadcrumbs", "tabs", 
    "tab", "pagination", "menu", "dropdown", "accordion", "badge", "status tag", 
    "skeleton", "trend", "icon", "avatar", "typography", "card"];
  if (componentNames.some(p => nameLower === p || nameLower === p.replace(" ", ""))) return "components";
  
  // Table sub-components stay with components
  if (nameLower.startsWith("table ") || nameLower.startsWith("table")) return "components";
  
  // 5. PATTERNS - complex reusable patterns, templates
  if (catLower.includes("pattern") || catLower.includes("template")) return "patterns";
  
  // 6. PRODUCT - business-specific components
  if (catLower.includes("product") || catLower.includes("page") || catLower.includes("section")) return "product";
  const productNames = ["hero", "hero banner", "banner", "banner box", "feature box", "feature", 
    "product box", "product carousel", "category box", "simple summary box", "simple summary box action",
    "landing", "dashboard", "pricing", "testimonial", "cta"];
  if (productNames.some(p => nameLower === p || nameLower === p.replace(" ", ""))) return "product";
  
  // Default: use "components" for anything unrecognized
  return "components";
}

/**
 * Generate component code with:
 * 1. JSDoc spec (for AI context) - description, variants, props, category
 * 2. Renderable JSX (for preview) - actual visual component
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
  const props = inferComponentProps(name, opts.layer, opts.category);
  const propsStr = props.map(p => `${p.name}: ${p.type}${p.description ? ` // ${p.description}` : ""}`).join("\n *   ");
  const description = opts.description || describeComponent(name, opts.layer, categoryPath);
  
  // Get renderable JSX for the preview
  const jsx = getComponentJSX(name, opts.layer, variantsStr);
  
  return `/**
 * ${name} - ${categoryPath || opts.layer} Component
 * ${description}
 *${pkg ? `\n * Package: ${pkg}` : ""}
 * Layer: ${opts.layer}
 * Category: ${categoryPath}
 * Variants: ${variantsStr}
 *
 * Props:
 *   ${propsStr || "className: string"}
 */
function ${pascalName}() {
  return (
    ${jsx}
  );
}`;
}

/** Generate renderable JSX for component previews */
function getComponentJSX(name: string, layer: string, variantsStr: string): string {
  const n = name.toLowerCase();
  
  // === INPUTS / ELEMENTS ===
  if (n.includes("button")) return `<div className="flex flex-wrap gap-2">
      <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">${name}</button>
      <button className="px-4 py-2 border border-blue-600 text-blue-400 font-medium rounded-lg">Outlined</button>
      <button className="px-4 py-2 bg-zinc-700 text-zinc-400 font-medium rounded-lg opacity-50" disabled>Disabled</button>
    </div>`;
  if (n.includes("text field") || n.includes("textfield") || (n.includes("input") && !n.includes("search"))) return `<div className="space-y-1 w-64">
      <label className="text-xs font-medium text-zinc-400">${name}</label>
      <input type="text" placeholder="Enter value..." className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none" />
    </div>`;
  if (n.includes("text area") || n.includes("textarea")) return `<div className="space-y-1 w-64">
      <label className="text-xs font-medium text-zinc-400">${name}</label>
      <textarea rows="3" placeholder="Enter text..." className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 resize-none"></textarea>
    </div>`;
  if (n === "checkbox" || n === "checkbox group") return `<div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-600 accent-blue-600" /><span className="text-sm text-zinc-300">Option A (checked)</span></label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-zinc-600 accent-blue-600" /><span className="text-sm text-zinc-300">Option B</span></label>
      <label className="flex items-center gap-2 cursor-pointer opacity-50"><input type="checkbox" disabled className="w-4 h-4 rounded border-zinc-600" /><span className="text-sm text-zinc-400">Disabled</span></label>
    </div>`;
  if (n === "radio" || n === "radio group") return `<div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="preview" defaultChecked className="w-4 h-4 accent-blue-600" /><span className="text-sm text-zinc-300">Option 1</span></label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="preview" className="w-4 h-4 accent-blue-600" /><span className="text-sm text-zinc-300">Option 2</span></label>
    </div>`;
  if (n.includes("switch") || n.includes("toggle")) return `<div className="flex items-center gap-3">
      <button className="relative w-11 h-6 bg-blue-600 rounded-full"><span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span></button>
      <span className="text-sm text-zinc-300">Enabled</span>
    </div>`;
  if (n.includes("select field item")) return `<div className="px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 rounded cursor-pointer">Select option item</div>`;
  if (n.includes("select")) return `<div className="space-y-1 w-64">
      <label className="text-xs font-medium text-zinc-400">${name}</label>
      <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white appearance-none">
        <option>Option 1</option><option>Option 2</option><option>Option 3</option>
      </select>
    </div>`;
  if (n.includes("search")) return `<div className="relative w-64">
      <input type="text" placeholder="Search..." className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm placeholder-zinc-500" />
      <svg className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    </div>`;
  if (n.includes("date") && n.includes("field")) return `<div className="space-y-1 w-64">
      <label className="text-xs font-medium text-zinc-400">Date Field</label>
      <input type="date" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white" />
    </div>`;
  if (n.includes("file") && n.includes("field")) return `<div className="w-64 p-4 border-2 border-dashed border-zinc-600 rounded-lg text-center">
      <p className="text-sm text-zinc-400">Drop files here or click to upload</p>
      <p className="text-xs text-zinc-500 mt-1">PDF, PNG, JPG up to 10MB</p>
    </div>`;
  if (n === "link") return `<a href="#" className="text-blue-400 hover:text-blue-300 underline text-sm">${name}</a>`;
  
  // === NAVIGATION ===
  if (n.includes("breadcrumb")) return `<nav className="flex items-center gap-2 text-sm">
      <a href="#" className="text-blue-400 hover:text-blue-300">Home</a>
      <span className="text-zinc-600">/</span>
      <a href="#" className="text-blue-400 hover:text-blue-300">Products</a>
      <span className="text-zinc-600">/</span>
      <span className="text-zinc-400">Current Page</span>
    </nav>`;
  if (n.includes("tab") && !n.includes("table")) return `<div className="flex border-b border-zinc-700">
      <button className="px-4 py-2 text-sm text-blue-400 border-b-2 border-blue-400 font-medium">Tab 1</button>
      <button className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300">Tab 2</button>
      <button className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300">Tab 3</button>
    </div>`;
  
  // === DATA DISPLAY ===
  if (n === "table") return `<div className="border border-zinc-700 rounded-lg overflow-hidden w-80">
      <table className="w-full">
        <thead className="bg-zinc-800"><tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Name</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Status</th>
          <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Value</th>
        </tr></thead>
        <tbody>
          <tr className="border-t border-zinc-700"><td className="px-3 py-2 text-sm text-white">Item A</td><td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Active</span></td><td className="px-3 py-2 text-sm text-zinc-300 text-right">$42.00</td></tr>
          <tr className="border-t border-zinc-700"><td className="px-3 py-2 text-sm text-white">Item B</td><td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Pending</span></td><td className="px-3 py-2 text-sm text-zinc-300 text-right">$18.50</td></tr>
        </tbody>
      </table>
    </div>`;
  if (n.startsWith("table ") && n !== "table") return `<div className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-zinc-400">${name} <span className="text-zinc-500">(sub-component of Table)</span></div>`;
  if (n.includes("carousel item")) return `<div className="flex-shrink-0 w-48 h-32 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 text-sm">Carousel Item</div>`;
  if (n.includes("product carousel")) return `<div className="flex gap-3 overflow-hidden w-full">
      <div className="flex-shrink-0 w-48 p-3 bg-zinc-800 border border-zinc-700 rounded-lg"><div className="w-full h-20 bg-zinc-700 rounded mb-2"></div><p className="text-xs text-white font-medium">Product A</p><p className="text-xs text-zinc-400">$29.99</p></div>
      <div className="flex-shrink-0 w-48 p-3 bg-zinc-800 border border-zinc-700 rounded-lg"><div className="w-full h-20 bg-zinc-700 rounded mb-2"></div><p className="text-xs text-white font-medium">Product B</p><p className="text-xs text-zinc-400">$49.99</p></div>
    </div>`;
  if (n.includes("carousel")) return `<div className="flex gap-3 overflow-hidden w-80">
      <div className="flex-shrink-0 w-48 h-32 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 text-xs">Slide 1</div>
      <div className="flex-shrink-0 w-48 h-32 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 text-xs">Slide 2</div>
    </div>`;
  if (n.includes("tooltip")) return `<div className="relative inline-block">
      <span className="text-sm text-zinc-300 border-b border-dashed border-zinc-500 cursor-help">Hover me</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-700 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">Tooltip content</div>
    </div>`;
  if (n.includes("status tag") || n.includes("badge")) return `<div className="flex gap-2 flex-wrap">
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Active</span>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Pending</span>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Error</span>
    </div>`;
  if (n.includes("trend")) return `<div className="flex items-center gap-2">
      <span className="text-green-400 text-sm font-medium flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>12.5%</span>
      <span className="text-xs text-zinc-500">vs last month</span>
    </div>`;
  if (n.includes("skeleton")) return `<div className="space-y-3 w-64 animate-pulse">
      <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
      <div className="h-4 bg-zinc-700 rounded w-full"></div>
      <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
    </div>`;
  if (n === "icon" || n === "icons") return `<div className="flex gap-3 text-zinc-400">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
    </div>`;
  if (n.includes("typography")) return `<div className="space-y-2">
      <h1 className="text-2xl font-bold text-white">Heading 1</h1>
      <h2 className="text-xl font-semibold text-white">Heading 2</h2>
      <h3 className="text-lg font-medium text-white">Heading 3</h3>
      <p className="text-sm text-zinc-400">Body text paragraph</p>
      <p className="text-xs text-zinc-500">Caption / small text</p>
    </div>`;
  
  // === FEEDBACK ===
  if (n.includes("modal")) return `<div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl w-72 shadow-xl">
      <h3 className="text-base font-semibold text-white mb-2">Modal Title</h3>
      <p className="text-zinc-400 text-sm mb-4">Modal content goes here.</p>
      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1.5 text-zinc-400 text-sm rounded-lg hover:bg-zinc-700">Cancel</button>
        <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Confirm</button>
      </div>
    </div>`;
  if (n.includes("result dialog")) return `<div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl w-64 text-center">
      <div className="w-10 h-10 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></div>
      <h3 className="text-white font-medium mb-1">Success!</h3>
      <p className="text-zinc-400 text-xs">Operation completed.</p>
    </div>`;
  if (n.includes("result toast") || n.includes("toast")) return `<div className="flex items-center gap-3 px-4 py-3 bg-green-900/30 border border-green-700/50 rounded-lg w-72">
      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
      <span className="text-sm text-green-300">Success notification</span>
    </div>`;
  if (n.includes("bottom sheet")) return `<div className="w-72 bg-zinc-800 border border-zinc-700 rounded-t-xl p-4">
      <div className="w-8 h-1 bg-zinc-600 rounded-full mx-auto mb-3"></div>
      <h3 className="text-white font-medium text-sm mb-2">Bottom Sheet</h3>
      <p className="text-zinc-400 text-xs">Sheet content panel</p>
    </div>`;
  
  // === PRODUCT / CONTENT ===
  if (n.includes("feature box")) return `<div className="p-5 bg-zinc-800 border border-zinc-700 rounded-xl w-64">
      <div className="w-full h-24 bg-zinc-700 rounded-lg mb-3"></div>
      <h3 className="text-sm font-semibold text-white mb-1">Feature Title</h3>
      <p className="text-xs text-zinc-400 mb-3">Feature description with supporting text.</p>
      <button className="text-xs text-blue-400 font-medium">Learn More →</button>
    </div>`;
  if (n.includes("product box")) return `<div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl w-56">
      <div className="w-full h-28 bg-zinc-700 rounded-lg mb-3 flex items-center justify-center text-zinc-500 text-xs">Product Image</div>
      <h4 className="text-sm font-medium text-white mb-0.5">Product Name</h4>
      <p className="text-xs text-zinc-400 mb-1">Short description</p>
      <span className="text-xs text-zinc-500">$49.99</span>
    </div>`;
  if (n.includes("hero banner") || n === "hero") return `<section className="py-8 px-6 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 text-center rounded-xl">
      <h1 className="text-2xl font-bold text-white mb-2">Hero Banner</h1>
      <p className="text-zinc-400 text-sm mb-4 max-w-sm mx-auto">Hero section with headline, subtitle and CTA</p>
      <button className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">Get Started</button>
    </section>`;
  if (n.includes("banner box") || n === "banner") return `<div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg flex items-center justify-between">
      <span className="text-white font-medium text-sm">Promotional Banner</span>
      <button className="px-3 py-1 bg-blue-600/30 text-blue-300 text-xs rounded">Learn More</button>
    </div>`;
  if (n.includes("category box") || n.includes("category")) return `<div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl w-48">
      <div className="w-full h-20 bg-zinc-700 rounded-lg mb-2"></div>
      <h4 className="text-sm font-medium text-white">Category Name</h4>
      <p className="text-xs text-zinc-500">12 items</p>
    </div>`;
  if (n.includes("simple summary")) return `<div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl w-64">
      <h4 className="text-sm font-medium text-white mb-3">Summary</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-xs"><span className="text-zinc-400">Subtotal</span><span className="text-white">$129.00</span></div>
        <div className="flex justify-between text-xs"><span className="text-zinc-400">Shipping</span><span className="text-white">$5.99</span></div>
        <div className="border-t border-zinc-700 pt-2 flex justify-between text-sm"><span className="text-white font-medium">Total</span><span className="text-white font-medium">$134.99</span></div>
      </div>
    </div>`;
  
  // === LAYOUT ===
  if (n === "container") return `<div className="p-4 border-2 border-dashed border-zinc-600 rounded-lg w-72"><p className="text-xs text-zinc-500 text-center">Container (max-width constrained)</p></div>`;
  if (n.includes("grid item")) return `<div className="p-3 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400 text-center">Grid Item</div>`;
  if (n.includes("grid")) return `<div className="grid grid-cols-3 gap-2 w-64">
      <div className="p-3 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400 text-center">1</div>
      <div className="p-3 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400 text-center">2</div>
      <div className="p-3 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400 text-center">3</div>
    </div>`;
  
  // === FALLBACK ===
  return `<div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center">
          <span className="text-xs text-zinc-400 font-medium">${name.charAt(0)}</span>
        </div>
        <div>
          <div className="text-white font-medium text-sm">${name}</div>
          <div className="text-zinc-500 text-xs">${variantsStr}</div>
        </div>
      </div>
    </div>`;
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
