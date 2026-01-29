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

  // Font family
  const fontFamilyRegex = /font-(?:sans|serif|mono)|font-\[['"]?([^'"\]]+)['"]?\]/g;
  let match;
  while ((match = fontFamilyRegex.exec(code)) !== null) {
    fontFamilies.add(match[1] || match[0].replace('font-', ''));
  }

  // Font sizes (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, etc.)
  const fontSizeRegex = /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[\d+(?:px|rem)\])/g;
  while ((match = fontSizeRegex.exec(code)) !== null) {
    fontSizes.add(match[1]);
  }

  // Font weights
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

// Helper: Extract icons from code (Lucide icons, SVG, emoji)
function extractIconsFromCode(code: string): string[] {
  const icons = new Set<string>();

  // Lucide icon imports
  const lucideRegex = /import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/g;
  let match;
  while ((match = lucideRegex.exec(code)) !== null) {
    match[1].split(',').forEach(icon => {
      const trimmed = icon.trim();
      if (trimmed) icons.add(trimmed);
    });
  }

  // Lucide components in JSX
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

  // SVG icons (just count them)
  const svgCount = (code.match(/<svg/gi) || []).length;
  if (svgCount > 0) icons.add(`${svgCount} custom SVG icons`);

  // Emoji icons
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = code.match(emojiRegex) || [];
  if (emojis.length > 0) icons.add(`Emojis: ${[...new Set(emojis)].join(' ')}`);

  return Array.from(icons);
}

const LIBRARY_DOCS_PROMPT = `
**ROLE: PROFESSIONAL DESIGN SYSTEM DOCUMENTATION GENERATOR**

Create comprehensive, production-ready documentation for this design system. Include ALL interactive states, accessibility info, and real code examples.

**OUTPUT FORMAT:** Return ONLY valid JSON with this exact structure:

{
  "docs": [
    {
      "id": "welcome",
      "title": "Welcome",
      "type": "welcome",
      "content": {
        "headline": "[System Name - derive from project/components]",
        "tagline": "[One-liner describing the system's purpose]",
        "description": "[2-3 sentences about design philosophy and target use cases]",
        "version": "1.0.0",
        "stats": {
          "components": [count],
          "colors": [count],
          "categories": [count]
        },
        "principles": [
          { "icon": "Layers", "title": "Composable", "description": "Build complex UIs from simple, reusable pieces" },
          { "icon": "Palette", "title": "Consistent", "description": "Unified visual language across all components" },
          { "icon": "Accessibility", "title": "Accessible", "description": "WCAG 2.1 AA compliant by default" },
          { "icon": "Zap", "title": "Performant", "description": "Optimized for speed and efficiency" }
        ],
        "quickLinks": [
          { "id": "getting-started", "label": "Getting Started" },
          { "id": "colors", "label": "Colors" },
          { "id": "typography", "label": "Typography" },
          { "id": "spacing", "label": "Spacing" },
          { "id": "components", "label": "Components" }
        ]
      }
    },
    {
      "id": "getting-started",
      "title": "Getting Started",
      "type": "getting-started",
      "content": {
        "description": "Quick guide to using this design system in your project.",
        "installation": "npm install [package-name] or copy components directly",
        "quickStart": "[Real import + usage code for main component]",
        "dependencies": ["react", "tailwindcss", "lucide-react"],
        "features": [
          { "icon": "Code", "title": "React + TypeScript", "description": "Fully typed components" },
          { "icon": "Paintbrush", "title": "Tailwind CSS", "description": "Utility-first styling" },
          { "icon": "Smartphone", "title": "Responsive", "description": "Mobile-first design" }
        ]
      }
    },
    {
      "id": "colors",
      "title": "Colors",
      "type": "colors",
      "content": {
        "description": "[Dark/Light theme description based on detected colors]",
        "palette": {
          "background": { "name": "Background", "shades": [{ "name": "[zinc-900 etc]", "value": "#hex", "usage": "Main background" }] },
          "surface": { "name": "Surface", "shades": [{ "name": "[zinc-800 etc]", "value": "#hex", "usage": "Cards, panels" }] },
          "text": { "name": "Text", "shades": [{ "name": "[white/zinc-100]", "value": "#hex", "usage": "Primary text" }, { "name": "[zinc-400]", "value": "#hex", "usage": "Secondary text" }] },
          "primary": { "name": "Primary", "shades": [{ "name": "[detected accent]", "value": "#hex", "usage": "Primary actions, links" }] },
          "semantic": { "name": "Semantic", "shades": [{ "name": "Success", "value": "#22c55e", "usage": "Success states" }, { "name": "Error", "value": "#ef4444", "usage": "Error states" }, { "name": "Warning", "value": "#f59e0b", "usage": "Warnings" }] }
        },
        "usage": [
          { "color": "background", "use": "Page backgrounds, main containers" },
          { "color": "surface", "use": "Cards, modals, dropdowns" },
          { "color": "primary", "use": "CTAs, links, focus rings" }
        ],
        "accessibility": "All color combinations meet WCAG 2.1 AA contrast requirements (4.5:1 for text, 3:1 for UI)."
      }
    },
    {
      "id": "typography",
      "title": "Typography",
      "type": "typography",
      "content": {
        "description": "Type scale and font usage guidelines.",
        "fontFamily": { 
          "primary": "[detected or Inter, system-ui]", 
          "mono": "[detected or ui-monospace, monospace]" 
        },
        "scale": [
          { "name": "Display", "class": "text-4xl", "size": "36px", "weight": "bold", "lineHeight": "1.2", "sample": "Hero Headlines" },
          { "name": "H1", "class": "text-3xl", "size": "30px", "weight": "bold", "lineHeight": "1.3", "sample": "Page Title" },
          { "name": "H2", "class": "text-2xl", "size": "24px", "weight": "semibold", "lineHeight": "1.4", "sample": "Section Header" },
          { "name": "H3", "class": "text-xl", "size": "20px", "weight": "semibold", "lineHeight": "1.4", "sample": "Card Title" },
          { "name": "Body", "class": "text-base", "size": "16px", "weight": "normal", "lineHeight": "1.6", "sample": "Body text for paragraphs and content." },
          { "name": "Small", "class": "text-sm", "size": "14px", "weight": "normal", "lineHeight": "1.5", "sample": "Captions and labels" },
          { "name": "XS", "class": "text-xs", "size": "12px", "weight": "medium", "lineHeight": "1.4", "sample": "BADGES & TAGS" }
        ],
        "weights": ["normal (400)", "medium (500)", "semibold (600)", "bold (700)"]
      }
    },
    {
      "id": "spacing",
      "title": "Spacing",
      "type": "spacing",
      "content": {
        "description": "Consistent spacing scale based on 4px grid.",
        "scale": [
          { "name": "0", "value": "0px", "class": "p-0, m-0, gap-0" },
          { "name": "1", "value": "4px", "class": "p-1, m-1, gap-1" },
          { "name": "2", "value": "8px", "class": "p-2, m-2, gap-2" },
          { "name": "3", "value": "12px", "class": "p-3, m-3, gap-3" },
          { "name": "4", "value": "16px", "class": "p-4, m-4, gap-4" },
          { "name": "6", "value": "24px", "class": "p-6, m-6, gap-6" },
          { "name": "8", "value": "32px", "class": "p-8, m-8, gap-8" },
          { "name": "12", "value": "48px", "class": "p-12, m-12, gap-12" }
        ],
        "usage": [
          { "context": "Component padding", "recommended": "p-4 (16px)" },
          { "context": "Card gaps", "recommended": "gap-4 (16px)" },
          { "context": "Section margins", "recommended": "my-8 (32px)" }
        ]
      }
    },
    {
      "id": "shadows",
      "title": "Shadows & Effects",
      "type": "shadows",
      "content": {
        "description": "Elevation and depth system.",
        "shadows": [
          { "name": "sm", "class": "shadow-sm", "usage": "Subtle elevation for inputs" },
          { "name": "md", "class": "shadow-md", "usage": "Cards and dropdowns" },
          { "name": "lg", "class": "shadow-lg", "usage": "Modals and popovers" },
          { "name": "xl", "class": "shadow-xl", "usage": "Floating elements" }
        ],
        "borders": [
          { "name": "Default", "class": "border border-zinc-700", "usage": "Card borders, dividers" },
          { "name": "Focus", "class": "ring-2 ring-primary", "usage": "Focus states" }
        ],
        "radius": [
          { "name": "sm", "class": "rounded-sm", "value": "2px" },
          { "name": "md", "class": "rounded-md", "value": "6px" },
          { "name": "lg", "class": "rounded-lg", "value": "8px" },
          { "name": "xl", "class": "rounded-xl", "value": "12px" },
          { "name": "full", "class": "rounded-full", "value": "9999px" }
        ]
      }
    },
    {
      "id": "iconography",
      "title": "Iconography",
      "type": "iconography",
      "content": {
        "description": "Icon system using Lucide React icons.",
        "library": "lucide-react",
        "sizes": [
          { "name": "sm", "class": "w-4 h-4", "usage": "Inline, buttons" },
          { "name": "md", "class": "w-5 h-5", "usage": "Navigation, default" },
          { "name": "lg", "class": "w-6 h-6", "usage": "Feature icons" }
        ],
        "icons": ["[list of detected icons from code]"],
        "categories": [
          { "name": "Navigation", "icons": ["Menu", "ChevronRight", "ChevronDown", "ArrowRight"] },
          { "name": "Actions", "icons": ["Plus", "Edit", "Trash", "Download", "Upload"] },
          { "name": "Status", "icons": ["Check", "X", "AlertCircle", "Info"] }
        ],
        "usage": "Import icons individually: import { IconName } from 'lucide-react'"
      }
    },
    {
      "id": "components",
      "title": "Components",
      "type": "components",
      "content": {
        "description": "Interactive UI components with states and variants.",
        "categories": [
          {
            "name": "Buttons",
            "components": [
              {
                "name": "Button",
                "description": "Primary action button with multiple variants",
                "variants": ["primary", "secondary", "ghost", "destructive"],
                "states": {
                  "default": "bg-primary text-white",
                  "hover": "hover:bg-primary/90",
                  "active": "active:scale-95",
                  "disabled": "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus": "focus:ring-2 focus:ring-primary focus:ring-offset-2"
                },
                "sizes": ["sm (h-8 px-3)", "md (h-10 px-4)", "lg (h-12 px-6)"],
                "code": "<button className=\\"px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors\\">Click me</button>"
              }
            ]
          },
          {
            "name": "Inputs",
            "components": [
              {
                "name": "Input",
                "description": "Text input field",
                "states": {
                  "default": "border-zinc-700 bg-zinc-900",
                  "hover": "hover:border-zinc-600",
                  "focus": "focus:border-primary focus:ring-1 focus:ring-primary",
                  "error": "border-red-500 focus:ring-red-500",
                  "disabled": "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                },
                "code": "<input type=\\"text\\" className=\\"w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary\\" />"
              }
            ]
          },
          {
            "name": "Cards",
            "components": [
              {
                "name": "Card",
                "description": "Content container with optional header/footer",
                "states": {
                  "default": "bg-zinc-900 border border-zinc-800",
                  "hover": "hover:border-zinc-700 hover:shadow-lg",
                  "interactive": "cursor-pointer transition-all"
                },
                "code": "<div className=\\"p-6 bg-zinc-900 border border-zinc-800 rounded-xl\\">Card content</div>"
              }
            ]
          }
        ]
      }
    },
    {
      "id": "examples",
      "title": "Examples",
      "type": "examples",
      "content": {
        "description": "Real-world usage examples from the codebase.",
        "examples": [
          {
            "title": "[First actual component name]",
            "description": "[What this component does]",
            "code": "[Actual code snippet from the component - 10-20 lines max]",
            "props": ["prop1: string", "prop2?: boolean"]
          }
        ]
      }
    },
    {
      "id": "accessibility",
      "title": "Accessibility",
      "type": "accessibility", 
      "content": {
        "description": "Accessibility guidelines and requirements.",
        "standards": "WCAG 2.1 Level AA",
        "checklist": [
          { "item": "Color contrast", "requirement": "4.5:1 for text, 3:1 for UI elements", "status": "pass" },
          { "item": "Focus indicators", "requirement": "Visible focus rings on all interactive elements", "status": "pass" },
          { "item": "Keyboard navigation", "requirement": "All controls accessible via keyboard", "status": "pass" },
          { "item": "Screen readers", "requirement": "Proper ARIA labels and semantic HTML", "status": "pass" }
        ],
        "bestPractices": [
          "Use semantic HTML elements (button, nav, main, etc.)",
          "Add aria-label for icon-only buttons",
          "Ensure sufficient color contrast",
          "Support keyboard navigation (Tab, Enter, Escape)",
          "Provide loading and error states"
        ]
      }
    }
  ]
}

**CRITICAL RULES:**
1. Use ONLY colors actually found in the extracted colors list
2. Use ONLY icons actually found in the code
3. Use ONLY real component names from the provided list
4. Examples MUST contain actual code snippets from the components (not made up)
5. Detect theme (dark if zinc-900/slate-900/black backgrounds)
6. Include ALL button/input states: default, hover, active, focus, disabled
7. Make component code examples copy-pasteable and working

Return ONLY valid JSON. No markdown, no explanation.
`;

export async function POST(request: NextRequest) {
  try {
    const { components, tokens, styleInfo, projectName, fullCode } = await request.json();

    if (!components || components.length === 0) {
      return NextResponse.json({ error: "No components provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      }
    });

    // Combine all component code for analysis
    const allCode = components.map((c: any) => c.code || '').join('\n\n') + '\n\n' + (fullCode || '');

    // Extract REAL data from code
    const extractedColors = extractColorsFromCode(allCode);
    const extractedTypography = extractTypographyFromCode(allCode);
    const extractedIcons = extractIconsFromCode(allCode);

    // Prepare component summary with MORE code for AI
    const componentSummary = components.map((c: any) => ({
      name: c.name,
      category: c.category,
      props: c.props?.map((p: any) => p.name) || [],
      code: c.code?.substring(0, 800) || '' // More code for better analysis
    }));

    // Determine theme
    const isDarkTheme = allCode.includes('bg-zinc-900') || allCode.includes('bg-slate-900') || 
                        allCode.includes('bg-black') || allCode.includes('bg-gray-900');

    const prompt = `${LIBRARY_DOCS_PROMPT}

**PROJECT NAME:** ${projectName || "Design System"}
**THEME:** ${isDarkTheme ? 'Dark Theme' : 'Light Theme'}

**COMPONENTS (${components.length} total):**
${JSON.stringify(componentSummary, null, 2)}

**EXTRACTED COLORS (USE THESE EXACT COLORS):**
${JSON.stringify(extractedColors.slice(0, 25), null, 2)}

**EXTRACTED TYPOGRAPHY (USE THESE):**
Font Families: ${extractedTypography.fontFamily.join(', ') || 'Inter, system-ui'}
Font Sizes: ${extractedTypography.fontSizes.join(', ') || 'xs, sm, base, lg, xl, 2xl'}
Font Weights: ${extractedTypography.fontWeights.join(', ') || 'normal, medium, semibold, bold'}

**EXTRACTED ICONS (USE THESE):**
${extractedIcons.slice(0, 20).join(', ') || 'No icons detected'}

**STYLE INFO:**
${JSON.stringify(styleInfo || {}, null, 2)}

Generate LIVE documentation using ONLY the extracted data above. Do NOT invent colors or icons that don't exist in the code.

Return ONLY valid JSON.`;

    console.log("[Library Docs] Generating with:", {
      components: components.length,
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
        typography: extractedTypography
      }
    });

  } catch (error: any) {
    console.error("[Library Docs API] Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate documentation" 
    }, { status: 500 });
  }
}
