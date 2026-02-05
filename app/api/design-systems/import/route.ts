import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface StorybookStory {
  id: string;
  name: string;
  title: string;
  kind?: string;
  type?: string; // "story" | "docs" | "group" in Storybook v5+
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
    let components: { name: string; category: string; description?: string; states?: string[]; stories?: string[] }[] = [];
    
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
        states: string[];  // Track all states/variants for each component
        stories: string[]; // Track story names
      }>();

      Object.values(entries).forEach((entry: any) => {
        // Skip docs entries - only import actual stories (type "story" or undefined for backwards compat)
        if (entry.type === "docs") return;
        
        // Skip entries named "Docs" - these are auto-generated documentation pages, not real variants
        if (entry.name === "Docs") return;

        // Extract component name from title (e.g., "Components/Button" -> "Button")
        const title = entry.title || entry.kind || "";
        const parts = title.split("/");
        const componentName = parts[parts.length - 1];
        const category = parts.length > 1 ? parts.slice(0, -1).join("/") : "Uncategorized";
        
        // Story name often indicates state (e.g., "Primary", "Disabled", "Hover")
        const storyName = entry.name || "Default";
        
        if (componentName) {
          const existing = componentMap.get(componentName);
          if (existing) {
            // Add this story/state to existing component
            if (!existing.states.includes(storyName)) {
              existing.states.push(storyName);
            }
            existing.stories.push(entry.id);
          } else {
            componentMap.set(componentName, {
              name: componentName,
              category,
              description: entry.parameters?.docs?.description?.component || undefined,
              states: [storyName],
              stories: [entry.id],
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
      // Build variants from states (e.g., "Primary", "Secondary", "Disabled" -> variant objects)
      const states = comp.states || ["Default"];
      const variants = states.map(state => ({
        name: state,
        propsOverride: {},
        description: `${state} state of ${comp.name}`,
      }));
      
      // NOTE: Only include columns that exist in design_system_components table:
      // id, design_system_id, name, layer, category, code, variants, props, docs,
      // source_generation_id, is_approved, usage_count, created_at, updated_at
      // DO NOT include 'states' - that column does not exist!
      return {
        design_system_id: newDS.id,
        name: comp.name,
        layer: categorizeLayer(comp.category, comp.name),
        category: comp.category,
        code: generatePlaceholderCode(comp.name, states, categorizeLayer(comp.category, comp.name)),
        variants: variants,
        props: [],
        docs: {
          description: comp.description || `${comp.name} component from ${dsName}`,
          usage: `Import and use the ${comp.name} component`,
          states: states.join(", "), // Document available states
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

function generatePlaceholderCode(name: string, states: string[] = ["Default"], layer: string = "components"): string {
  const pascalName = name.replace(/[^a-zA-Z0-9]/g, "") || "Component";
  const nameLower = name.toLowerCase();
  const statesStr = states.filter(s => s !== "Default" && s !== "Docs").join(", ");
  
  // Generate a proper React function component with return statement
  // This ensures proper JSX transpilation in the preview iframe
  // The code must be a complete component with proper hooks/return
  
  const getJSX = (): string => {
    // ELEMENTS
    if (layer === "elements") {
      if (nameLower.includes("button")) {
        return `<div className="flex flex-wrap gap-2">
      <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">${name}</button>
      ${statesStr ? `<button className="px-4 py-2 bg-zinc-700 text-zinc-300 font-medium rounded-lg" disabled>Disabled</button>` : ""}
    </div>`;
      }
      if (nameLower.includes("input") || nameLower.includes("text field") || nameLower.includes("textfield")) {
        return `<div className="space-y-2 w-64">
      <label className="text-xs font-medium text-zinc-400">${name}</label>
      <input type="text" placeholder="Enter value..." className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none" />
    </div>`;
      }
      if (nameLower.includes("checkbox")) {
        return `<label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600" />
      <span className="text-sm text-zinc-300">${name}</span>
    </label>`;
      }
      if (nameLower.includes("radio")) {
        return `<label className="flex items-center gap-2 cursor-pointer">
      <input type="radio" name="radio-preview" className="w-4 h-4 border-zinc-600 bg-zinc-800 text-blue-600" />
      <span className="text-sm text-zinc-300">${name}</span>
    </label>`;
      }
      if (nameLower.includes("switch") || nameLower.includes("toggle")) {
        return `<button className="relative w-11 h-6 bg-zinc-700 rounded-full transition-colors">
      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
    </button>`;
      }
      if (nameLower.includes("badge") || nameLower.includes("tag") || nameLower.includes("status")) {
        return `<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">${name}</span>`;
      }
      if (nameLower.includes("link")) {
        return `<a href="#" className="text-blue-400 hover:text-blue-300 underline text-sm">${name}</a>`;
      }
      if (nameLower.includes("select")) {
        return `<div className="space-y-2 w-64">
      <label className="text-xs font-medium text-zinc-400">${name}</label>
      <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white">
        <option>Option 1</option>
        <option>Option 2</option>
        <option>Option 3</option>
      </select>
    </div>`;
      }
      if (nameLower.includes("tooltip")) {
        return `<div className="relative inline-block">
      <span className="text-sm text-zinc-300 border-b border-dashed border-zinc-500 cursor-help">${name}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-700 text-white text-xs rounded-lg whitespace-nowrap">Tooltip content</div>
    </div>`;
      }
      // Default element
      return `<div className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-sm">${name}</div>`;
    }
    
    // PRIMITIVES
    if (layer === "primitives" || layer === "foundations") {
      if (nameLower.includes("icon")) {
        return `<svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`;
      }
      if (nameLower.includes("typograph") || nameLower.includes("text") || nameLower.includes("heading")) {
        return `<div className="space-y-2">
      <h1 className="text-2xl font-bold text-white">Heading 1</h1>
      <h2 className="text-xl font-semibold text-white">Heading 2</h2>
      <p className="text-sm text-zinc-400">Body text - ${name}</p>
    </div>`;
      }
      if (nameLower.includes("color")) {
        return `<div className="flex gap-2">
      <div className="w-8 h-8 rounded-full bg-blue-600" title="Primary"></div>
      <div className="w-8 h-8 rounded-full bg-zinc-600" title="Neutral"></div>
      <div className="w-8 h-8 rounded-full bg-green-600" title="Success"></div>
      <div className="w-8 h-8 rounded-full bg-red-600" title="Error"></div>
    </div>`;
      }
      if (nameLower.includes("skeleton")) {
        return `<div className="space-y-3 w-64 animate-pulse">
      <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
      <div className="h-4 bg-zinc-700 rounded w-full"></div>
      <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
    </div>`;
      }
      return `<span className="text-zinc-300 text-sm">${name}</span>`;
    }
    
    // PATTERNS
    if (layer === "patterns") {
      if (nameLower.includes("card") || nameLower.includes("box") || nameLower.includes("summary")) {
        return `<div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl w-72">
      <h3 className="text-base font-semibold text-white mb-2">${name}</h3>
      <p className="text-zinc-400 text-sm">Card content placeholder</p>
    </div>`;
      }
      if (nameLower.includes("modal") || nameLower.includes("dialog") || nameLower.includes("result")) {
        return `<div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl w-72">
      <h3 className="text-base font-semibold text-white mb-3">${name}</h3>
      <p className="text-zinc-400 text-sm mb-4">Dialog content here</p>
      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs">Cancel</button>
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">OK</button>
      </div>
    </div>`;
      }
      if (nameLower.includes("table")) {
        return `<div className="border border-zinc-800 rounded-lg overflow-hidden w-80">
      <table className="w-full">
        <thead className="bg-zinc-800"><tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Name</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Status</th>
        </tr></thead>
        <tbody className="bg-zinc-900">
          <tr className="border-t border-zinc-800">
            <td className="px-3 py-2 text-sm text-white">Item 1</td>
            <td className="px-3 py-2 text-sm text-green-400">Active</td>
          </tr>
        </tbody>
      </table>
    </div>`;
      }
      if (nameLower.includes("carousel") || nameLower.includes("slider")) {
        return `<div className="flex gap-3 overflow-hidden w-80">
      <div className="flex-shrink-0 w-48 h-32 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 text-xs">Slide 1</div>
      <div className="flex-shrink-0 w-48 h-32 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 text-xs">Slide 2</div>
    </div>`;
      }
      if (nameLower.includes("nav") || nameLower.includes("breadcrumb") || nameLower.includes("menu")) {
        return `<nav className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
      <a href="#" className="text-white text-sm font-medium">Home</a>
      <span className="text-zinc-600">/</span>
      <a href="#" className="text-zinc-400 text-sm hover:text-white">Section</a>
      <span className="text-zinc-600">/</span>
      <span className="text-zinc-500 text-sm">Current</span>
    </nav>`;
      }
      if (nameLower.includes("search")) {
        return `<div className="relative w-64">
      <input type="text" placeholder="Search..." className="w-full pl-8 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500" />
      <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    </div>`;
      }
      if (nameLower.includes("toast") || nameLower.includes("notification")) {
        return `<div className="flex items-center gap-3 px-4 py-3 bg-green-900/30 border border-green-700/50 rounded-lg w-72">
      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
      <span className="text-sm text-green-300">Success notification</span>
    </div>`;
      }
      // Default pattern
      return `<div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="text-white font-medium text-sm mb-1">${name}</div>
      <div className="text-zinc-500 text-xs">Pattern component</div>
    </div>`;
    }
    
    // PRODUCT
    if (layer === "product") {
      if (nameLower.includes("hero")) {
        return `<section className="py-10 px-6 bg-gradient-to-br from-zinc-900 to-zinc-800 text-center rounded-xl">
      <h1 className="text-3xl font-bold text-white mb-3">${name}</h1>
      <p className="text-zinc-400 mb-5 max-w-sm mx-auto text-sm">Hero section with headline and CTA</p>
      <button className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg">Get Started</button>
    </section>`;
      }
      if (nameLower.includes("feature")) {
        return `<div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h3 className="text-base font-semibold text-white mb-1">${name}</h3>
      <p className="text-zinc-400 text-sm">Feature description</p>
    </div>`;
      }
      if (nameLower.includes("banner")) {
        return `<div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-between">
      <span className="text-white font-medium text-sm">${name}</span>
      <button className="px-3 py-1 bg-white/20 text-white text-xs rounded">Learn More</button>
    </div>`;
      }
      if (nameLower.includes("product")) {
        return `<div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl w-56">
      <div className="w-full h-32 bg-zinc-800 rounded-lg mb-3 flex items-center justify-center text-zinc-600 text-xs">Image</div>
      <h4 className="text-sm font-medium text-white mb-1">${name}</h4>
      <p className="text-xs text-zinc-500">Product description</p>
    </div>`;
      }
      // Default product
      return `<section className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
      <h2 className="text-lg font-bold text-white mb-2">${name}</h2>
      <p className="text-zinc-400 text-sm">Section content placeholder</p>
    </section>`;
    }
    
    // Default COMPONENTS
    return `<div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center">
        <span className="text-xs text-zinc-400">${name.charAt(0)}</span>
      </div>
      <div>
        <div className="text-white font-medium text-sm">${name}</div>
        <div className="text-zinc-500 text-xs">${statesStr || "Component"}</div>
      </div>
    </div>
  </div>`;
  };

  // Wrap in a proper function component to ensure correct preview rendering
  const jsx = getJSX();
  return `function ${pascalName}() {
  return (
    ${jsx}
  );
}`;
}
