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
**ROLE: DESIGN SYSTEM DOCUMENTATION GENERATOR**

You are creating LIVE documentation for a specific design system. Use ONLY the data provided - do NOT invent colors, fonts, or components.

**OUTPUT FORMAT:** Return ONLY valid JSON with this exact structure:

{
  "docs": [
    {
      "id": "welcome",
      "title": "Welcome",
      "type": "welcome",
      "content": {
        "headline": "[System Name based on components]",
        "description": "[1-2 sentences about what this design system is for]",
        "stats": {
          "components": [actual count],
          "colors": [actual count],
          "typography": [actual count]
        },
        "principles": [
          { "icon": "Layers", "title": "[principle]", "description": "[based on detected patterns]" }
        ],
        "quickLinks": ["Getting Started", "Colors", "Typography", "Iconography", "Examples"]
      }
    },
    {
      "id": "getting-started",
      "title": "Getting Started",
      "type": "getting-started",
      "content": {
        "description": "[How to use these components]",
        "quickStart": "[Real code example using actual component names from the system]",
        "features": [{ "icon": "[icon]", "title": "[feature]", "description": "[desc]" }]
      }
    },
    {
      "id": "colors",
      "title": "Colors",
      "type": "colors",
      "content": {
        "description": "[Theme description - dark/light]",
        "palette": {
          "background": { "name": "Background", "shades": [{ "name": "[name]", "value": "[#hex]" }] },
          "text": { "name": "Text", "shades": [{ "name": "[name]", "value": "[#hex]" }] },
          "primary": { "name": "Primary", "shades": [{ "name": "[name]", "value": "[#hex]" }] },
          "accent": { "name": "Accent", "shades": [{ "name": "[name]", "value": "[#hex]" }] }
        },
        "usage": [{ "color": "[color-name]", "use": "[where it's used]" }]
      }
    },
    {
      "id": "typography",
      "title": "Typography",
      "type": "typography",
      "content": {
        "description": "[Typography description]",
        "fontFamily": { "primary": "[detected font]", "mono": "[detected mono font]" },
        "scale": [
          { "name": "[name]", "size": "[size]", "weight": "[weight]", "sample": "[sample text]", "px": "[px]", "lineHeight": "[lh]" }
        ]
      }
    },
    {
      "id": "iconography",
      "title": "Iconography",
      "type": "iconography",
      "content": {
        "description": "[Icon system description]",
        "library": "[Lucide/Custom/etc]",
        "icons": ["[actual icon names found]"],
        "categories": [{ "name": "[category]", "icons": ["[icon1]", "[icon2]"] }]
      }
    },
    {
      "id": "examples",
      "title": "Examples",
      "type": "examples",
      "content": {
        "description": "[Examples description]",
        "examples": [
          { "title": "[Real component name]", "description": "[what it does]", "code": "[actual code from component]" }
        ]
      }
    }
  ]
}

**CRITICAL:** 
1. Use ONLY colors from the extracted colors list
2. Use ONLY fonts from the extracted typography
3. Use ONLY icons from the extracted icons list  
4. Use ONLY component names from the provided list
5. Examples must use REAL code snippets from components
6. If dark theme detected (zinc-900, slate-900 backgrounds), describe as dark theme

Return ONLY valid JSON.
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
