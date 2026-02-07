import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM LIBRARY EXTRACTION - Enterprise Architecture
// Industry Standard: Carbon, Spectrum, Atlassian, Polaris level
// ═══════════════════════════════════════════════════════════════════════════════

const LIBRARY_EXTRACTION_PROMPT = `You are a DESIGN SYSTEM ARCHITECT extracting a professional component library.

═══════════════════════════════════════════════════════════════════════════════
🏗️ ENTERPRISE DESIGN SYSTEM ARCHITECTURE (MANDATORY!)
═══════════════════════════════════════════════════════════════════════════════

Extract into these layers. Every component in "components" MUST have a "subcategory" field.

**FOUNDATIONS** → JSON key: "foundations"
Design tokens — the mathematical DNA of the system.
- Colors (primary, secondary, surface, text, semantic: success/warning/error)
- Typography (fontFamily, fontSize scale, fontWeight, lineHeight)
- Spacing scale, Border Radius scale, Shadows/Elevation, Iconography, Motion

**COMPONENTS** → JSON key: "components", layer: "components"
ALL UI building blocks — both atoms and molecules. Each MUST have a "subcategory":

  subcategory: "actions"       → Button, IconButton, Link, ToggleButton
  subcategory: "forms"         → Input, Select, Checkbox, Radio, Switch, Toggle, Textarea, DatePicker
  subcategory: "navigation"    → Tabs, Sidebar, Breadcrumbs, Pagination, NavLink, Menu
  subcategory: "data-display"  → Table, Badge, Avatar, Tag, Tooltip, List, Heading, Text, Stat, Icon
  subcategory: "feedback"      → Toast, Alert, Spinner, Skeleton, Progress, Banner
  subcategory: "overlays"      → Modal, Dropdown, Popover, Dialog, Drawer, BottomSheet

Classification guide:
- Button, Link → actions. Input, Select, Checkbox → forms. Tabs, Sidebar → navigation.
- Card, Badge, Avatar, Table, Heading, Text → data-display. Toast, Alert, Spinner → feedback.
- Modal, Dropdown, Drawer → overlays.
- If unsure → data-display.

**PATTERNS** → JSON key: "patterns", layer: "patterns"
Reusable recipes that combine components for specific workflows:
Cards, Filtering, Empty States, Dashboard Widgets, Table Workflows, Pricing Tables, Feature Grids, Login Forms

**TEMPLATES** → JSON key: "templates", layer: "templates"
Full page layouts and structural shells:
App Shell (sidebar+header+content), Dashboard Layout, Landing Page, Settings Page, Auth Page

**PRODUCT MODULES** → JSON key: "product", layer: "product"
Brand-specific sections unique to THIS product:
Named exactly as they appear (e.g., YCHeroSection, SolenisProductCard)

═══════════════════════════════════════════════════════════════════════════════
🚨 OUTPUT FORMAT - PURE HTML CODE FIELD
═══════════════════════════════════════════════════════════════════════════════

The "code" field MUST be COMPLETE, PURE HTML that renders in an iframe.

✅ CORRECT:
"code": "<button class=\\"px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors\\">APPLY TO YC</button>"

❌ WRONG - JSX syntax:
"code": "<Button className={cn('px-4')}>{children}</Button>"

RULES:
1. Use class="..." with DOUBLE QUOTES (not className)
2. NO curly braces {} - replace with actual values
3. NO React components - convert to HTML elements
4. MINIMUM 50 characters for simple components, 150 for patterns/templates/product
5. Include ALL Tailwind classes from original
6. Icons: use inline SVG from Lucide. Images: use picsum/pravatar URLs.

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT JSON STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

{
  "overview": {
    "name": "Design System Name",
    "description": "Short description of UI/brand aesthetic",
    "style": "minimalist | modern | luxury | playful | corporate | tech",
    "theme": "dark | light | mixed",
    "primaryBrand": "#hex",
    "accessibilityScore": 85,
    "componentCount": 0,
    "principles": [
      { "title": "Accessibility", "items": ["WCAG compliance", "Keyboard nav", "Screen readers"] },
      { "title": "Consistency", "items": ["Unified language", "Standard interactions", "Cohesive typography"] },
      { "title": "Developer Experience", "items": ["TypeScript ready", "Clear docs", "Modern tooling"] }
    ]
  },

  "foundations": {
    "colors": { "primary": "#hex", "secondary": "#hex", "background": "#hex", "surface": "#hex", "text": "#hex", "textMuted": "#hex", "border": "#hex", "success": "#hex", "warning": "#hex", "error": "#hex" },
    "typography": {
      "fontFamily": { "sans": "Inter, system-ui", "mono": "ui-monospace" },
      "fontSize": { "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem", "xl": "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem" },
      "fontWeight": { "normal": 400, "medium": 500, "semibold": 600, "bold": 700 },
      "lineHeight": { "tight": 1.25, "normal": 1.5, "relaxed": 1.75 }
    },
    "spacing": { "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem", "6": "1.5rem", "8": "2rem", "12": "3rem", "16": "4rem" },
    "borderRadius": { "none": "0", "sm": "0.25rem", "md": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px" },
    "shadows": { "sm": "0 1px 2px rgba(0,0,0,0.05)", "md": "0 4px 6px rgba(0,0,0,0.1)", "lg": "0 10px 15px rgba(0,0,0,0.1)" },
    "iconography": { "library": "lucide", "style": "outline", "defaultSize": "w-5 h-5" }
  },

  "components": [
    {
      "id": "button-primary",
      "name": "Button",
      "layer": "components",
      "subcategory": "actions",
      "description": "Primary action button",
      "code": "<button class=\\"px-6 py-3 bg-primary text-white font-medium rounded-lg\\">Button</button>",
      "props": [
        { "name": "label", "type": "string", "default": "Button" },
        { "name": "variant", "type": "select", "options": ["primary", "secondary", "ghost"], "default": "primary" },
        { "name": "size", "type": "select", "options": ["sm", "md", "lg"], "default": "md" }
      ],
      "variants": [
        { "name": "Primary", "props": { "variant": "primary" } },
        { "name": "Secondary", "props": { "variant": "secondary" } }
      ]
    },
    {
      "id": "input-text",
      "name": "Text Input",
      "layer": "components",
      "subcategory": "forms",
      "description": "Text input field with label",
      "code": "<div><label class=\\"block text-sm font-medium mb-1\\">Label</label><input type=\\"text\\" class=\\"w-full px-3 py-2 border rounded-lg\\" placeholder=\\"Enter text...\\" /></div>",
      "props": [{ "name": "label", "type": "string", "default": "Label" }],
      "variants": []
    }
  ],

  "patterns": [
    {
      "id": "feature-card",
      "name": "FeatureCard",
      "layer": "patterns",
      "description": "Card showing a feature with icon and description",
      "code": "<div class=\\"...\\">...</div>",
      "composition": ["Card", "Icon", "Text"],
      "businessContext": "Feature highlight sections"
    }
  ],

  "templates": [
    {
      "id": "app-shell",
      "name": "App Shell",
      "layer": "templates",
      "description": "Main application layout with sidebar and header",
      "code": "<div class=\\"flex h-screen\\"><aside class=\\"w-64 bg-zinc-900 p-4\\">Sidebar</aside><main class=\\"flex-1 p-8\\">Content</main></div>",
      "composition": ["Sidebar", "Header", "Content"]
    }
  ],

  "product": [
    {
      "id": "hero-section",
      "name": "HeroSection",
      "layer": "product",
      "description": "Brand-specific hero with CTA",
      "code": "<section class=\\"...\\">...</section>",
      "businessContext": "Main landing hero"
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
🎯 CLASSIFICATION & EXTRACTION RULES
═══════════════════════════════════════════════════════════════════════════════

**Classification flow:**
1. Design token? → FOUNDATIONS
2. Single element OR generic composite (no business context)?
   → COMPONENTS + assign subcategory (actions/forms/navigation/data-display/feedback/overlays)
3. Business-context recipe reusable across products? → PATTERNS
4. Full page structure/layout? → TEMPLATES
5. Unique to THIS brand/product? → PRODUCT MODULES

**⚠️ COMMON MISTAKES TO AVOID:**
- "Hero Heading" is NOT a form input → it's data-display (Heading)
- "Testimonial Card" is a PATTERN, not a component
- "App Shell" / "Dashboard Layout" are TEMPLATES, not patterns
- ALL buttons/links → subcategory: "actions", ALL inputs → subcategory: "forms"

**EXTRACTION DEPTH:**
- Extract ALL UNIQUE components — typically 8-20 total across all subcategories
- Components should cover: actions (3-5), forms (3-5), navigation (2-4), data-display (3-6), feedback (2-3), overlays (1-3)
- Patterns: 3-8 distinct recipes
- Templates: 1-3 page layouts
- Product: 2-5 brand-specific sections
- Every component MUST have realistic, renderable HTML code
- Each component must be UNIQUE — no duplicates with minor text changes

Return ONLY valid JSON. No explanation.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, styleInfo } = body;

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 32768,
      },
    });

    console.log(`[Library] Analyzing ${code.length} chars of code...`);

    const trimmedCode = code.substring(0, 50000);

    const prompt = `${LIBRARY_EXTRACTION_PROMPT}

═══════════════════════════════════════════════════════════════════════════════
📄 SOURCE CODE TO ANALYZE:
═══════════════════════════════════════════════════════════════════════════════

${trimmedCode}

═══════════════════════════════════════════════════════════════════════════════
🔍 EXTRACTION STEPS:
═══════════════════════════════════════════════════════════════════════════════

1. **FOUNDATIONS**: Extract ALL colors (background, text, border, accent), typography (fonts, sizes), spacing values used
2. **PRIMITIVES**: Find basic elements - buttons, inputs, text styles, icons, images, dividers
3. **COMPONENTS**: Find composite elements - cards, avatars, badges, navbars, search bars, modals
4. **PATTERNS**: Find use-case specific combinations - product cards, article previews, pricing tables
5. **PRODUCT**: Find brand-specific named sections - LuxuryHero, JobListing, etc.

For EACH component:
- Copy the COMPLETE HTML structure
- Convert className to class
- Replace all variables with actual values
- Keep ALL Tailwind classes
- Convert icons to inline SVG

Return the complete JSON with foundations, components (with subcategories), patterns, templates, and product.`;

    console.log("[Library] Starting extraction...");
    const startTime = Date.now();
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log(`[Library] Extraction took ${Date.now() - startTime}ms`);

    // Parse JSON
    let libraryData: any;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        libraryData = JSON.parse(jsonMatch[0]);
        console.log(`[Library] Parsed: components=${libraryData.components?.length || 0}, patterns=${libraryData.patterns?.length || 0}, templates=${libraryData.templates?.length || 0}, product=${libraryData.product?.length || 0}`);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("[Library] Parse error:", e);
      libraryData = createDefaultStructure();
    }

    // Ensure all layers exist
    libraryData = ensureStructure(libraryData);
    
    // Convert HTML to JSX-compatible syntax
    libraryData = convertAllCodeToJsx(libraryData);
    
    // Build legacy components array for backward compatibility
    libraryData.components = buildLegacyComponents(libraryData);
    
    // Build tokens for backward compatibility
    const defaultSpacing = { 
      "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem", 
      "5": "1.25rem", "6": "1.5rem", "8": "2rem", "10": "2.5rem", 
      "12": "3rem", "16": "4rem" 
    };
    libraryData.tokens = {
      colors: libraryData.foundations?.colors || {},
      typography: libraryData.foundations?.typography || {},
      spacing: Object.keys(libraryData.foundations?.spacing || {}).length > 0 
        ? libraryData.foundations.spacing 
        : defaultSpacing,
      borderRadius: libraryData.foundations?.borderRadius || {},
    };
    
    // Update component count in overview
    const totalComponents = (libraryData.primitives?.length || 0) + 
      (libraryData.components?.length || 0) + 
      (libraryData.patterns?.length || 0) + 
      (libraryData.product?.length || 0);
    if (libraryData.overview) {
      libraryData.overview.componentCount = totalComponents;
    }

    console.log(`[Library] Final: ${totalComponents} total components across all layers`);

    return NextResponse.json({
      success: true,
      data: libraryData,
      componentCount: totalComponents,
      extractionTime: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("[Library] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract library" },
      { status: 500 }
    );
  }
}

function createDefaultStructure() {
  return {
    overview: {
      name: "Design System",
      description: "Component library extracted from UI",
      style: "modern",
      theme: "dark",
      primaryBrand: "#3b82f6",
      accessibilityScore: 90,
      componentCount: 0,
      colorStats: { readabilityScore: 90, lc75Plus: 25, lc90Plus: 15, minReadable: 35 },
      principles: [
        { title: "Accessibility", items: ["WCAG compliance", "Keyboard nav", "Screen readers", "High contrast"] },
        { title: "Consistency", items: ["Unified language", "Standard interactions", "Cohesive typography", "Consistent spacing"] },
        { title: "Developer Experience", items: ["TypeScript ready", "Clear docs", "Live examples", "Modern tooling"] }
      ]
    },
    foundations: {
      colors: {},
      typography: { fontFamily: {}, fontSize: {}, fontWeight: {} },
      spacing: { 
        "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem", 
        "5": "1.25rem", "6": "1.5rem", "8": "2rem", "10": "2.5rem", 
        "12": "3rem", "16": "4rem", "20": "5rem", "24": "6rem" 
      },
      borderRadius: {},
      shadows: {},
      iconography: {
        library: "lucide",
        style: "outline",
        defaultSize: "w-5 h-5",
        icons: []
      }
    },
    components: [],
    patterns: [],
    templates: [],
    product: []
  };
}

function ensureStructure(data: any) {
  // Ensure overview with defaults
  if (!data.overview) {
    data.overview = {
      name: "Design System",
      description: "Component library extracted from UI",
      style: "modern",
      theme: "dark",
      primaryBrand: "#3b82f6",
      accessibilityScore: 90,
      componentCount: 0,
      colorStats: { readabilityScore: 90, lc75Plus: 25, lc90Plus: 15, minReadable: 35 },
      principles: [
        { title: "Accessibility", items: ["WCAG compliance", "Keyboard nav", "Screen readers", "High contrast"] },
        { title: "Consistency", items: ["Unified language", "Standard interactions", "Cohesive typography", "Consistent spacing"] },
        { title: "Developer Experience", items: ["TypeScript ready", "Clear docs", "Live examples", "Modern tooling"] }
      ]
    };
  }
  // Ensure colorStats
  if (!data.overview.colorStats) {
    data.overview.colorStats = { readabilityScore: 90, lc75Plus: 25, lc90Plus: 15, minReadable: 35 };
  }
  // Ensure principles
  if (!data.overview.principles || data.overview.principles.length === 0) {
    data.overview.principles = [
      { title: "Accessibility", items: ["WCAG compliance", "Keyboard nav", "Screen readers", "High contrast"] },
      { title: "Consistency", items: ["Unified language", "Standard interactions", "Cohesive typography", "Consistent spacing"] },
      { title: "Developer Experience", items: ["TypeScript ready", "Clear docs", "Live examples", "Modern tooling"] }
    ];
  }
  
  if (!data.foundations) {
    data.foundations = {
      colors: {},
      typography: { fontFamily: {}, fontSize: {}, fontWeight: {}, lineHeight: {} },
      spacing: { 
        "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem", 
        "5": "1.25rem", "6": "1.5rem", "8": "2rem", "10": "2.5rem", 
        "12": "3rem", "16": "4rem" 
      },
      borderRadius: {},
      shadows: {},
      iconography: { library: "lucide", style: "outline", defaultSize: "w-5 h-5", icons: [] }
    };
  }
  // Backward compat: merge old "primitives" into "components" with subcategory
  if (data.primitives && Array.isArray(data.primitives) && data.primitives.length > 0) {
    if (!data.components) data.components = [];
    for (const prim of data.primitives) {
      prim.layer = 'components';
      if (!prim.subcategory) {
        const n = (prim.name || '').toLowerCase();
        prim.subcategory = n.includes('button') || n.includes('link') ? 'actions' :
          n.includes('input') || n.includes('select') || n.includes('check') || n.includes('radio') || n.includes('switch') || n.includes('toggle') ? 'forms' :
          n.includes('tab') || n.includes('nav') || n.includes('breadcrumb') || n.includes('sidebar') || n.includes('menu') ? 'navigation' :
          'data-display';
      }
      data.components.push(prim);
    }
    delete data.primitives;
  }
  if (!data.components) data.components = [];
  if (!data.patterns) data.patterns = [];
  if (!data.templates) data.templates = [];
  if (!data.product) data.product = [];
  
  // Ensure foundations sub-objects
  if (!data.foundations.colors) data.foundations.colors = {};
  if (!data.foundations.typography) data.foundations.typography = {};
  // Add default spacing if empty
  if (!data.foundations.spacing || Object.keys(data.foundations.spacing).length === 0) {
    data.foundations.spacing = { 
      "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem", 
      "5": "1.25rem", "6": "1.5rem", "8": "2rem", "10": "2.5rem", 
      "12": "3rem", "16": "4rem" 
    };
  }
  if (!data.foundations.borderRadius) data.foundations.borderRadius = {};
  if (!data.foundations.shadows) data.foundations.shadows = {};
  // Ensure iconography
  if (!data.foundations.iconography) {
    data.foundations.iconography = { library: "lucide", style: "outline", defaultSize: "w-5 h-5", icons: [] };
  }
  
  return data;
}

function convertHtmlToJsx(html: string): string {
  if (!html) return html;
  
  return html
    .replace(/\bclass=/g, 'className=')
    .replace(/\bfor=/g, 'htmlFor=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/fill-opacity=/g, 'fillOpacity=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-path=/g, 'clipPath=')
    .replace(/tabindex=/g, 'tabIndex=')
    .replace(/colspan=/g, 'colSpan=')
    .replace(/rowspan=/g, 'rowSpan=');
}

function convertAllCodeToJsx(data: any) {
  const convertLayer = (items: any[]) => {
    if (!items) return [];
    return items.map((item: any) => ({
      ...item,
      code: convertHtmlToJsx(item.code || '')
    }));
  };
  
  data.components = convertLayer(data.components);
  data.patterns = convertLayer(data.patterns);
  data.templates = convertLayer(data.templates);
  data.product = convertLayer(data.product);
  
  return data;
}

function buildLegacyComponents(data: any) {
  // Combine all layers into a single components array for backward compatibility
  const allComponents: any[] = [];

  // Add components (with subcategory preserved)
  (data.components || []).forEach((item: any) => {
    allComponents.push({
      ...item,
      category: item.subcategory || 'components',
      layer: 'components'
    });
  });

  // Add patterns
  (data.patterns || []).forEach((item: any) => {
    allComponents.push({
      ...item,
      category: 'patterns',
      layer: 'patterns'
    });
  });

  // Add templates
  (data.templates || []).forEach((item: any) => {
    allComponents.push({
      ...item,
      category: 'templates',
      layer: 'templates'
    });
  });

  // Add product modules
  (data.product || []).forEach((item: any) => {
    allComponents.push({
      ...item,
      category: 'product',
      layer: 'product'
    });
  });

  return allComponents;
}
