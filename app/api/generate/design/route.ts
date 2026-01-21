import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPresetById, EnterprisePreset } from "@/lib/enterprise-presets";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL_NAME = "gemini-3-pro-preview";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

interface DesignGenerationRequest {
  projectName: string;
  generatedCode: string;
  presetId?: string;
  extractedColors?: Array<{ name: string; hex: string }>;
  industry?: string;
  detectedComponents?: string[];
  screenCount?: number;
}

// Build a context-aware, individualized design system prompt
function buildDesignPrompt(preset: EnterprisePreset | null, request: DesignGenerationRequest): string {
  const presetInfo = preset ? `
BASE PRESET: ${preset.name}
INDUSTRY: ${preset.industry}
PRESET COLORS (as starting point):
- Primary: ${preset.colors.light.primary}
- Secondary: ${preset.colors.light.secondary}
- Accent: ${preset.colors.light.accent}
- Success: ${preset.colors.light.success}
- Error: ${preset.colors.light.error}
` : "BASE PRESET: None - generate modern SaaS design";

  return `You are creating a CUSTOM design system for a specific enterprise application.
This is NOT a generic template - it's tailored to THIS app based on the analyzed code.

${presetInfo}

PROJECT CONTEXT:
- Name: ${request.projectName}
- Industry: ${request.industry || "Enterprise SaaS"}
- Screens detected: ${request.screenCount || "Multiple"}
${request.extractedColors?.length ? `- Colors found in original UI: ${request.extractedColors.map(c => `${c.name}(${c.hex})`).join(", ")}` : ""}

YOUR TASK:
1. Analyze the code below to identify:
   - What components are used (tables, charts, forms, cards, etc.)
   - What color scheme the original UI has
   - What data types are displayed (financial, user data, analytics, etc.)
   - What interactions exist (buttons, filters, navigation)

2. Generate a CUSTOMIZED design system that:
   - Uses the preset as a BASE but ADAPTS it to this specific app
   - Includes SPECIFIC component tokens for components found in the code
   - Modernizes the color scheme while maintaining app context
   - Is WCAG AA compliant

OUTPUT FORMAT (JSON):
{
  "name": "[Project Name] Design System",
  "description": "Customized design system for [specific app description based on analysis]",
  "version": "1.0.0",
  
  "appContext": {
    "detectedComponents": ["Sidebar", "DataTable", "StatCard", "AreaChart", ...],
    "dataTypes": ["financial", "user", "analytics", ...],
    "interactions": ["navigation", "filtering", "sorting", ...],
    "originalColorScheme": "dark/light/mixed"
  },
  
  "colors": {
    "brand": {
      "primary": { "hex": "#...", "name": "...", "usage": "Primary actions, active states", "contrast": "AA" },
      "secondary": { "hex": "#...", "name": "...", "usage": "..." },
      "accent": { "hex": "#...", "name": "...", "usage": "..." }
    },
    "semantic": {
      "success": { "hex": "#...", "usage": "Successful transactions, positive values" },
      "error": { "hex": "#...", "usage": "Failed payments, errors, negative values" },
      "warning": { "hex": "#...", "usage": "Pending states, alerts" },
      "info": { "hex": "#...", "usage": "Informational badges, tooltips" }
    },
    "neutral": {
      "background": "#...",
      "surface": "#...",
      "border": "#...",
      "text": { "primary": "#...", "secondary": "#...", "muted": "#..." }
    },
    "dark": {
      "background": "#...",
      "surface": "#...",
      "border": "#...",
      "text": { "primary": "#...", "secondary": "#...", "muted": "#..." }
    },
    "chart": {
      "colors": ["#...", "#...", "#...", "#...", "#..."],
      "gradients": ["linear-gradient(...)"]
    }
  },
  
  "typography": {
    "fontFamily": { "primary": "...", "mono": "..." },
    "scale": {
      "display": { "size": "...", "weight": "...", "lineHeight": "..." },
      "h1": { "size": "...", "weight": "...", "lineHeight": "..." },
      "h2": { ... },
      "h3": { ... },
      "body": { ... },
      "small": { ... },
      "caption": { ... }
    }
  },
  
  "spacing": {
    "baseUnit": 4,
    "scale": { "0": "0", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "6": "24px", "8": "32px", "12": "48px" }
  },
  
  "borderRadius": {
    "none": "0", "sm": "4px", "md": "6px", "lg": "8px", "xl": "12px", "full": "9999px"
  },
  
  "shadows": {
    "sm": "...", "md": "...", "lg": "...", "xl": "..."
  },
  
  "components": {
    // SPECIFIC to components found in the code!
    "sidebar": {
      "width": "256px",
      "background": "...",
      "itemPadding": "...",
      "activeItemBg": "...",
      "hoverBg": "..."
    },
    "dataTable": {
      "headerBg": "...",
      "rowHover": "...",
      "cellPadding": "...",
      "borderColor": "...",
      "stripedBg": "..."
    },
    "statCard": {
      "padding": "...",
      "borderRadius": "...",
      "shadow": "...",
      "iconSize": "..."
    },
    "chart": {
      "height": "...",
      "axisColor": "...",
      "gridColor": "...",
      "tooltipBg": "..."
    },
    "button": {
      "primary": { "bg": "...", "text": "...", "hover": "...", "padding": "..." },
      "secondary": { ... },
      "ghost": { ... }
    },
    "input": {
      "height": "...",
      "padding": "...",
      "border": "...",
      "focusBorder": "...",
      "focusRing": "..."
    },
    "badge": {
      "success": { "bg": "...", "text": "..." },
      "error": { "bg": "...", "text": "..." },
      "warning": { "bg": "...", "text": "..." },
      "default": { "bg": "...", "text": "..." }
    },
    "modal": {
      "maxWidth": "...",
      "borderRadius": "...",
      "shadow": "...",
      "overlayBg": "..."
    }
  },
  
  "tailwindConfig": {
    "extend": {
      "colors": { ... },
      "fontFamily": { ... },
      "borderRadius": { ... }
    }
  },
  
  "cssVariables": ":root { --color-primary: ...; ... }",
  
  "recommendations": [
    "Use primary color for main CTAs and active navigation",
    "Consider adding motion tokens for chart animations",
    "..."
  ]
}

IMPORTANT:
- Make colors SPECIFIC to the app context (financial = trust blues, error handling colors)
- Include ONLY components that are actually in the code
- Modernize while keeping the app's character
- All colors must be WCAG AA compliant (4.5:1 contrast)

ANALYZE THIS CODE:
`;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const body: DesignGenerationRequest = await request.json();
    const { projectName, generatedCode, presetId, extractedColors, industry, screenCount } = body;

    // Get preset if specified
    const preset = presetId ? getPresetById(presetId) : null;
    
    // Build customized prompt
    const prompt = buildDesignPrompt(preset, body);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.4, // Lower for more consistent output
        maxOutputTokens: 16384,
      },
    });

    const result = await model.generateContent([
      { text: prompt },
      { text: `\n\nCODE TO ANALYZE:\n${generatedCode?.slice(0, 15000) || "No code provided"}\n\nGenerate the customized design system JSON:` }
    ]);

    const responseText = result.response.text();
    
    // Extract JSON
    let jsonContent: any;
    try {
      jsonContent = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonContent = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse JSON from response");
        }
      }
    }

    // Add preset info to response
    if (preset) {
      jsonContent.basePreset = {
        id: preset.id,
        name: preset.name,
        industry: preset.industry
      };
    }

    return NextResponse.json({
      success: true,
      data: jsonContent,
      generatedAt: new Date().toISOString(),
      model: MODEL_NAME
    });

  } catch (error: any) {
    console.error("[Generate Design] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate design system" },
      { status: 500 }
    );
  }
}
