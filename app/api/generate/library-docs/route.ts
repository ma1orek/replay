import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper: Extract colors from Tailwind classes in code
function extractColorsFromCode(code: string): { name: string; value: string; tailwind: string }[] {
  const colors: Map<string, { value: string; tailwind: string }> = new Map();
  
  // Tailwind color map (common colors)
  const tailwindColors: Record<string, string> = {
    'zinc-50': '#fafafa', 'zinc-100': '#f4f4f5', 'zinc-200': '#e4e4e7', 'zinc-300': '#d4d4d8',
    'zinc-400': '#a1a1aa', 'zinc-500': '#71717a', 'zinc-600': '#52525b', 'zinc-700': '#3f3f46',
    'zinc-800': '#27272a', 'zinc-900': '#18181b', 'zinc-950': '#09090b',
    'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1',
    'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155',
    'slate-800': '#1e293b', 'slate-900': '#0f172a', 'slate-950': '#020617',
    'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd',
    'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'blue-700': '#1d4ed8',
    'blue-800': '#1e40af', 'blue-900': '#1e3a8a', 'blue-950': '#172554',
    'violet-50': '#f5f3ff', 'violet-100': '#ede9fe', 'violet-200': '#ddd6fe', 'violet-300': '#c4b5fd',
    'violet-400': '#a78bfa', 'violet-500': '#8b5cf6', 'violet-600': '#7c3aed', 'violet-700': '#6d28d9',
    'violet-800': '#5b21b6', 'violet-900': '#4c1d95', 'violet-950': '#2e1065',
    'green-50': '#f0fdf4', 'green-100': '#dcfce7', 'green-200': '#bbf7d0', 'green-300': '#86efac',
    'green-400': '#4ade80', 'green-500': '#22c55e', 'green-600': '#16a34a', 'green-700': '#15803d',
    'green-800': '#166534', 'green-900': '#14532d', 'green-950': '#052e16',
    'red-50': '#fef2f2', 'red-100': '#fee2e2', 'red-200': '#fecaca', 'red-300': '#fca5a5',
    'red-400': '#f87171', 'red-500': '#ef4444', 'red-600': '#dc2626', 'red-700': '#b91c1c',
    'red-800': '#991b1b', 'red-900': '#7f1d1d', 'red-950': '#450a0a',
    'amber-50': '#fffbeb', 'amber-400': '#fbbf24', 'amber-500': '#f59e0b', 'amber-600': '#d97706',
    'orange-400': '#fb923c', 'orange-500': '#f97316', 'orange-600': '#ea580c',
    'yellow-400': '#facc15', 'yellow-500': '#eab308',
    'white': '#ffffff', 'black': '#000000', 'transparent': 'transparent'
  };

  // Extract color classes (bg-*, text-*, border-*)
  const colorRegex = /(?:bg|text|border|from|to|via)-([a-z]+-\d+|white|black)/g;
  let match;
  while ((match = colorRegex.exec(code)) !== null) {
    const colorClass = match[1];
    if (tailwindColors[colorClass] && !colors.has(colorClass)) {
      colors.set(colorClass, { value: tailwindColors[colorClass], tailwind: match[0] });
    }
  }

  // Also extract hex colors directly
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
  while ((match = hexRegex.exec(code)) !== null) {
    const hex = match[0];
    colors.set(hex, { value: hex, tailwind: hex });
  }

  return Array.from(colors.entries()).map(([name, data]) => ({
    name: name,
    value: data.value,
    tailwind: data.tailwind
  }));
}

// Helper: Extract typography from code
function extractTypographyFromCode(code: string): { fontFamily: string[]; fontSizes: string[]; fontWeights: string[] } {
  const fontFamilies = new Set<string>();
  const fontSizes = new Set<string>();
  const fontWeights = new Set<string>();

  const fontFamilyRegex = /font-(?:sans|serif|mono)|font-\[['"]?([^'"\]]+)['"]?\]/g;
  let match;
  while ((match = fontFamilyRegex.exec(code)) !== null) {
    fontFamilies.add(match[1] || match[0].replace('font-', ''));
  }

  const fontSizeRegex = /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[\d+(?:px|rem)\])/g;
  while ((match = fontSizeRegex.exec(code)) !== null) {
    fontSizes.add(match[1]);
  }

  const fontWeightRegex = /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g;
  while ((match = fontWeightRegex.exec(code)) !== null) {
    fontWeights.add(match[1]);
  }

  return {
    fontFamily: Array.from(fontFamilies),
    fontSizes: Array.from(fontSizes),
    fontWeights: Array.from(fontWeights)
  };
}

// Helper: Extract icons from code
function extractIconsFromCode(code: string): string[] {
  const icons = new Set<string>();

  const lucideRegex = /import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/g;
  let match;
  while ((match = lucideRegex.exec(code)) !== null) {
    match[1].split(',').forEach(icon => {
      const trimmed = icon.trim();
      if (trimmed) icons.add(trimmed);
    });
  }

  const jsxIconRegex = /<([A-Z][a-zA-Z]+)\s+(?:className|class)/g;
  const commonIcons = ['Home', 'Menu', 'Search', 'User', 'Settings', 'Plus', 'Minus', 'Check', 'X', 'ChevronRight', 
    'ChevronLeft', 'ChevronDown', 'ChevronUp', 'ArrowRight', 'ArrowLeft', 'Mail', 'Phone', 'Calendar', 'Clock',
    'Heart', 'Star', 'Bell', 'Bookmark', 'Download', 'Upload', 'Edit', 'Trash', 'Copy', 'Share', 'Link',
    'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key', 'Shield', 'AlertCircle', 'Info', 'HelpCircle', 'Loader'];
  while ((match = jsxIconRegex.exec(code)) !== null) {
    if (commonIcons.includes(match[1])) {
      icons.add(match[1]);
    }
  }

  const svgCount = (code.match(/<svg/gi) || []).length;
  if (svgCount > 0) icons.add(`${svgCount} custom SVG icons`);

  return Array.from(icons);
}

// Categorize components into Atomic Design
function categorizeComponents(components: any[]): { atoms: any[]; molecules: any[]; organisms: any[] } {
  const atoms: any[] = [];
  const molecules: any[] = [];
  const organisms: any[] = [];

  components.forEach(comp => {
    const code = comp.code || '';
    const name = comp.name?.toLowerCase() || '';
    
    // Simple heuristic: check for children/composition
    const hasChildren = code.includes('children') || code.includes('{props.') || code.includes('...props');
    const hasMultipleComponents = (code.match(/<[A-Z][a-zA-Z]+/g) || []).length > 3;
    
    // Atoms: buttons, inputs, badges, avatars, icons
    if (name.includes('button') || name.includes('input') || name.includes('badge') || 
        name.includes('avatar') || name.includes('icon') || name.includes('tag') ||
        name.includes('label') || name.includes('text') || name.includes('heading')) {
      atoms.push({ ...comp, atomicType: 'atom' });
    }
    // Organisms: navbar, sidebar, table, dashboard, form, modal
    else if (name.includes('nav') || name.includes('sidebar') || name.includes('table') || 
             name.includes('dashboard') || name.includes('header') || name.includes('footer') ||
             name.includes('modal') || name.includes('dialog') || hasMultipleComponents) {
      organisms.push({ ...comp, atomicType: 'organism' });
    }
    // Molecules: everything else (cards, form fields, search bars, etc.)
    else {
      molecules.push({ ...comp, atomicType: 'molecule' });
    }
  });

  return { atoms, molecules, organisms };
}

const LIBRARY_DOCS_PROMPT = `
**ROLE:** Senior Design System Architect documenting a reverse-engineered UI.

**RULES:**
1. ATOMIC DESIGN: Categorize into Atoms, Molecules, Organisms
2. NO LOREM IPSUM: Use business-specific realistic data
3. CONSISTENCY: Use ONLY detected colors/fonts, never hallucinate

**OUTPUT:** Return ONLY valid JSON:

{
  "docs": [
    {
      "id": "overview",
      "title": "Overview",
      "type": "overview",
      "content": {
        "systemName": "[Project Name] Design System",
        "description": "Enterprise-grade component library extracted from production UI",
        "stats": {
          "totalComponents": [number],
          "atoms": [number],
          "molecules": [number],
          "organisms": [number],
          "colors": [number],
          "icons": [number]
        },
        "accessibilityScore": "[85-98]% AA Compliant",
        "themeType": "[Dark/Light] Theme",
        "projectContext": "[2-3 sentence description of the UI domain and purpose]",
        "quickLinks": [
          { "id": "getting-started", "label": "Getting Started", "icon": "Rocket" },
          { "id": "colors", "label": "Color Tokens", "icon": "Palette" },
          { "id": "typography", "label": "Typography", "icon": "Type" },
          { "id": "iconography", "label": "Icons", "icon": "Grid" },
          { "id": "examples", "label": "Components", "icon": "Layers" }
        ]
      }
    },
    {
      "id": "getting-started",
      "title": "Getting Started",
      "type": "getting-started",
      "content": {
        "description": "Quick guide to implementing this design system.",
        "installation": "npm install @[project-name]/ui",
        "tailwindConfig": "[Generate tailwind.config.js snippet with color tokens]",
        "quickStart": "[React code: import + usage combining 3 components]",
        "dependencies": ["react", "tailwindcss", "lucide-react"],
        "features": [
          { "icon": "Code", "title": "TypeScript Ready", "description": "Fully typed components" },
          { "icon": "Paintbrush", "title": "Tailwind Native", "description": "Utility-first styling" },
          { "icon": "Smartphone", "title": "Responsive", "description": "Mobile-first approach" },
          { "icon": "Accessibility", "title": "Accessible", "description": "WCAG 2.1 AA" }
        ]
      }
    },
    {
      "id": "colors",
      "title": "Colors",
      "type": "colors",
      "content": {
        "description": "Semantic color token system with full shade scales.",
        "primitives": {
          "primary": {
            "name": "[Brand Color Name]",
            "shades": [
              { "shade": "50", "value": "#hex", "usage": "Subtle backgrounds" },
              { "shade": "100", "value": "#hex", "usage": "Hover states" },
              { "shade": "500", "value": "#hex", "usage": "Default" },
              { "shade": "600", "value": "#hex", "usage": "Hover" },
              { "shade": "900", "value": "#hex", "usage": "Text on light" }
            ]
          }
        },
        "semantic": {
          "surface": [
            { "name": "Background", "value": "#hex", "token": "surface-bg", "usage": "Main page background" },
            { "name": "Card", "value": "#hex", "token": "surface-card", "usage": "Cards, panels" },
            { "name": "Modal", "value": "#hex", "token": "surface-modal", "usage": "Overlays" }
          ],
          "content": [
            { "name": "Primary", "value": "#hex", "token": "content-primary", "usage": "Main text" },
            { "name": "Secondary", "value": "#hex", "token": "content-secondary", "usage": "Descriptions" },
            { "name": "Disabled", "value": "#hex", "token": "content-disabled", "usage": "Inactive text" }
          ],
          "action": [
            { "name": "Default", "value": "#hex", "token": "action-default", "usage": "Buttons, links" },
            { "name": "Hover", "value": "#hex", "token": "action-hover", "usage": "Hover state" },
            { "name": "Active", "value": "#hex", "token": "action-active", "usage": "Pressed state" }
          ],
          "feedback": [
            { "name": "Success", "value": "#22c55e", "token": "feedback-success", "wcag": "AA" },
            { "name": "Warning", "value": "#f59e0b", "token": "feedback-warning", "wcag": "AA" },
            { "name": "Error", "value": "#ef4444", "token": "feedback-error", "wcag": "AA" },
            { "name": "Info", "value": "#3b82f6", "token": "feedback-info", "wcag": "AA" }
          ]
        },
        "cssVariables": "[Generate :root CSS with all tokens]"
      }
    },
    {
      "id": "typography",
      "title": "Typography",
      "type": "typography",
      "content": {
        "description": "Type scale with real content examples.",
        "fontFamily": {
          "primary": "[Detected font or Inter, system-ui]",
          "mono": "[Detected mono or ui-monospace]"
        },
        "scale": [
          { "name": "Display", "class": "text-4xl font-bold", "size": "36px", "lineHeight": "1.2", "sample": "[Real headline from UI]" },
          { "name": "H1", "class": "text-3xl font-bold", "size": "30px", "lineHeight": "1.3", "sample": "[Real page title]" },
          { "name": "H2", "class": "text-2xl font-semibold", "size": "24px", "lineHeight": "1.4", "sample": "[Real section header]" },
          { "name": "H3", "class": "text-xl font-semibold", "size": "20px", "lineHeight": "1.4", "sample": "[Real card title]" },
          { "name": "Body", "class": "text-base", "size": "16px", "lineHeight": "1.6", "sample": "[Real paragraph text from UI]" },
          { "name": "Small", "class": "text-sm", "size": "14px", "lineHeight": "1.5", "sample": "[Real caption or label]" },
          { "name": "Caption", "class": "text-xs", "size": "12px", "lineHeight": "1.4", "sample": "[Real metadata text]" }
        ],
        "weights": ["normal (400)", "medium (500)", "semibold (600)", "bold (700)"]
      }
    },
    {
      "id": "iconography",
      "title": "Iconography",
      "type": "iconography",
      "content": {
        "description": "Icon library with functional naming.",
        "library": "lucide-react",
        "sizes": [
          { "name": "sm", "class": "w-4 h-4", "px": "16px", "usage": "Inline, buttons" },
          { "name": "md", "class": "w-5 h-5", "px": "20px", "usage": "Navigation, default" },
          { "name": "lg", "class": "w-6 h-6", "px": "24px", "usage": "Feature icons, headers" }
        ],
        "icons": ["[List ALL detected icons with functional names: IconSearch, IconUser, etc.]"],
        "categories": [
          { "name": "Navigation", "icons": ["Menu", "ChevronRight", "ChevronDown", "ArrowRight", "ArrowLeft", "Home"] },
          { "name": "Actions", "icons": ["Plus", "Edit", "Trash", "Download", "Upload", "Copy", "Share"] },
          { "name": "Status", "icons": ["Check", "X", "AlertCircle", "Info", "Loader"] },
          { "name": "Objects", "icons": ["User", "Settings", "Mail", "Calendar", "Search", "Bell"] }
        ],
        "usage": "import { IconName } from 'lucide-react'"
      }
    },
    {
      "id": "examples",
      "title": "Examples",
      "type": "examples",
      "content": {
        "description": "Component library organized by Atomic Design.",
        "atoms": [
          {
            "name": "[Component Name]",
            "description": "[What it does]",
            "variants": ["primary", "secondary", "ghost"],
            "code": "[Real component code - 5-15 lines]",
            "usage": "[Example with realistic text: 'Save Changes', 'Delete Account']"
          }
        ],
        "molecules": [
          {
            "name": "[Component Name]",
            "description": "[What it does - combination of atoms]",
            "composition": ["[Atom1]", "[Atom2]"],
            "code": "[Real component code]",
            "usage": "[Example: Form Field = Label + Input + Helper Text]"
          }
        ],
        "organisms": [
          {
            "name": "[Component Name]",
            "description": "[Complex section - business logic]",
            "composition": ["[Molecule1]", "[Atom1]", "[Atom2]"],
            "code": "[Real component code]",
            "usage": "[Example: Navbar = Logo + NavLinks + UserDropdown]"
          }
        ]
      }
    }
  ]
}

**CRITICAL:**
- "overview" NOT "welcome"
- Use REAL text from component code, not "Lorem Ipsum"
- Generate FULL color scales (50-950) from detected colors
- Typography samples must be REAL text found in the UI
- Icons must be ONLY the ones actually detected
- Examples must contain REAL code snippets
`;

export async function POST(request: NextRequest) {
  try {
    const { components, tokens, styleInfo, projectName, fullCode } = await request.json();

    if (!components || components.length === 0) {
      return NextResponse.json({ error: "No components provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      }
    });

    // Combine all component code for analysis
    const allCode = components.map((c: any) => c.code || '').join('\n\n') + '\n\n' + (fullCode || '');

    // Extract REAL data from code
    const extractedColors = extractColorsFromCode(allCode);
    const extractedTypography = extractTypographyFromCode(allCode);
    const extractedIcons = extractIconsFromCode(allCode);
    
    // Categorize components
    const { atoms, molecules, organisms } = categorizeComponents(components);

    // Prepare component summary with code
    const componentSummary = components.map((c: any) => ({
      name: c.name,
      category: c.category,
      props: c.props?.map((p: any) => p.name) || [],
      code: c.code?.substring(0, 1000) || ''
    }));

    // Determine theme
    const isDarkTheme = allCode.includes('bg-zinc-900') || allCode.includes('bg-slate-900') || 
                        allCode.includes('bg-black') || allCode.includes('bg-gray-900') ||
                        allCode.includes('#18181b') || allCode.includes('#0a0a0a');

    // Extract real text from code for typography samples
    const textMatches = allCode.match(/>([\w\s]+)</g) || [];
    const realTexts = textMatches
      .map(t => t.replace(/[><]/g, '').trim())
      .filter(t => t.length > 3 && t.length < 50)
      .slice(0, 10);

    const prompt = `${LIBRARY_DOCS_PROMPT}

**PROJECT:** ${projectName || "Design System"}
**THEME:** ${isDarkTheme ? 'Dark Theme (dark backgrounds)' : 'Light Theme'}

**COMPONENTS (${components.length} total):**
- Atoms (${atoms.length}): ${atoms.map(a => a.name).join(', ') || 'None detected'}
- Molecules (${molecules.length}): ${molecules.map(m => m.name).join(', ') || 'None detected'}
- Organisms (${organisms.length}): ${organisms.map(o => o.name).join(', ') || 'None detected'}

**COMPONENT CODE:**
${JSON.stringify(componentSummary.slice(0, 15), null, 2)}

**EXTRACTED COLORS (USE ONLY THESE):**
${JSON.stringify(extractedColors.slice(0, 30), null, 2)}

**TYPOGRAPHY:**
- Fonts: ${extractedTypography.fontFamily.join(', ') || 'Inter, system-ui'}
- Sizes: ${extractedTypography.fontSizes.join(', ') || 'xs, sm, base, lg, xl, 2xl'}
- Weights: ${extractedTypography.fontWeights.join(', ') || 'normal, medium, semibold, bold'}

**ICONS DETECTED:**
${extractedIcons.join(', ') || 'No icons detected'}

**REAL TEXT FROM UI (use for typography samples):**
${realTexts.join(', ') || 'No text detected'}

Generate documentation. Return ONLY valid JSON.`;

    console.log("[Library Docs] Generating with:", {
      components: components.length,
      atoms: atoms.length,
      molecules: molecules.length,
      organisms: organisms.length,
      colors: extractedColors.length,
      icons: extractedIcons.length,
      theme: isDarkTheme ? 'dark' : 'light'
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON from response
    let docsData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        docsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Library Docs] JSON parse error:", parseError);
      return NextResponse.json({ 
        error: "Failed to parse documentation",
        raw: responseText.substring(0, 500)
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: docsData,
      extracted: {
        colors: extractedColors.length,
        icons: extractedIcons.length,
        typography: extractedTypography,
        atoms: atoms.length,
        molecules: molecules.length,
        organisms: organisms.length
      }
    });

  } catch (error: any) {
    console.error("[Library Docs API] Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate documentation" 
    }, { status: 500 });
  }
}
