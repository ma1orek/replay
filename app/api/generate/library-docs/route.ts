import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const LIBRARY_DOCS_PROMPT = `
**ROLE: DESIGN SYSTEM DOCUMENTATION GENERATOR**

You are an expert at creating comprehensive, professional design system documentation based on analyzed components and design tokens.

**INPUT:** You will receive:
1. List of components with their code, props, and categories
2. Design tokens (colors, typography, spacing)
3. Style information from the analyzed UI

**OUTPUT:** Generate 6 documentation sections in JSON format:

{
  "docs": [
    {
      "id": "welcome",
      "title": "Welcome",
      "type": "welcome",
      "content": {
        "headline": "Your Design System Name",
        "description": "A comprehensive description of this design system...",
        "stats": {
          "components": 12,
          "variants": 24,
          "tokens": 45
        },
        "principles": [
          { "icon": "Layers", "title": "Consistent", "description": "Unified visual language across all components" },
          { "icon": "Zap", "title": "Performant", "description": "Optimized for speed and accessibility" },
          { "icon": "Puzzle", "title": "Modular", "description": "Mix and match components freely" }
        ],
        "quickLinks": ["Getting Started", "Colors", "Typography", "Iconography", "Examples"]
      }
    },
    {
      "id": "getting-started",
      "title": "Getting Started",
      "type": "getting-started",
      "content": {
        "description": "Get up and running with your design system in minutes.",
        "installation": {
          "npm": "npm install @company/design-system",
          "yarn": "yarn add @company/design-system"
        },
        "quickStart": "// Import your components\\nimport { Button, Card } from '@company/design-system';\\n\\n// Use them in your app\\nexport default function App() {\\n  return (\\n    <Card>\\n      <Button>Click me</Button>\\n    </Card>\\n  );\\n}",
        "features": [
          { "icon": "Package", "title": "Tree-shakeable", "description": "Only import what you need" },
          { "icon": "Palette", "title": "Themeable", "description": "Customize with CSS variables" },
          { "icon": "Accessibility", "title": "Accessible", "description": "WCAG 2.1 AA compliant" }
        ]
      }
    },
    {
      "id": "colors",
      "title": "Colors",
      "type": "colors",
      "content": {
        "description": "The color palette provides a harmonious range of colors for consistent UI design.",
        "palette": {
          "primary": { "name": "Primary", "shades": [{ "name": "50", "value": "#eff6ff" }, { "name": "500", "value": "#3b82f6" }, { "name": "900", "value": "#1e3a8a" }] },
          "neutral": { "name": "Neutral", "shades": [{ "name": "50", "value": "#fafafa" }, { "name": "500", "value": "#71717a" }, { "name": "900", "value": "#18181b" }] },
          "success": { "name": "Success", "shades": [{ "name": "500", "value": "#22c55e" }] },
          "error": { "name": "Error", "shades": [{ "name": "500", "value": "#ef4444" }] }
        },
        "usage": [
          { "color": "primary-500", "use": "Primary actions, links, active states" },
          { "color": "neutral-900", "use": "Body text, headings" },
          { "color": "neutral-500", "use": "Secondary text, borders" }
        ]
      }
    },
    {
      "id": "typography",
      "title": "Typography",
      "type": "typography",
      "content": {
        "description": "Typography creates clear hierarchies and improves readability across all interfaces.",
        "fontFamily": {
          "primary": "Inter",
          "mono": "JetBrains Mono"
        },
        "scale": [
          { "name": "Display", "size": "4xl", "weight": "bold", "sample": "Display Heading", "px": "36px", "lineHeight": "1.1" },
          { "name": "H1", "size": "3xl", "weight": "bold", "sample": "Heading 1", "px": "30px", "lineHeight": "1.2" },
          { "name": "H2", "size": "2xl", "weight": "semibold", "sample": "Heading 2", "px": "24px", "lineHeight": "1.3" },
          { "name": "H3", "size": "xl", "weight": "semibold", "sample": "Heading 3", "px": "20px", "lineHeight": "1.4" },
          { "name": "Body", "size": "base", "weight": "normal", "sample": "Body text for paragraphs and general content.", "px": "16px", "lineHeight": "1.5" },
          { "name": "Small", "size": "sm", "weight": "normal", "sample": "Small text for captions and labels.", "px": "14px", "lineHeight": "1.5" },
          { "name": "Caption", "size": "xs", "weight": "medium", "sample": "CAPTION TEXT", "px": "12px", "lineHeight": "1.4" }
        ]
      }
    },
    {
      "id": "iconography",
      "title": "Iconography",
      "type": "iconography",
      "content": {
        "description": "Icons provide visual cues and improve usability. We use Lucide icons for consistency.",
        "library": "Lucide React",
        "usage": "import { Icon } from 'lucide-react';",
        "sizes": [
          { "name": "xs", "size": 12 },
          { "name": "sm", "size": 16 },
          { "name": "md", "size": 20 },
          { "name": "lg", "size": 24 },
          { "name": "xl", "size": 32 }
        ],
        "categories": [
          { "name": "Navigation", "icons": ["Home", "Menu", "ChevronRight", "ArrowLeft", "Search"] },
          { "name": "Actions", "icons": ["Plus", "Edit", "Trash", "Download", "Upload"] },
          { "name": "Status", "icons": ["Check", "X", "AlertCircle", "Info", "Loader"] },
          { "name": "Content", "icons": ["File", "Image", "Video", "Link", "Code"] }
        ]
      }
    },
    {
      "id": "examples",
      "title": "Examples",
      "type": "examples",
      "content": {
        "description": "Real-world examples showing how to combine components effectively.",
        "examples": [
          {
            "title": "Dashboard Card",
            "description": "A metric card showing key statistics",
            "code": "<div className=\\"p-6 bg-zinc-900 rounded-xl border border-zinc-800\\">\\n  <span className=\\"text-xs text-zinc-500 uppercase\\">Revenue</span>\\n  <div className=\\"text-3xl font-bold text-white mt-1\\">$45,231</div>\\n  <span className=\\"text-xs text-green-500\\">+20.1% from last month</span>\\n</div>"
          },
          {
            "title": "Action Button Group",
            "description": "Primary and secondary button combination",
            "code": "<div className=\\"flex gap-3\\">\\n  <button className=\\"px-4 py-2 bg-blue-600 text-white rounded-lg\\">Save</button>\\n  <button className=\\"px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg\\">Cancel</button>\\n</div>"
          },
          {
            "title": "Form Field",
            "description": "Input with label and helper text",
            "code": "<div className=\\"space-y-2\\">\\n  <label className=\\"text-sm font-medium text-white\\">Email</label>\\n  <input type=\\"email\\" className=\\"w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg\\" />\\n  <p className=\\"text-xs text-zinc-500\\">We\\'ll never share your email.</p>\\n</div>"
          }
        ]
      }
    }
  ]
}

**CRITICAL RULES:**
1. Analyze the actual components and tokens provided - don't use generic examples
2. Extract REAL colors from the design tokens
3. Identify the ACTUAL typography used in components
4. Create examples based on REAL components from the system
5. Match the visual style (dark/light theme) of the design system
6. Include actual component names in examples
7. The Welcome page headline should reflect what the design system is for (e.g., "Dashboard UI Kit", "E-commerce Design System")

**OUTPUT:** Return ONLY valid JSON, no markdown code blocks.
`;

export async function POST(request: NextRequest) {
  try {
    const { components, tokens, styleInfo, projectName } = await request.json();

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

    // Prepare component summary for AI
    const componentSummary = components.map((c: any) => ({
      name: c.name,
      category: c.category,
      props: c.props?.map((p: any) => p.name),
      codeSnippet: c.code?.substring(0, 200) // First 200 chars only
    }));

    const prompt = `${LIBRARY_DOCS_PROMPT}

**PROJECT NAME:** ${projectName || "Design System"}

**COMPONENTS (${components.length} total):**
${JSON.stringify(componentSummary, null, 2)}

**DESIGN TOKENS:**
${JSON.stringify(tokens || {}, null, 2)}

**STYLE INFO:**
${JSON.stringify(styleInfo || {}, null, 2)}

Generate comprehensive documentation for this specific design system. Make sure:
1. Welcome page reflects what this design system is for (based on component names)
2. Colors are extracted from the actual tokens
3. Typography matches the detected font families
4. Examples use actual components from this system
5. Iconography lists icons actually used in components

Return ONLY valid JSON.`;

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
      data: docsData 
    });

  } catch (error: any) {
    console.error("[Library Docs API] Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate documentation" 
    }, { status: 500 });
  }
}
