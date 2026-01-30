import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM LIBRARY EXTRACTION - 5-Layer Architecture
// Industry Standard: Google, IBM, Shopify, Salesforce level
// ═══════════════════════════════════════════════════════════════════════════════

const LIBRARY_EXTRACTION_PROMPT = `You are a DESIGN SYSTEM ARCHITECT extracting a professional component library.

═══════════════════════════════════════════════════════════════════════════════
🏗️ 5-LAYER DESIGN SYSTEM ARCHITECTURE (MANDATORY!)
═══════════════════════════════════════════════════════════════════════════════

Extract components into these EXACT 5 layers:

**L1 - FOUNDATIONS (Design DNA)** → layer: "foundations"
Pure design tokens - the mathematical language of design.
- Colors (extracted HEX values with semantic names)
- Typography (font families, sizes, weights, line heights)
- Spacing (padding/margin scale)
- Border Radius (corner rounding scale)
- Shadows (elevation system)
- Motion (animation timings)

**L2 - PRIMITIVES (Atoms)** → layer: "primitives"  
Zero business context. Single-purpose, indivisible elements.
Examples: Box, Text, Icon, Image, Button (generic), Input, Select, Checkbox, Link, Stack, Divider
✅ "Button" ❌ "DownloadAppButton"
✅ "Text" ❌ "HeadlineText"

**L3 - COMPONENTS (Composite/Molecules)** → layer: "components"
Combinations of primitives with UX purpose. Still no business context.
Examples: Card, ListItem, Avatar, Badge, Navbar, Footer, SearchBar, FilterBar, Alert, Modal, Tooltip
✅ "Card" ❌ "ProductCard"
✅ "ListItem" ❌ "JobListItem"

**L4 - PATTERNS (Recipes/Use-case)** → layer: "patterns"
Components with applied business context. Reusable across similar contexts.
Examples: CategoryCard, ProductRow, ArticlePreview, TestimonialBlock, PricingTable, FeatureGrid, LoginForm, DashboardWidget
These combine Components + specific styling + data structure.

**L5 - PRODUCT (Business Semantics)** → layer: "product"
Highly specific to this exact product/brand.
Examples: LuxuryHeroSection, JobListingRow, ArticleListItem, VideoPreviewCard
Named exactly as they appear for this specific product.

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
3. NO React components - convert to HTML
4. MINIMUM 50 characters for primitives, 150 for patterns/product
5. Include ALL Tailwind classes from original

ICON CONVERSION:
- <Icon /> → <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">...</svg>
- Use inline SVG paths from Lucide icons

IMAGE URLs:
- Use picsum: https://picsum.photos/seed/[context]/[width]/[height]
- Avatars: https://i.pravatar.cc/150?u=[name]

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT JSON STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

{
  "overview": {
    "name": "Design System Name (extracted from brand/title)",
    "description": "Short description of this UI/brand aesthetic",
    "style": "minimalist | modern | luxury | playful | corporate | tech",
    "theme": "dark | light | mixed",
    "primaryBrand": "#hex (main brand color)",
    "accessibilityScore": "85-100 (estimate based on contrast)",
    "componentCount": 0
  },
  
  "foundations": {
    "colors": {
      "primary": "#hex",
      "secondary": "#hex", 
      "background": "#hex",
      "surface": "#hex",
      "text": "#hex",
      "textMuted": "#hex",
      "border": "#hex",
      "success": "#hex",
      "warning": "#hex",
      "error": "#hex"
    },
    "typography": {
      "fontFamily": { "sans": "Inter, system-ui", "mono": "ui-monospace" },
      "fontSize": { "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem", "xl": "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem" },
      "fontWeight": { "normal": 400, "medium": 500, "semibold": 600, "bold": 700 },
      "lineHeight": { "tight": 1.25, "normal": 1.5, "relaxed": 1.75 }
    },
    "spacing": { "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem", "5": "1.25rem", "6": "1.5rem", "8": "2rem", "10": "2.5rem", "12": "3rem", "16": "4rem" },
    "borderRadius": { "none": "0", "sm": "0.25rem", "md": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px" },
    "shadows": { "sm": "0 1px 2px rgba(0,0,0,0.05)", "md": "0 4px 6px rgba(0,0,0,0.1)", "lg": "0 10px 15px rgba(0,0,0,0.1)", "xl": "0 20px 25px rgba(0,0,0,0.15)" },
    "iconography": {
      "library": "lucide | heroicons | custom",
      "style": "outline | filled | duotone",
      "defaultSize": "w-5 h-5",
      "icons": ["Menu", "Check", "X", "ChevronDown", "Search", "User"]
    }
  },
  
  "primitives": [
    {
      "id": "button-primary",
      "name": "Button",
      "layer": "primitives",
      "description": "Primary action button with solid background",
      "code": "<button class=\\"px-6 py-3 bg-primary text-white font-medium rounded-lg\\">Button</button>",
      "props": [
        { "name": "label", "type": "string", "default": "Button", "description": "Button text" },
        { "name": "variant", "type": "select", "options": ["primary", "secondary", "ghost"], "default": "primary" },
        { "name": "size", "type": "select", "options": ["sm", "md", "lg"], "default": "md" },
        { "name": "disabled", "type": "boolean", "default": false }
      ],
      "variants": [
        { "name": "Primary", "props": { "variant": "primary" } },
        { "name": "Secondary", "props": { "variant": "secondary" } },
        { "name": "Ghost", "props": { "variant": "ghost" } }
      ]
    }
  ],
  
  "components": [
    {
      "id": "card",
      "name": "Card",
      "layer": "components",
      "description": "Content container with border and shadow",
      "code": "<div class=\\"rounded-xl border border-white/10 bg-white/5 p-6\\">Card content</div>",
      "composition": ["Box", "Text"],
      "props": [...]
    }
  ],
  
  "patterns": [
    {
      "id": "category-card",
      "name": "CategoryCard",
      "layer": "patterns",
      "description": "Card displaying a category with icon and label",
      "code": "<div class=\\"...\\">...</div>",
      "composition": ["Card", "Icon", "Text"],
      "businessContext": "Used for navigation to category sections",
      "props": [...]
    }
  ],
  
  "product": [
    {
      "id": "luxury-hero-section",
      "name": "LuxuryHeroSection",
      "layer": "product",
      "description": "Full-width hero section with background image and CTA",
      "code": "<section class=\\"...\\">...</section>",
      "composition": ["Card", "Button", "Text", "Image"],
      "businessContext": "Main landing hero for luxury brand aesthetic",
      "props": [...]
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
🎯 CLASSIFICATION RULES
═══════════════════════════════════════════════════════════════════════════════

**To determine layer, ask:**

Is it a design token (color, spacing, font)? → FOUNDATIONS

Is it a single HTML element with no business meaning?
- Button, Input, Text, Icon, Image → PRIMITIVES

Is it multiple primitives combined, but still generic?
- Card, Avatar, Badge, SearchBar → COMPONENTS

Does it have a specific use-case but could apply to other products?
- ProductCard, ArticlePreview, PricingTable → PATTERNS

Is it named specifically for THIS product/brand?
- LuxuryHeroSection, JobListingRow → PRODUCT

**CRITICAL:**
- Extract AT LEAST 3 items per layer (except foundations)
- Every component MUST have realistic code that renders
- Props must have sensible defaults
- Include 2-3 variants per component

Return ONLY valid JSON. No explanation.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, styleInfo } = body;

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
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

Return the complete JSON structure with all 5 layers populated.`;

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
        console.log(`[Library] Parsed: primitives=${libraryData.primitives?.length || 0}, components=${libraryData.components?.length || 0}, patterns=${libraryData.patterns?.length || 0}, product=${libraryData.product?.length || 0}`);
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
      componentCount: 0
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
    primitives: [],
    components: [],
    patterns: [],
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
      componentCount: 0
    };
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
  if (!data.primitives) data.primitives = [];
  if (!data.components) data.components = [];
  if (!data.patterns) data.patterns = [];
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
  
  data.primitives = convertLayer(data.primitives);
  data.components = convertLayer(data.components);
  data.patterns = convertLayer(data.patterns);
  data.product = convertLayer(data.product);
  
  return data;
}

function buildLegacyComponents(data: any) {
  // Combine all layers into a single components array for backward compatibility
  const allComponents: any[] = [];
  
  // Add primitives with category
  (data.primitives || []).forEach((item: any) => {
    allComponents.push({
      ...item,
      category: 'primitives',
      layer: 'primitives'
    });
  });
  
  // Add components (composite)
  (data.components || []).forEach((item: any) => {
    allComponents.push({
      ...item,
      category: item.category || 'components',
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
  
  // Add product components
  (data.product || []).forEach((item: any) => {
    allComponents.push({
      ...item,
      category: 'product',
      layer: 'product'
    });
  });
  
  return allComponents;
}
